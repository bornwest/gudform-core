/**
 * Migrate forms, submissions and uploaded files from OpnForm to GudForm.
 *
 * Everything goes through the GudForm REST API: forms, questions, file uploads and
 * submissions (including original dates and in-progress status).
 *
 * Usage:
 *   OPNFORM_URL=https://opnform.example.com \
 *   OPNFORM_TOKEN=<OpnForm personal access token> \
 *   GUDFORM_URL=http://localhost:3080 \
 *   GUDFORM_API_KEY=ff_... \
 *   npx tsx scripts/migrate-from-opnform.ts [--dry-run] [--form <opnform id or slug>] [--no-publish] [--state <file>]
 *
 * Optional env: GUDFORM_COLLECTION_ID (put every imported form in this collection)
 *
 * What it does per form:
 *  - creates the form + questions, imports every submission (completed and in-progress)
 *  - sets startedAt = OpnForm created_at (UTC); completedAt = created_at + completion_time
 *    seconds; in-progress submissions get completedAt = null (shown as Partial)
 *  - publishes the form if it was public in OpnForm (skip with --no-publish)
 *
 * Re-runnable: progress is saved to the state file (default ./opnform-migration-state.json),
 * so forms/submissions already migrated are skipped.
 *
 * Known limits:
 *  - Form slugs are regenerated, so public URLs change.
 *  - Logic, matrix/payment/password fields and layout blocks other than text are not carried over.
 *  - GudForm FILE_UPLOAD holds one file per answer; extra files are reported, not imported.
 */
import fs from "node:fs";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const DRY = flag("dry-run");
const PUBLISH = !flag("no-publish");
const ONLY = opt("form");
const STATE_FILE = opt("state") || "opnform-migration-state.json";

const need = (k: string) => {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var ${k}`);
    process.exit(1);
  }
  return v.replace(/\/+$/, "");
};
const OPN = need("OPNFORM_URL");
const OPN_TOKEN = need("OPNFORM_TOKEN");
const GUD = need("GUDFORM_URL");
const GUD_KEY = need("GUDFORM_API_KEY");
const COLLECTION_ID = process.env.GUDFORM_COLLECTION_ID;
const parseUtc = (s: string) => new Date(`${s.replace(" ", "T")}Z`);

const CHOICE_SEPARATOR = "|||";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
  webp: "image/webp", svg: "image/svg+xml", pdf: "application/pdf",
  csv: "text/csv", txt: "text/plain", doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

type Json = any;
type FieldMap = {
  opnId: string;
  gudIndex: number; // index in the questions array we send
  opnType: string;
  gudType: string;
  required: boolean;
  choices?: string[];
};
type FormState = {
  gudFormId: string;
  questionIds: Record<string, string>; // opnFieldId -> gud questionId
  submissions: Record<string, { responseId: string; originalCreatedAt: string }>;
  finalized?: boolean;
};
type State = { forms: Record<string, FormState> };

const state: State = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8"))
  : { forms: {} };
const saveState = () => {
  if (!DRY) fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const report: string[] = [];
const note = (msg: string) => {
  report.push(msg);
  console.warn(`  ! ${msg}`);
};

// ---------- HTTP helpers ----------

async function http(url: string, init: RequestInit & { retries?: number } = {}) {
  const retries = init.retries ?? 5;
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (e) {
      const cause = (e as { cause?: { code?: string; message?: string } }).cause;
      if (attempt < retries) {
        await sleep(1000 * (attempt + 1)); // transient socket errors: back off and retry
        continue;
      }
      throw new Error(`Request to ${url.split("?")[0]} failed: ${cause?.code ?? ""} ${cause?.message ?? (e as Error).message}`);
    }
    if (res.status === 429 && attempt < retries) {
      const wait = Number(res.headers.get("retry-after") || 60) * 1000;
      console.log(`  rate limited, waiting ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    return res;
  }
}

async function opn(path: string): Promise<Json> {
  const res = await http(`${OPN}/api${path}`, {
    headers: { Authorization: `Bearer ${OPN_TOKEN}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`OpnForm ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function gud(method: string, path: string, body?: Json): Promise<Json> {
  const res = await http(`${GUD}/api/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${GUD_KEY}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GudForm ${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
}

// ---------- Form mapping ----------

const names = (opts: Json[] | undefined) =>
  (opts ?? []).map((o) => (typeof o === "string" ? o : o?.name ?? o?.id)).filter(Boolean) as string[];

function mapField(f: Json): { question: Json; meta: Omit<FieldMap, "gudIndex"> } | null {
  const t: string = f.type;
  const base = {
    title: String(f.name || "Untitled").slice(0, 500),
    description: f.help ? String(f.help).replace(/<[^>]*>/g, "").slice(0, 5000) : undefined,
    // Required is restored after the import so historical answers can't fail validation.
    required: false,
    properties: {} as Json,
  };
  const ph = f.placeholder ? { placeholder: f.placeholder } : {};
  const mk = (gudType: string, properties: Json = {}, choices?: string[]) => ({
    question: { type: gudType, ...base, properties: { ...ph, ...properties } },
    meta: { opnId: f.id, opnType: t, gudType, required: !!f.required, choices },
  });

  switch (t) {
    case "text":
      return mk(f.multi_lines ? "LONG_TEXT" : "SHORT_TEXT");
    case "rich_text":
      return mk("LONG_TEXT");
    case "email":
      return mk("EMAIL");
    case "phone_number":
      return mk("PHONE");
    case "number":
      return mk("NUMBER");
    case "date":
      return mk("DATE");
    case "url":
      return mk("SHORT_TEXT", { format: "url" });
    case "barcode":
    case "qrcode":
      return mk("SHORT_TEXT");
    case "matrix":
      return mk("LONG_TEXT");
    case "checkbox":
    case "toggle_switch":
      return mk("YES_NO");
    case "select":
    case "radio": {
      const choices = names(f.select?.options);
      return mk("MULTIPLE_CHOICE", { choices, allowMultiple: false }, choices);
    }
    case "multi_select": {
      const choices = names(f.multi_select?.options);
      return mk("MULTIPLE_CHOICE", { choices, allowMultiple: true }, choices);
    }
    case "rating":
      return mk("RATING", { maxRating: f.rating_max_value ?? 5 });
    case "scale":
      return mk("SCALE", { minValue: f.scale_min_value ?? 1, maxValue: f.scale_max_value ?? 5 });
    case "slider":
      return mk("NUMBER", {
        validation: { min: f.slider_min_value ?? 0, max: f.slider_max_value ?? 50 },
      });
    case "files":
    case "signature":
      return mk("FILE_UPLOAD");
    case "nf-text":
      return mk("STATEMENT");
    default:
      return null; // payment, password, page-break, divider, image, video, audio, code...
  }
}

// ---------- Answer conversion ----------

const stripTags = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

async function uploadFile(gudFormId: string, fileUrl: string, fileName: string): Promise<string | null> {
  try {
    return await uploadFileUnsafe(gudFormId, fileUrl, fileName);
  } catch (e) {
    note(`file "${fileName}" skipped: ${(e as Error).message}`);
    return null;
  }
}

async function uploadFileUnsafe(gudFormId: string, fileUrl: string, fileName: string): Promise<string | null> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const mime = ALLOWED_MIME[ext];
  if (!mime) {
    note(`file "${fileName}" skipped: type .${ext} not accepted by GudForm uploads`);
    return null;
  }
  const dl = await http(fileUrl);
  if (!dl.ok) {
    note(`file "${fileName}" skipped: download failed (${dl.status})`);
    return null;
  }
  const buf = Buffer.from(await dl.arrayBuffer());
  if (buf.length > MAX_FILE_BYTES) {
    note(`file "${fileName}" skipped: ${(buf.length / 1048576).toFixed(1)}MB exceeds 10MB limit`);
    return null;
  }
  const fd = new FormData();
  fd.set("file", new File([buf], fileName, { type: mime }));
  fd.set("formId", gudFormId);
  const up = await http(`${GUD}/api/upload`, { method: "POST", body: fd });
  const json = await up.json().catch(() => ({}));
  if (!up.ok || !json.url) {
    note(`file "${fileName}" skipped: upload failed (${up.status} ${json.error ?? ""})`);
    return null;
  }
  await sleep(3200); // /api/upload is limited to 20/min per IP
  return json.url as string;
}

async function convertValue(
  field: FieldMap,
  raw: Json,
  gudFormId: string,
): Promise<string | null> {
  if (raw === null || raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0)) {
    return null;
  }
  switch (field.opnType) {
    case "checkbox":
    case "toggle_switch":
      return raw === true || raw === "true" || raw === 1 ? "Yes" : "No";
    case "multi_select":
      return (Array.isArray(raw) ? raw : [raw]).map(String).join(CHOICE_SEPARATOR);
    case "select":
    case "radio":
      return String(raw);
    case "rich_text":
      return stripTags(String(raw));
    case "date": {
      const s = Array.isArray(raw) ? String(raw[0]) : String(raw);
      return s.slice(0, 10);
    }
    case "matrix":
      return Object.entries(raw as Record<string, string>)
        .map(([row, col]) => `${row}: ${col}`)
        .join("\n");
    case "files":
    case "signature": {
      const items: Json[] = Array.isArray(raw) ? raw : [raw];
      const files = items.filter((i) => i && (i.file_url || typeof i === "string"));
      if (files.length === 0) return null;
      if (files.length > 1) {
        note(`question "${field.opnId}": ${files.length} files in one answer, only the first is imported`);
      }
      const first = files[0];
      if (typeof first === "string") return null;
      return await uploadFile(gudFormId, first.file_url, first.file_name || "file");
    }
    default:
      return String(raw);
  }
}

// ---------- Migration ----------

async function fetchAllSubmissions(opnFormId: string): Promise<Json[]> {
  const all: Json[] = [];
  for (let page = 1; ; page++) {
    const json = await opn(`/open/forms/${opnFormId}/submissions?per_page=100&page=${page}`);
    all.push(...(json.data ?? []));
    const last = json.meta?.last_page ?? 1;
    if (page >= last) break;
  }
  // oldest first, so GudForm's ordering roughly matches the original
  // OpnForm puts status/created_at inside `data` (alongside the answers).
  return all.sort((a, b) => String(a.data?.created_at).localeCompare(String(b.data?.created_at)));
}

async function migrateForm(opnForm: Json) {
  const label = `${opnForm.title} (${opnForm.slug})`;
  console.log(`\n== ${label}`);

  const mapped: { question: Json; meta: Omit<FieldMap, "gudIndex"> }[] = [];
  for (const f of opnForm.properties ?? []) {
    const m = mapField(f);
    if (!m) {
      note(`form "${opnForm.title}": field "${f.name}" (${f.type}) not supported, skipped`);
      continue;
    }
    mapped.push(m);
  }
  const fields: FieldMap[] = mapped.map((m, i) => ({ ...m.meta, gudIndex: i }));

  const submissions = await fetchAllSubmissions(opnForm.id);
  const partials = submissions.filter((s) => s.data?.status === "partial").length;
  console.log(`  ${fields.length} questions, ${submissions.length} submissions (${partials} in progress)`);
  if (DRY) {
    let fileCount = 0;
    let multi = 0;
    for (const s of submissions) {
      for (const f of fields) {
        if (f.opnType === "files" || f.opnType === "signature") {
          const v = s.data?.[f.opnId];
          if (Array.isArray(v) && v.length) {
            fileCount += v.length;
            if (v.length > 1) multi++;
          }
        }
      }
    }
    console.log(`  [dry] ${fileCount} file(s) to upload (~${Math.ceil((fileCount * 3.2) / 60)} min), ${multi} answer(s) with more than one file`);
    return;
  }

  let fs_ = state.forms[opnForm.id];
  if (!fs_) {
    const created = await gud("POST", "/forms", {
      title: opnForm.title,
      ...(COLLECTION_ID ? { collectionId: COLLECTION_ID } : {}),
      questions: mapped.map((m) => m.question),
    });
    const qs: Json[] = created.form.questions;
    fs_ = { gudFormId: created.form.id, questionIds: {}, submissions: {} };
    fields.forEach((f) => (fs_!.questionIds[f.opnId] = qs[f.gudIndex].id));
    state.forms[opnForm.id] = fs_;
    saveState();
    console.log(`  created GudForm ${fs_.gudFormId}`);
  } else {
    console.log(`  resuming GudForm ${fs_.gudFormId}`);
  }

  const missing = submissions.filter((s) => !fs_!.submissions[s.id]);
  if (!fs_.finalized || missing.length > 0) {
    await gud("PATCH", `/forms/${fs_.gudFormId}`, {
      themeColor: opnForm.color || undefined,
      themeMode: opnForm.dark_mode === "dark" ? "DARK" : opnForm.dark_mode === "auto" ? "SYSTEM" : "LIGHT",
      showProgressBar: opnForm.show_progress_bar ?? true,
      redirectUrl: opnForm.redirect_url || undefined,
    });

    // Relax required flags while importing (also when retrying a finished form).
    const before = await gud("GET", `/forms/${fs_.gudFormId}`);
    await gud("PUT", `/forms/${fs_.gudFormId}/questions`, {
      questions: before.form.questions.map((q: Json) => ({
        id: q.id, type: q.type, title: q.title, description: q.description ?? undefined,
        required: false,
        // Also drop the URL format check: OpnForm accepted free text in URL fields.
        properties: Object.fromEntries(Object.entries(q.properties ?? {}).filter(([k]) => k !== "format")),
        logic: q.logic,
      })),
    });

    let done = 0;
    let fetchedAt = Date.now();
    let subById = new Map<number | string, Json>(submissions.map((x) => [x.id, x]));
    for (const s of missing) {
      try {
        // OpnForm's signed file links last 10 minutes: re-fetch just before downloading.
        let current = s;
        if (fields.some((f) => (f.opnType === "files" || f.opnType === "signature") && s.data?.[f.opnId])) {
          if (Date.now() - fetchedAt > 4 * 60 * 1000) {
            subById = new Map((await fetchAllSubmissions(opnForm.id)).map((x) => [x.id, x]));
            fetchedAt = Date.now();
          }
          current = subById.get(s.id) ?? s;
        }
        const answers: { questionId: string; value: string }[] = [];
        for (const f of fields) {
          const value = await convertValue(f, current.data?.[f.opnId], fs_.gudFormId);
          if (value !== null) answers.push({ questionId: fs_.questionIds[f.opnId], value });
        }
        const started = parseUtc(s.data.created_at);
        const partial = s.data?.status === "partial";
        const r = await gud("POST", `/forms/${fs_.gudFormId}/responses`, {
          answers,
          startedAt: started.toISOString(),
          // null = in progress (partial); a date = completed
          completedAt: partial
            ? null
            : new Date(started.getTime() + (Number(s.completion_time) || 0) * 1000).toISOString(),
        });
        fs_.submissions[s.id] = { responseId: r.response.id, originalCreatedAt: s.data?.created_at };
        saveState();
        done++;
      } catch (e) {
        note(`form "${opnForm.title}" submission ${s.id} failed: ${(e as Error).message}`);
      }
    }
    console.log(`  imported ${done} new submissions`);

    // Restore the real required flags and re-send the question list (ids are kept).
    const current = await gud("GET", `/forms/${fs_.gudFormId}`);
    const byId = new Map<string, Json>(current.form.questions.map((q: Json) => [q.id, q]));
    const restored = fields.map((f) => {
      const q = byId.get(fs_!.questionIds[f.opnId])!;
      return {
        id: q.id,
        type: q.type,
        title: q.title,
        description: q.description ?? undefined,
        required: f.required,
        properties: mapped[f.gudIndex].question.properties, // original, incl. url format
        logic: q.logic,
      };
    });
    await gud("PUT", `/forms/${fs_.gudFormId}/questions`, { questions: restored });

    const status =
      PUBLISH && opnForm.visibility === "public" ? "PUBLISHED" : opnForm.visibility === "closed" ? "CLOSED" : undefined;
    await gud("PATCH", `/forms/${fs_.gudFormId}`, {
      ...(status ? { status } : {}),
    });
    fs_.finalized = true;
    saveState();
  }
}

async function main() {
  console.log(`${DRY ? "[DRY RUN] " : ""}OpnForm ${OPN} -> GudForm ${GUD}`);
  const json = await opn("/open/forms");
  let forms: Json[] = Array.isArray(json) ? json : json.data ?? [];
  if (ONLY) forms = forms.filter((f) => f.id === ONLY || f.slug === ONLY);
  console.log(`Found ${forms.length} form(s)`);

  for (const f of forms) {
    try {
      await migrateForm(f);
    } catch (e) {
      note(`form "${f.title}" aborted: ${(e as Error).message}`);
    }
  }

  console.log(`\nDone. ${report.length} issue(s)${DRY ? "" : `; state saved to ${STATE_FILE}`}.`);
  report.forEach((r) => console.log(` - ${r}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
