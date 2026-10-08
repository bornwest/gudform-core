"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getUserCollections } from "@/actions/collection-actions";
import {
  createForm,
  deleteForm,
  duplicateForm,
  getSharedForms,
  getUserForms,
} from "@/actions/form-actions";
import {
  BarChart3,
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  Grid3x3,
  List,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { MoveFormDialog } from "@/components/collections/move-form-dialog";

type FormWithCounts = Awaited<ReturnType<typeof getUserForms>>[number];
type SharedForm = Awaited<ReturnType<typeof getSharedForms>>[number];
type CollectionSummary = Awaited<ReturnType<typeof getUserCollections>>[number];

export default function DashboardPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormWithCounts[]>([]);
  const [sharedForms, setSharedForms] = useState<SharedForm[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] =
    useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [moveFormId, setMoveFormId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const loadForms = async (collectionId?: string) => {
    const data = await getUserForms(
      collectionId && collectionId !== "all" ? collectionId : undefined,
    );
    setForms(data);
  };

  useEffect(() => {
    // Load view mode preference from localStorage
    const savedViewMode = localStorage.getItem("forms-view-mode");
    if (savedViewMode === "list" || savedViewMode === "grid") {
      setViewMode(savedViewMode);
    }

    Promise.all([getUserForms(), getSharedForms(), getUserCollections()]).then(
      ([formsData, sharedData, collectionsData]) => {
        setForms(formsData);
        setSharedForms(sharedData);
        setCollections(collectionsData);
        setLoading(false);
      },
    );
  }, []);

  const handleViewModeChange = (value: string) => {
    if (value === "grid" || value === "list") {
      setViewMode(value);
      localStorage.setItem("forms-view-mode", value);
    }
  };

  const handleCollectionFilter = (value: string) => {
    setSelectedCollectionId(value);
    startTransition(async () => {
      await loadForms(value);
    });
  };

  const handleCreateForm = () => {
    startTransition(async () => {
      const form = await createForm();
      router.push(`/dashboard/forms/${form.id}/builder`);
    });
  };

  const handleDelete = (formId: string) => {
    startTransition(async () => {
      await deleteForm(formId);
      setForms((prev) => prev.filter((f) => f.id !== formId));
      toast.success("Form deleted");
    });
  };

  const handleDuplicate = (formId: string) => {
    startTransition(async () => {
      const form = await duplicateForm(formId);
      if (
        selectedCollectionId === "all" ||
        form.collectionId === selectedCollectionId
      ) {
        setForms((prev) => [form, ...prev]);
      }
      toast.success("Form duplicated");
    });
  };

  const handleFormMoved = async () => {
    setMoveFormId(null);
    // Refresh forms with current filter
    await loadForms(selectedCollectionId);
    // Refresh collection counts
    const cols = await getUserCollections();
    setCollections(cols);
  };

  return (
    <div>
      {!loading && (
        <OnboardingChecklist
          forms={forms.map((form) => ({
            status: form.status,
            publishedAt: form.publishedAt,
            responses: form._count.responses,
          }))}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Forms</h1>
          <p className="text-muted-foreground">Create and manage your forms</p>
        </div>
        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={handleViewModeChange}
            aria-label="View mode"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid3x3 className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isPending}>
                <Plus className="mr-2 size-4" />
                New Form
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCreateForm}>
                <FileText className="mr-2 size-4" />
                Blank Form
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/templates")}>
                <Sparkles className="mr-2 size-4" />
                Browse Templates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Collection Filter */}
      {!loading && collections.length > 1 && (
        <div className="mt-4">
          <Select
            value={selectedCollectionId}
            onValueChange={handleCollectionFilter}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All Collections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collections</SelectItem>
              {collections.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.isDefault ? " (Default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : (
        <TooltipProvider>
          {forms.length === 0 ? (
            <div className="mt-20 flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4">
                <Plus className="size-8 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-xl font-semibold">No forms yet</h2>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Create a blank form from scratch, or get a head start with a
                professionally designed template.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Button onClick={handleCreateForm} disabled={isPending}>
                  <Plus className="mr-2 size-4" />
                  Blank Form
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/templates")}
                >
                  <Sparkles className="mr-2 size-4" />
                  Browse Templates
                </Button>
              </div>
            </div>
          ) : (
            <FormGrid viewMode={viewMode}>
              {forms.map((form) => (
                <FormCard
                  key={form.id}
                  form={form}
                  viewMode={viewMode}
                  badge={
                    form.collection && selectedCollectionId === "all"
                      ? form.collection.name
                      : undefined
                  }
                  onDuplicate={() => handleDuplicate(form.id)}
                  onMove={() => setMoveFormId(form.id)}
                  onDelete={() => handleDelete(form.id)}
                />
              ))}
            </FormGrid>
          )}

          {/* Shared collections belong to other users, so they sit outside
              the collection filter. */}
          {selectedCollectionId === "all" && sharedForms.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold">Shared with me</h2>
              <p className="text-sm text-muted-foreground">
                Forms shared with you through your teams
              </p>
              <FormGrid viewMode={viewMode}>
                {sharedForms.map((form) => (
                  <FormCard
                    key={form.id}
                    form={form}
                    viewMode={viewMode}
                    badge={`Shared by ${form.user.name || form.user.email}`}
                    onDuplicate={() => handleDuplicate(form.id)}
                  />
                ))}
              </FormGrid>
            </section>
          )}
        </TooltipProvider>
      )}

      {/* Move Form Dialog */}
      {moveFormId && (
        <MoveFormDialog
          formId={moveFormId}
          currentCollectionId={
            forms.find((f) => f.id === moveFormId)?.collection?.id || null
          }
          onClose={() => setMoveFormId(null)}
          onMoved={handleFormMoved}
        />
      )}
    </div>
  );
}

function FormGrid({
  viewMode,
  children,
}: {
  viewMode: "grid" | "list";
  children: ReactNode;
}) {
  return (
    <div
      className={
        viewMode === "grid"
          ? "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          : "mt-6 space-y-2"
      }
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        status === "PUBLISHED"
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : status === "CLOSED"
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}

interface FormCardProps {
  form: {
    id: string;
    title: string;
    slug: string;
    status: string;
    updatedAt: Date;
    _count: { responses: number; questions: number };
  };
  viewMode: "grid" | "list";
  /** Collection name, or who shared the form. */
  badge?: string;
  onDuplicate: () => void;
  /** Owner-only actions; omitted for shared forms. */
  onMove?: () => void;
  onDelete?: () => void;
}

function FormCard({
  form,
  viewMode,
  badge,
  onDuplicate,
  onMove,
  onDelete,
}: FormCardProps) {
  const router = useRouter();

  const title = (
    <Tooltip>
      <TooltipTrigger asChild>
        <h3 className="truncate font-semibold">{form.title}</h3>
      </TooltipTrigger>
      <TooltipContent>
        <p>{form.title}</p>
      </TooltipContent>
    </Tooltip>
  );

  const badgeEl = badge && (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {onMove ? (
        <FolderOpen className="size-3" />
      ) : (
        <Users className="size-3" />
      )}
      {badge}
    </span>
  );

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0 opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/forms/${form.id}/builder`);
          }}
        >
          Edit
        </DropdownMenuItem>
        {form.status === "PUBLISHED" && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/f/${form.slug}`, "_blank");
            }}
          >
            <ExternalLink className="mr-2 size-4" />
            Share
          </DropdownMenuItem>
        )}
        {onMove && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMove();
            }}
          >
            <FolderOpen className="mr-2 size-4" />
            Move to Collection
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="mr-2 size-4" />
          Duplicate
        </DropdownMenuItem>
        {onDelete && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const openResponses = () =>
    router.push(`/dashboard/forms/${form.id}/responses`);

  if (viewMode === "grid") {
    return (
      <Card
        className="group relative cursor-pointer p-5 transition-shadow hover:shadow-md"
        onClick={openResponses}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 overflow-hidden">
            {title}
            <p className="mt-1 text-sm text-muted-foreground">
              {form._count.responses} response
              {form._count.responses !== 1 ? "s" : ""} &middot;{" "}
              {form._count.questions} question
              {form._count.questions !== 1 ? "s" : ""}
            </p>
          </div>
          {menu}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={form.status} />
          {badgeEl}
          <span className="text-xs text-muted-foreground">
            Updated {formatDate(form.updatedAt.toISOString())}
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="group cursor-pointer p-4 transition-shadow hover:shadow-md"
      onClick={openResponses}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {title}
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={form.status} />
              {badgeEl}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">{form._count.responses}</span>{" "}
              response{form._count.responses !== 1 ? "s" : ""}
            </div>
            <div>
              <span className="font-medium">{form._count.questions}</span>{" "}
              question{form._count.questions !== 1 ? "s" : ""}
            </div>
            <div className="text-xs">
              Updated {formatDate(form.updatedAt.toISOString())}
            </div>
          </div>
        </div>
        {menu}
      </div>
    </Card>
  );
}
