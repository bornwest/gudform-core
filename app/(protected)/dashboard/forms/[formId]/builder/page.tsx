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

import { isOssEdition, OSS_PLAN_FEATURES } from "@/config/edition";
import { PLANS, SubscriptionPlan } from "@/config/subscriptions";
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
  QUESTION_TYPE_GROUPS,
  SCREEN_TYPES,
  FORM_COMPONENTS,
  getThankYouScreenIndex,
  normalizeQuestionsThankYouLast,
  createQuestionFromPalette,
  type PaletteItem,
} from "./components/constants";
import { SidebarQuestionItem } from "./components/sidebar-question-item";
import { QuestionEditor } from "./components/question-editor";
import {
  ImportFormDialog,
  mergeImportedQuestions,
} from "@/components/forms/import-form-dialog";

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
  const [displayMode, setDisplayMode] = useState<"conversational" | "classic">("conversational");
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
  const [hasConnectAccount, setHasConnectAccount] = useState(false);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);
  const [planId, setPlanId] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
  const planFeatures = isOssEdition()
    ? OSS_PLAN_FEATURES
    : PLANS[planId].features;
  const canUseWebhooks = planFeatures.webhooks;
  const canUseBranding = planFeatures.customBranding;
  const coreUnlocked = canUseBranding;
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
      setDisplayMode((form.displayMode as "conversational" | "classic") || "conversational");
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
      setHasConnectAccount(
        (form as any).user?.stripeConnectAccount?.onboardingCompleted ?? false,
      );
      setHasPaidPlan(
        (form as any).user?.subscription?.plan === "PRO" ||
          (form as any).user?.subscription?.plan === "BUSINESS",
      );
      setPlanId(
        ((form as any).user?.subscription?.plan as SubscriptionPlan) ||
          SubscriptionPlan.FREE,
      );
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
              const match = rule.action.questionId.match(/^__new_(\d+)__$/) ;
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
            const match = dest.questionId.match(/^__new_(\d+)__$/) ;
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
