"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getFormById, saveQuestions, updateForm, publishDraftQuestions } from "@/actions/form-actions";
import { FormStatus, FormThemeMode, QuestionType } from "@prisma/client";
import {
  ArrowLeft,
  ChevronDown,
  DollarSign,
  Eye,
  Monitor,
  Moon,
  Palette,
  Plus,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  CURRENCIES,
  formatPaymentAmount,
  fromSmallestUnit,
  getCurrency,
  getMinDisplayAmount,
  toSmallestUnit,
} from "@/config/currencies";
import type { LogicRule } from "@/lib/types/logic";
import type { PaymentOption, PaymentSelectionMode } from "@/lib/types/payment";
import { contrastColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import type { Question, QuestionProperties } from "./components/types";
import {
  QUESTION_TYPE_META,
  QUESTION_TYPE_GROUPS,
  SCREEN_TYPES,
  FORM_COMPONENTS,
  getDefaultProperties,
  getDefaultTitle,
  getThankYouScreenIndex,
  normalizeQuestionsThankYouLast,
} from "./components/constants";
import { SidebarQuestionItem } from "./components/sidebar-question-item";
import { QuestionEditor } from "./components/question-editor";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function BuilderSkeleton() {
  return (
    <div className="flex h-screen flex-col">
      {/* Top bar skeleton */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar skeleton */}
        <div className="w-72 border-r p-4">
          <Skeleton className="mb-4 h-9 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </div>
        {/* Center panel skeleton */}
        <div className="flex-1 p-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function BuilderError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      <Button onClick={onRetry} variant="outline">
        Try again
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main builder page
// ---------------------------------------------------------------------------

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formStatus, setFormStatus] = useState<FormStatus>(FormStatus.DRAFT);
  const [formThemeMode, setFormThemeMode] = useState<FormThemeMode>(
    FormThemeMode.LIGHT,
  );
  const [formThemeColor, setFormThemeColor] = useState("#6366f1");
  const [formBgColor, setFormBgColor] = useState("#ffffff");
  const [showSettings, setShowSettings] = useState(false);
  const [notifyOnResponse, setNotifyOnResponse] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [autoResponderEnabled, setAutoResponderEnabled] = useState(false);
  const [autoResponderSubject, setAutoResponderSubject] = useState("");
  const [autoResponderMessage, setAutoResponderMessage] = useState("");
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("usd");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [paymentSelectionMode, setPaymentSelectionMode] =
    useState<PaymentSelectionMode>("single");
  const [paymentMode, setPaymentMode] = useState<"simple" | "tiers">("simple");
  // Self-hosted: all features always available
  const [removeBranding, setRemoveBranding] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Refs
  const questionsRef = useRef<Question[]>(questions);
  questionsRef.current = questions;
  const savedSnapshotRef = useRef<string>("[]");

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  const loadForm = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const form = await getFormById(formId);
      if (!form) {
        setError("Form not found. It may have been deleted.");
        return;
      }
      setFormTitle(form.title);
      setFormSlug(form.slug);
      setFormStatus(form.status);
      setFormThemeMode(form.themeMode);
      setFormThemeColor(form.themeColor || "#6366f1");
      setFormBgColor(form.backgroundColor || "#ffffff");
      setNotifyOnResponse(form.notifyOnResponse);
      setWebhookUrl(form.webhookUrl || "");
      setWebhookSecret(form.webhookSecret || "");
      setAutoResponderEnabled(form.autoResponderEnabled);
      setAutoResponderSubject(form.autoResponderSubject || "");
      setAutoResponderMessage(form.autoResponderMessage || "");
      setPaymentEnabled(form.paymentEnabled);
      setPaymentAmount(
        form.paymentAmount
          ? String(
              fromSmallestUnit(
                form.paymentAmount,
                form.paymentCurrency || "usd",
              ),
            )
          : "",
      );
      setPaymentCurrency(form.paymentCurrency);
      setPaymentDescription(form.paymentDescription || "");
      const loadedOptions = Array.isArray(form.paymentOptions)
        ? (form.paymentOptions as unknown as PaymentOption[])
        : [];
      setPaymentOptions(loadedOptions);
      setPaymentSelectionMode(
        (form.paymentSelectionMode as PaymentSelectionMode) || "single",
      );
      setPaymentMode(loadedOptions.length > 0 ? "tiers" : "simple");
      // Self-hosted: all features unlocked
      setRemoveBranding(form.removeBranding ?? false);

      // For published forms with draft changes, load from draftQuestions
      const hasDraftQuestions =
        form.status === "PUBLISHED" &&
        form.draftQuestions &&
        Array.isArray(form.draftQuestions);
      setHasDraft(!!hasDraftQuestions);

      const sourceQuestions = hasDraftQuestions
        ? (form.draftQuestions as any[])
        : form.questions;

      const loadedQuestions: Question[] = sourceQuestions.map((q: any) => ({
        id: q.id,
        type: q.type,
        title: q.title,
        description: q.description || undefined,
        required: q.required,
        properties: (q.properties as QuestionProperties) || {},
        logic: Array.isArray(q.logic)
          ? (q.logic as unknown as LogicRule[])
          : [],
      }));
      const normalized = normalizeQuestionsThankYouLast(loadedQuestions);
      setQuestions(normalized);
      savedSnapshotRef.current = JSON.stringify(normalized);
      if (loadedQuestions.length > 0) {
        setSelectedIndex(0);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  // -----------------------------------------------------------------------
  // Unsaved changes detection
  // -----------------------------------------------------------------------

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(questions) !== savedSnapshotRef.current;
  }, [questions]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // -----------------------------------------------------------------------
  // Explicit save
  // -----------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const savedQuestions = await saveQuestions(
        formId,
        questionsRef.current.map((q) => ({
          id: q.id,
          type: q.type,
          title: q.title,
          description: q.description,
          required: q.required,
          properties: q.properties,
          logic: q.logic,
        })),
      );

      // Assign server-generated IDs to newly created questions
      setQuestions((prev) => {
        const updated = prev.map((q, i) => {
          const saved = savedQuestions.find((s) => s.order === i);
          if (saved && !q.id) return { ...q, id: saved.id };
          return q;
        });

        // Resolve temp IDs (__new_X__) in logic rules
        const resolved = updated.map((q) => ({
          ...q,
          logic: q.logic.map((rule) => {
            if (
              rule.action.type === "jump_to" &&
              rule.action.questionId.startsWith("__new_")
            ) {
              const match = rule.action.questionId.match(/^__new_(\d+)__$/);
              const idx = match ? parseInt(match[1], 10) : -1;
              const realId = updated[idx]?.id;
              if (realId) {
                return {
                  ...rule,
                  action: { type: "jump_to" as const, questionId: realId },
                };
              }
            }
            return rule;
          }),
        }));

        // Also resolve defaultDestination temp refs in properties
        const fullyResolved = resolved.map((q) => {
          const dest = q.properties.defaultDestination;
          if (
            dest?.type === "jump_to" &&
            dest.questionId?.startsWith("__new_")
          ) {
            const match = dest.questionId.match(/^__new_(\d+)__$/);
            const idx = match ? parseInt(match[1], 10) : -1;
            const realId = resolved[idx]?.id;
            if (realId) {
              return {
                ...q,
                properties: {
                  ...q.properties,
                  defaultDestination: {
                    type: "jump_to" as const,
                    questionId: realId,
                  },
                },
              };
            }
          }
          return q;
        });

        savedSnapshotRef.current = JSON.stringify(fullyResolved);
        return fullyResolved;
      });

      if (formStatus === FormStatus.PUBLISHED) {
        setHasDraft(true);
      }
      toast.success("Changes saved");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [formId, formStatus]);

  // -----------------------------------------------------------------------
  // Question mutations
  // -----------------------------------------------------------------------

  const updateQuestion = useCallback(
    (index: number, updates: Partial<Question>) => {
      setQuestions((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...updates };
        return next;
      });
    },
    [],
  );

  const addQuestion = useCallback(
    (type: QuestionType) => {
      const newQ: Question = {
        type,
        title: getDefaultTitle(type),
        description: undefined,
        required: false,
        properties: getDefaultProperties(type),
        logic: [],
      };
      const insertAt = getThankYouScreenIndex(questions);
      const insertIndex = insertAt >= 0 ? insertAt : questions.length;
      setQuestions((prev) => {
        const at = getThankYouScreenIndex(prev);
        const idx = at >= 0 ? at : prev.length;
        return [...prev.slice(0, idx), newQ, ...prev.slice(idx)];
      });
      setSelectedIndex(insertIndex);
    },
    [questions],
  );

  const deleteQuestion = useCallback(
    (index: number) => {
      setQuestions((prev) => {
        if (prev.length <= 1) return prev;
        const deleted = prev[index];
        if (deleted.type === QuestionType.THANK_YOU_SCREEN) return prev;

        const deletedId = deleted.id;
        const deletedTempRef = `__new_${index}__`;

        const filtered = prev.filter((_, i) => i !== index);

        // Clean up logic rules and defaultDestination referencing the deleted question
        return filtered.map((q) => {
          const cleanedLogic = q.logic.filter((rule) => {
            if (rule.action.type !== "jump_to") return true;
            return (
              rule.action.questionId !== deletedId &&
              rule.action.questionId !== deletedTempRef
            );
          });

          let cleanedProps = q.properties;
          const dest = q.properties.defaultDestination as
            | { type: string; questionId?: string }
            | undefined;
          if (
            dest?.type === "jump_to" &&
            (dest.questionId === deletedId ||
              dest.questionId === deletedTempRef)
          ) {
             
            const { defaultDestination, ...rest } = q.properties;
            cleanedProps = rest;
          }

          return { ...q, logic: cleanedLogic, properties: cleanedProps };
        });
      });
      setSelectedIndex((prev) => {
        if (prev >= questions.length - 1)
          return Math.max(0, questions.length - 2);
        if (index <= prev) return Math.max(0, prev - 1);
        return prev;
      });
    },
    [questions.length],
  );

  const duplicateQuestion = useCallback(
    (index: number) => {
      const source = questions[index];
      if (source?.type === QuestionType.THANK_YOU_SCREEN) return;
      const insertAt = getThankYouScreenIndex(questions);
      const newIndex = insertAt >= 0 ? insertAt : questions.length;
      setQuestions((prev) => {
        const src = prev[index];
        if (src.type === QuestionType.THANK_YOU_SCREEN) return prev;
        const copy: Question = {
          type: src.type,
          title: `${src.title} (copy)`,
          description: src.description,
          required: src.required,
          properties: { ...src.properties },
          logic: src.logic.map((r) => ({ ...r, id: crypto.randomUUID() })),
        };
        const at = getThankYouScreenIndex(prev);
        const idx = at >= 0 ? at : prev.length;
        return [...prev.slice(0, idx), copy, ...prev.slice(idx)];
      });
      setSelectedIndex(newIndex);
    },
    [questions],
  );

  const moveQuestion = useCallback(
    (fromIndex: number, direction: "up" | "down") => {
      setQuestions((prev) => {
        const thankYouIdx = getThankYouScreenIndex(prev);
        const from = prev[fromIndex];
        if (from.type === QuestionType.THANK_YOU_SCREEN) return prev; // thank you cannot move
        const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= prev.length) return prev;
        if (thankYouIdx >= 0 && toIndex === thankYouIdx) return prev; // cannot move into thank-you position
        const next = [...prev];
        [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
        return next;
      });
      const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
      setSelectedIndex(toIndex);
    },
    [],
  );

  const insertComponent = useCallback(
    (componentId: string) => {
      const component = FORM_COMPONENTS.find((c) => c.id === componentId);
      if (!component) return;

      const newQuestions: Question[] = component.fields.map((field) => ({
        type: field.type,
        title: field.title,
        description: field.description,
        required: field.required,
        properties: field.properties,
        logic: [],
      }));

      const insertAt = getThankYouScreenIndex(questions);
      const insertIndex = insertAt >= 0 ? insertAt : questions.length;
      setQuestions((prev) => {
        const at = getThankYouScreenIndex(prev);
        const idx = at >= 0 ? at : prev.length;
        return [...prev.slice(0, idx), ...newQuestions, ...prev.slice(idx)];
      });
      setSelectedIndex(insertIndex);
      toast.success(`Added ${component.name} (${component.fields.length} fields)`);
    },
    [questions],
  );

  // -----------------------------------------------------------------------
  // Form-level actions
  // -----------------------------------------------------------------------

  const handleTitleSave = useCallback(async () => {
    setTitleEditing(false);
    try {
      await updateForm(formId, { title: formTitle });
    } catch {
      toast.error("Failed to update title");
    }
  }, [formId, formTitle]);

  const handlePublishToggle = useCallback(async () => {
    const newStatus =
      formStatus === FormStatus.PUBLISHED
        ? FormStatus.DRAFT
        : FormStatus.PUBLISHED;

    try {
      setPublishing(true);
      if (formStatus === FormStatus.PUBLISHED && hasDraft) {
        // Publishing draft changes on an already-published form
        await handleSave();
        await publishDraftQuestions(formId);
        setHasDraft(false);
        toast.success("Changes published");
      } else if (newStatus === FormStatus.PUBLISHED) {
        // First-time publish: save questions directly then set status
        await handleSave();
        await updateForm(formId, { status: newStatus });
        setFormStatus(newStatus);
        toast.success("Form published successfully");
      } else {
        // Unpublish
        await updateForm(formId, { status: newStatus });
        setFormStatus(newStatus);
        toast.success("Form unpublished");
      }
    } catch {
      toast.error("Failed to update form status");
    } finally {
      setPublishing(false);
    }
  }, [formId, formStatus, handleSave, hasDraft]);

  // -----------------------------------------------------------------------
  // Compute display numbers (excluding screens)
  // -----------------------------------------------------------------------

  const questionNumbers: number[] = [];
  let counter = 0;
  for (const q of questions) {
    if (SCREEN_TYPES.includes(q.type)) {
      questionNumbers.push(0);
    } else {
      counter++;
      questionNumbers.push(counter);
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading) return <BuilderSkeleton />;
  if (error) return <BuilderError message={error} onRetry={loadForm} />;

  const selectedQuestion = questions[selectedIndex];

  return (
    <div className="flex h-screen flex-col">
      {/* ============================================================== */}
      {/* Top bar                                                         */}
      {/* ============================================================== */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => router.push("/dashboard")}
            title="Back to dashboard"
          >
            <ArrowLeft className="size-4" />
          </Button>

          {titleEditing ? (
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") {
                  setTitleEditing(false);
                }
              }}
              className="h-8 w-64 text-sm font-semibold"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setTitleEditing(true)}
              className="max-w-[300px] truncate rounded px-2 py-1 text-sm font-semibold hover:bg-muted"
              title="Click to edit title"
            >
              {formTitle || "Untitled Form"}
            </button>
          )}

          <Badge
            variant={
              formStatus === FormStatus.PUBLISHED
                ? "default"
                : formStatus === FormStatus.CLOSED
                  ? "destructive"
                  : "secondary"
            }
          >
            {formStatus.charAt(0) + formStatus.slice(1).toLowerCase()}
          </Badge>

          {hasUnsavedChanges && !saving && (
            <span className="text-xs font-medium text-amber-600">
              Unsaved changes
            </span>
          )}
          {!hasUnsavedChanges && hasDraft && !saving && (
            <span className="text-xs font-medium text-blue-600">
              Unpublished changes
            </span>
          )}
          {saving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Button
            variant={showSettings ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            title="Form settings"
          >
            <Settings className="mr-1.5 size-4" />
            Settings
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                {hasUnsavedChanges && (
                  <span className="mr-1.5 inline-block size-2 rounded-full bg-amber-500" />
                )}
                Save
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!formSlug}
            onClick={async () => {
              if (hasUnsavedChanges) {
                await handleSave();
              }
              window.open(`/f/${formSlug}?preview=true`, "_blank", "noopener,noreferrer");
            }}
          >
            <Eye className="mr-1.5 size-4" />
            Preview
          </Button>

          {formStatus === FormStatus.PUBLISHED && hasDraft && (
            <Button
              size="sm"
              onClick={handlePublishToggle}
              disabled={publishing}
            >
              {publishing ? "Publishing..." : "Publish Changes"}
            </Button>
          )}

          {formStatus === FormStatus.PUBLISHED ? (
            <Button
              size="sm"
              onClick={async () => {
                try {
                  setPublishing(true);
                  await updateForm(formId, { status: FormStatus.DRAFT });
                  setFormStatus(FormStatus.DRAFT);
                  setHasDraft(false);
                  toast.success("Form unpublished");
                } catch {
                  toast.error("Failed to unpublish form");
                } finally {
                  setPublishing(false);
                }
              }}
              disabled={publishing}
              variant="outline"
            >
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handlePublishToggle}
              disabled={publishing}
            >
              {publishing ? "Saving..." : "Publish"}
            </Button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* Body: Sidebar + Editor                                          */}
      {/* ============================================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* -------------------------------------------------------------- */}
        {/* Left sidebar                                                    */}
        {/* -------------------------------------------------------------- */}
        <div className="flex w-72 shrink-0 flex-col border-r bg-muted/30">
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Questions ({questions.length})
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Plus className="mr-1 size-3.5" />
                  Add
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-[70vh] w-56 overflow-y-auto">
                <DropdownMenuLabel>Components</DropdownMenuLabel>
                {FORM_COMPONENTS.map((component) => (
                  <DropdownMenuItem
                    key={component.id}
                    onClick={() => insertComponent(component.id)}
                  >
                    <span className="mr-2 text-xs text-muted-foreground">{component.fields.length}x</span>
                    {component.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {QUESTION_TYPE_GROUPS.map((group, gi) => (
                  <div key={group.label}>
                    {gi > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                    {group.types.map((type) => {
                      const m = QUESTION_TYPE_META[type];
                      const TypeIcon = m.icon;
                      return (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => addQuestion(type)}
                        >
                          <TypeIcon className="mr-2 size-4 text-muted-foreground" />
                          {m.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator />

          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {questions.map((q, i) => {
                const thankYouIdx = getThankYouScreenIndex(questions);
                const isThankYou = q.type === QuestionType.THANK_YOU_SCREEN;
                const isAboveThankYou =
                  thankYouIdx >= 0 && i === thankYouIdx - 1;
                return (
                  <SidebarQuestionItem
                    key={`${q.id || "new"}-${i}`}
                    question={q}
                    index={questionNumbers[i]}
                    isSelected={selectedIndex === i}
                    isFirst={i === 0}
                    isLast={i === questions.length - 1}
                    totalCount={questions.length}
                    onClick={() => setSelectedIndex(i)}
                    onMoveUp={() => moveQuestion(i, "up")}
                    onMoveDown={() => moveQuestion(i, "down")}
                    onDuplicate={() => duplicateQuestion(i)}
                    onDelete={() => deleteQuestion(i)}
                    canMoveUp={!isThankYou}
                    canMoveDown={!isThankYou && !isAboveThankYou}
                    canDuplicate={!isThankYou}
                    canDelete={!isThankYou}
                  />
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Center editor panel                                             */}
        {/* -------------------------------------------------------------- */}
        <ScrollArea className="flex-1">
          <div className="p-8">
            {selectedQuestion ? (
              <QuestionEditor
                question={selectedQuestion}
                questionIndex={questionNumbers[selectedIndex]}
                allQuestions={questions}
                onUpdate={(updates) => updateQuestion(selectedIndex, updates)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="rounded-full bg-muted p-4">
                  <Plus className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">No questions yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add your first question to get started
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Plus className="mr-1.5 size-4" />
                      Add Question
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-[70vh] w-56 overflow-y-auto">
                    <DropdownMenuLabel>Components</DropdownMenuLabel>
                    {FORM_COMPONENTS.map((component) => (
                      <DropdownMenuItem
                        key={component.id}
                        onClick={() => insertComponent(component.id)}
                      >
                        <span className="mr-2 text-xs text-muted-foreground">{component.fields.length}x</span>
                        {component.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    {QUESTION_TYPE_GROUPS.map((group, gi) => (
                      <div key={group.label}>
                        {gi > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                        {group.types.map((type) => {
                          const m = QUESTION_TYPE_META[type];
                          const TypeIcon = m.icon;
                          return (
                            <DropdownMenuItem
                              key={type}
                              onClick={() => addQuestion(type)}
                            >
                              <TypeIcon className="mr-2 size-4 text-muted-foreground" />
                              {m.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* -------------------------------------------------------------- */}
        {/* Right sidebar: Form Settings                                    */}
        {/* -------------------------------------------------------------- */}
        {showSettings && (
          <div className="w-80 shrink-0 overflow-y-auto border-l bg-muted/30 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Form Settings</h3>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setShowSettings(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <Separator className="my-4" />

            {/* Theme Mode */}
            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Form Theme
              </Label>
              <div className="flex gap-1.5">
                {[
                  { mode: FormThemeMode.LIGHT, icon: Sun, label: "Light" },
                  { mode: FormThemeMode.DARK, icon: Moon, label: "Dark" },
                  {
                    mode: FormThemeMode.SYSTEM,
                    icon: Monitor,
                    label: "System",
                  },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={async () => {
                      setFormThemeMode(mode);
                      try {
                        await updateForm(formId, { themeMode: mode });
                        toast.success(`Theme set to ${label}`);
                      } catch {
                        toast.error("Failed to update theme");
                      }
                    }}
                    className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                      formThemeMode === mode
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-transparent bg-background hover:border-muted-foreground/20"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Controls the theme when respondents fill out your form.
              </p>
            </div>

            <Separator className="my-4" />

            {/* Template Themes */}
            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Palette className="mr-1 inline size-3" />
                Design Template
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "Indigo", color: "#6366f1", bg: "#ffffff" },
                  { name: "Ocean", color: "#0ea5e9", bg: "#f0f9ff" },
                  { name: "Emerald", color: "#10b981", bg: "#ecfdf5" },
                  { name: "Rose", color: "#f43f5e", bg: "#fff1f2" },
                  { name: "Amber", color: "#f59e0b", bg: "#fffbeb" },
                  { name: "Violet", color: "#8b5cf6", bg: "#f5f3ff" },
                  { name: "Midnight", color: "#6366f1", bg: "#0f172a" },
                  { name: "Forest", color: "#22c55e", bg: "#14532d" },
                  { name: "Slate", color: "#64748b", bg: "#f8fafc" },
                  { name: "Coral", color: "#fb7185", bg: "#1e1b4b" },
                  { name: "Minimal", color: "#171717", bg: "#ffffff" },
                  { name: "Sunset", color: "#ea580c", bg: "#fef3c7" },
                ].map((theme) => {
                  const isActive =
                    formThemeColor === theme.color && formBgColor === theme.bg;
                  return (
                    <button
                      key={theme.name}
                      onClick={async () => {
                        const bgIsDark = contrastColor(theme.bg) === "white";
                        const mode = bgIsDark
                          ? FormThemeMode.DARK
                          : FormThemeMode.LIGHT;
                        setFormThemeColor(theme.color);
                        setFormBgColor(theme.bg);
                        setFormThemeMode(mode);
                        try {
                          await updateForm(formId, {
                            themeColor: theme.color,
                            backgroundColor: theme.bg,
                            themeMode: mode,
                          });
                          toast.success(`Applied "${theme.name}" theme`);
                        } catch {
                          toast.error("Failed to apply theme");
                        }
                      }}
                      className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors ${
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:border-muted-foreground/20"
                      }`}
                    >
                      <div
                        className="flex h-8 w-full items-center justify-center rounded"
                        style={{ backgroundColor: theme.bg }}
                      >
                        <div
                          className="size-4 rounded-full"
                          style={{ backgroundColor: theme.color }}
                        />
                      </div>
                      <span className="text-[10px] font-medium">
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom color pickers */}
              <div className="flex gap-3 pt-1">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] text-muted-foreground">
                    Accent
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formThemeColor}
                      onChange={(e) => setFormThemeColor(e.target.value)}
                      onBlur={async () => {
                        try {
                          await updateForm(formId, {
                            themeColor: formThemeColor,
                          });
                        } catch {
                          toast.error("Failed to save color");
                        }
                      }}
                      className="size-7 cursor-pointer rounded border-0"
                    />
                    <span className="text-xs text-muted-foreground">
                      {formThemeColor}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] text-muted-foreground">
                    Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formBgColor}
                      onChange={(e) => setFormBgColor(e.target.value)}
                      onBlur={async () => {
                        try {
                          await updateForm(formId, {
                            backgroundColor: formBgColor,
                          });
                        } catch {
                          toast.error("Failed to save color");
                        }
                      }}
                      className="size-7 cursor-pointer rounded border-0"
                    />
                    <span className="text-xs text-muted-foreground">
                      {formBgColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Notifications */}
            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notifications
              </Label>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Get emailed on new responses
                  </p>
                </div>
                <Switch
                  checked={notifyOnResponse}
                  onCheckedChange={async (checked) => {
                    setNotifyOnResponse(checked);
                    await updateForm(formId, { notifyOnResponse: checked });
                  }}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Webhooks */}
            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Webhook
              </Label>
              <div className="space-y-2">
                <Label className="text-xs">Webhook URL</Label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  className="h-8 text-xs"
                  onBlur={async () => {
                    try {
                      await updateForm(formId, { webhookUrl: webhookUrl || undefined });
                    } catch {
                      toast.error("Failed to save webhook URL");
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Webhook Secret</Label>
                <Input
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Optional signing secret"
                  className="h-8 text-xs"
                  onBlur={async () => {
                    try {
                      await updateForm(formId, {
                        webhookSecret: webhookSecret || undefined,
                      });
                    } catch {
                      toast.error("Failed to save webhook secret");
                    }
                  }}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Auto-responder (Pro+ only) */}
            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Auto-responder
              </Label>
              <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Send confirmation</p>
                      <p className="text-xs text-muted-foreground">
                        Auto-reply to respondent&apos;s email
                      </p>
                    </div>
                    <Switch
                      checked={autoResponderEnabled}
                      onCheckedChange={async (checked) => {
                        setAutoResponderEnabled(checked);
                        await updateForm(formId, { autoResponderEnabled: checked });
                      }}
                    />
                  </div>
                  {autoResponderEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Subject</Label>
                        <Input
                          value={autoResponderSubject}
                          onChange={(e) => setAutoResponderSubject(e.target.value)}
                          placeholder="Thanks for your response!"
                          className="h-8 text-xs"
                          onBlur={async () => {
                            try {
                              await updateForm(formId, {
                                autoResponderSubject: autoResponderSubject,
                              });
                            } catch {
                              toast.error("Failed to save auto-responder subject");
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Message</Label>
                        <Textarea
                          value={autoResponderMessage}
                          onChange={(e) => setAutoResponderMessage(e.target.value)}
                          placeholder="Thank you for filling out our form..."
                          className="text-xs"
                          rows={3}
                          onBlur={async () => {
                            try {
                              await updateForm(formId, {
                                autoResponderMessage: autoResponderMessage,
                              });
                            } catch {
                              toast.error("Failed to save auto-responder message");
                            }
                          }}
                        />
                      </div>
                    </>
                  )}
                </>
            </div>

            <Separator className="my-4" />

            {/* Collect Payments */}
            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <DollarSign className="mr-1 inline-block size-3" />
                Collect Payments
              </Label>
              <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Enable payments</p>
                      <p className="text-xs text-muted-foreground">
                        Charge respondents before submission
                      </p>
                    </div>
                    <Switch
                      checked={paymentEnabled}
                      onCheckedChange={async (checked) => {
                        setPaymentEnabled(checked);
                        await updateForm(formId, { paymentEnabled: checked });
                      }}
                    />
                  </div>
                  {paymentEnabled && (
                    <>
                      {/* Currency selector — always visible */}
                      <div className="space-y-2">
                        <Label className="text-xs">Currency</Label>
                        <Select
                          value={paymentCurrency}
                          onValueChange={async (value) => {
                            setPaymentCurrency(value);
                            const newCurrency = getCurrency(value);
                            // Revalidate simple amount
                            if (paymentMode === "simple") {
                              const currentSmallest = toSmallestUnit(
                                parseFloat(paymentAmount),
                                value,
                              );
                              if (
                                !isNaN(currentSmallest) &&
                                currentSmallest >= newCurrency.minAmount
                              ) {
                                await updateForm(formId, {
                                  paymentCurrency: value,
                                  paymentAmount: currentSmallest,
                                });
                              } else {
                                await updateForm(formId, {
                                  paymentCurrency: value,
                                });
                              }
                            } else {
                              // Tiers mode: just save currency, validation happens on tier save
                              await updateForm(formId, {
                                paymentCurrency: value,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.code.toUpperCase()} ({c.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Mode toggle */}
                      <div className="space-y-2">
                        <Label className="text-xs">Payment Mode</Label>
                        <div className="flex gap-1">
                          {(
                            [
                              { key: "simple", label: "Fixed Amount" },
                              { key: "tiers", label: "Multiple Options" },
                            ] as const
                          ).map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={async () => {
                                setPaymentMode(key);
                                if (key === "simple") {
                                  // Switching to simple: clear options
                                  setPaymentOptions([]);
                                  try {
                                    await updateForm(formId, {
                                      paymentOptions: null,
                                    });
                                  } catch {
                                    toast.error("Failed to update payment mode");
                                  }
                                } else {
                                  // Switching to tiers: clear simple amount
                                  setPaymentAmount("");
                                  try {
                                    await updateForm(formId, {
                                      paymentAmount: 0,
                                    });
                                  } catch {
                                    toast.error("Failed to update payment mode");
                                  }
                                }
                              }}
                              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                                paymentMode === key
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {paymentMode === "simple" ? (
                        <>
                          {/* Fixed amount */}
                          <div className="space-y-2">
                            <Label className="text-xs">Amount</Label>
                            <Input
                              type="number"
                              step={
                                getCurrency(paymentCurrency).zeroDecimal
                                  ? "1"
                                  : "0.01"
                              }
                              min={getMinDisplayAmount(paymentCurrency)}
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder={getMinDisplayAmount(
                                paymentCurrency,
                              ).toString()}
                              className="h-8 text-xs"
                              onBlur={async () => {
                                try {
                                  const currency = getCurrency(paymentCurrency);
                                  const smallest = toSmallestUnit(
                                    parseFloat(paymentAmount),
                                    paymentCurrency,
                                  );
                                  if (
                                    !isNaN(smallest) &&
                                    smallest >= currency.minAmount
                                  ) {
                                    await updateForm(formId, {
                                      paymentAmount: smallest,
                                    });
                                  }
                                } catch {
                                  toast.error("Failed to save payment amount");
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={paymentDescription}
                              onChange={(e) =>
                                setPaymentDescription(e.target.value)
                              }
                              placeholder="e.g., Registration fee"
                              className="h-8 text-xs"
                              onBlur={async () => {
                                try {
                                  await updateForm(formId, {
                                    paymentDescription: paymentDescription,
                                  });
                                } catch {
                                  toast.error(
                                    "Failed to save payment description",
                                  );
                                }
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Multiple Options / Tiers */}
                          <div className="space-y-2">
                            <Label className="text-xs">Selection Mode</Label>
                            <Select
                              value={paymentSelectionMode}
                              onValueChange={async (
                                value: PaymentSelectionMode,
                              ) => {
                                setPaymentSelectionMode(value);
                                try {
                                  await updateForm(formId, {
                                    paymentSelectionMode: value,
                                  });
                                } catch {
                                  toast.error("Failed to save selection mode");
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">
                                  Single choice
                                </SelectItem>
                                <SelectItem value="multi">
                                  Multiple choices
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Options</Label>
                            <div className="space-y-2">
                              {paymentOptions.map((opt, idx) => (
                                <div
                                  key={opt.id}
                                  className="flex items-center gap-1.5"
                                >
                                  <Input
                                    value={opt.label}
                                    onChange={(e) => {
                                      const next = [...paymentOptions];
                                      next[idx] = {
                                        ...next[idx],
                                        label: e.target.value,
                                      };
                                      setPaymentOptions(next);
                                    }}
                                    placeholder="Label"
                                    className="h-8 flex-1 text-xs"
                                    onBlur={async () => {
                                      const valid = paymentOptions.filter(
                                        (o) => o.label.trim() && o.amount > 0,
                                      );
                                      if (valid.length > 0) {
                                        try {
                                          await updateForm(formId, {
                                            paymentOptions: valid,
                                          });
                                        } catch {
                                          toast.error(
                                            "Failed to save options",
                                          );
                                        }
                                      }
                                    }}
                                  />
                                  <Input
                                    type="number"
                                    step={
                                      getCurrency(paymentCurrency).zeroDecimal
                                        ? "1"
                                        : "0.01"
                                    }
                                    min={getMinDisplayAmount(paymentCurrency)}
                                    value={
                                      opt.amount > 0
                                        ? fromSmallestUnit(
                                            opt.amount,
                                            paymentCurrency,
                                          )
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const next = [...paymentOptions];
                                      const display = parseFloat(
                                        e.target.value,
                                      );
                                      next[idx] = {
                                        ...next[idx],
                                        amount: isNaN(display)
                                          ? 0
                                          : toSmallestUnit(
                                              display,
                                              paymentCurrency,
                                            ),
                                      };
                                      setPaymentOptions(next);
                                    }}
                                    placeholder={getCurrency(
                                      paymentCurrency,
                                    ).symbol}
                                    className="h-8 w-24 text-xs"
                                    onBlur={async () => {
                                      const valid = paymentOptions.filter(
                                        (o) => o.label.trim() && o.amount > 0,
                                      );
                                      if (valid.length > 0) {
                                        try {
                                          await updateForm(formId, {
                                            paymentOptions: valid,
                                          });
                                        } catch {
                                          toast.error(
                                            "Failed to save options",
                                          );
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0"
                                    onClick={async () => {
                                      const next = paymentOptions.filter(
                                        (_, i) => i !== idx,
                                      );
                                      setPaymentOptions(next);
                                      const valid = next.filter(
                                        (o) => o.label.trim() && o.amount > 0,
                                      );
                                      try {
                                        await updateForm(formId, {
                                          paymentOptions:
                                            valid.length > 0 ? valid : null,
                                        });
                                      } catch {
                                        toast.error("Failed to save options");
                                      }
                                    }}
                                  >
                                    <X className="size-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-full text-xs"
                              onClick={() => {
                                setPaymentOptions((prev) => [
                                  ...prev,
                                  {
                                    id: crypto.randomUUID(),
                                    label: "",
                                    amount: 0,
                                  },
                                ]);
                              }}
                            >
                              <Plus className="mr-1 size-3.5" />
                              Add Option
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
            </div>

            <Separator className="my-4" />

            {/* Branding */}
            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Branding
              </Label>
              <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Remove branding</p>
                    <p className="text-xs text-muted-foreground">
                      Hide &quot;Powered by GudForm&quot; footer
                    </p>
                  </div>
                  <Switch
                    checked={removeBranding}
                    onCheckedChange={async (checked) => {
                      setRemoveBranding(checked);
                      try {
                        await updateForm(formId, { removeBranding: checked });
                        toast.success(
                          checked ? "Branding removed" : "Branding restored",
                        );
                      } catch {
                        toast.error("Failed to update branding");
                      }
                    }}
                  />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
