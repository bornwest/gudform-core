import { QuestionType } from "@prisma/client";

export type ImportedQuestion = {
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  properties: Record<string, unknown>;
};

export type ImportResult =
  | { ok: true; title: string; questions: ImportedQuestion[] }
  | { ok: false; error: string };

const TYPEFORM_TYPES: Record<string, QuestionType> = {
  short_text: QuestionType.SHORT_TEXT,
  long_text: QuestionType.LONG_TEXT,
  email: QuestionType.EMAIL,
  number: QuestionType.NUMBER,
  phone_number: QuestionType.PHONE,
  date: QuestionType.DATE,
  multiple_choice: QuestionType.MULTIPLE_CHOICE,
  dropdown: QuestionType.DROPDOWN,
  yes_no: QuestionType.YES_NO,
  rating: QuestionType.RATING,
  opinion_scale: QuestionType.SCALE,
  file_upload: QuestionType.FILE_UPLOAD,
  statement: QuestionType.STATEMENT,
  picture_choice: QuestionType.MULTIPLE_CHOICE,
  website: QuestionType.SHORT_TEXT,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      const record = asRecord(item);
      if (!record) return "";
      if (typeof record.label === "string") return record.label;
      if (typeof record.value === "string") return record.value;
      return "";
    })
    .filter(Boolean);
}

function mapTypeformField(field: Record<string, unknown>): ImportedQuestion | null {
  const rawType = String(field.type || "");
  const type = TYPEFORM_TYPES[rawType];
  if (!type) return null;
  const properties = asRecord(field.properties) ?? {};
  const validations = asRecord(field.validations) ?? {};
  const title = String(field.title || field.ref || "Untitled");
  const imported: ImportedQuestion = {
    type,
    title,
    required: validations.required === true,
    properties: {},
  };
  const choices = stringList(properties.choices);
  if (choices.length > 0) imported.properties.choices = choices;
  if (properties.allow_multiple_selection === true) {
    imported.properties.allowMultiple = true;
  }
  if (rawType === "picture_choice") {
    imported.properties.pictureChoice = true;
    imported.properties.choiceImages = (Array.isArray(properties.choices)
      ? properties.choices
      : []
    ).map((choice) => {
      const record = asRecord(choice);
      const attachment = asRecord(record?.attachment);
      return typeof attachment?.href === "string" ? attachment.href : "";
    });
  }
  if (rawType === "website") imported.properties.format = "url";
  if (typeof field.ref === "string") imported.description = undefined;
  return imported;
}

function mapGoogleItem(item: Record<string, unknown>): ImportedQuestion | null {
  const title = String(item.title || "Untitled");
  const questionItem = asRecord(item.questionItem);
  const question = asRecord(questionItem?.question);
  if (!question) return null;
  const required = question.required === true;
  if (asRecord(question.textQuestion)) {
    const paragraph = asRecord(question.textQuestion)?.paragraph === true;
    return {
      type: paragraph ? QuestionType.LONG_TEXT : QuestionType.SHORT_TEXT,
      title,
      required,
      properties: {},
    };
  }
  const choice = asRecord(question.choiceQuestion);
  if (choice) {
    const options = stringList(choice.options);
    const allowMultiple = String(choice.type || "") === "CHECKBOX";
    return {
      type: QuestionType.MULTIPLE_CHOICE,
      title,
      required,
      properties: {
        choices: options,
        ...(allowMultiple ? { allowMultiple: true } : {}),
      },
    };
  }
  if (asRecord(question.dateQuestion)) {
    return { type: QuestionType.DATE, title, required, properties: {} };
  }
  if (asRecord(question.scaleQuestion)) {
    return { type: QuestionType.SCALE, title, required, properties: {} };
  }
  return {
    type: QuestionType.SHORT_TEXT,
    title,
    required,
    properties: {},
  };
}

function mapNativeQuestion(item: Record<string, unknown>): ImportedQuestion | null {
  const type = String(item.type || "") as QuestionType;
  if (!Object.values(QuestionType).includes(type)) return null;
  return {
    type,
    title: String(item.title || ""),
    description: typeof item.description === "string" ? item.description : undefined,
    required: item.required === true,
    properties: asRecord(item.properties) ?? {},
  };
}

export function importFormDefinition(raw: unknown): ImportResult {
  const payload = asRecord(raw);
  if (!payload) {
    return { ok: false, error: "Paste a JSON form export" };
  }

  const title =
    (typeof payload.title === "string" && payload.title) ||
    (typeof asRecord(payload.info)?.title === "string"
      ? String(asRecord(payload.info)?.title)
      : "") ||
    "Imported form";

  if (Array.isArray(payload.fields)) {
    const questions = payload.fields
      .map((field) => asRecord(field))
      .filter((field): field is Record<string, unknown> => Boolean(field))
      .map(mapTypeformField)
      .filter((question): question is ImportedQuestion => Boolean(question));
    if (questions.length === 0) {
      return { ok: false, error: "No supported Typeform fields found" };
    }
    return { ok: true, title, questions };
  }

  if (Array.isArray(payload.questions)) {
    const questions = payload.questions
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map(mapNativeQuestion)
      .filter((question): question is ImportedQuestion => Boolean(question));
    if (questions.length === 0) {
      return { ok: false, error: "No supported questions found" };
    }
    return { ok: true, title, questions };
  }

  if (Array.isArray(payload.items)) {
    const questions = payload.items
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map(mapGoogleItem)
      .filter((question): question is ImportedQuestion => Boolean(question));
    if (questions.length === 0) {
      return { ok: false, error: "No supported Google Form items found" };
    }
    return { ok: true, title, questions };
  }

  return { ok: false, error: "Unrecognized form export" };
}
