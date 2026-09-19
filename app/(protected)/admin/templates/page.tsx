"use client";

import { useEffect, useState, useTransition } from "react";
import { TemplateStatus } from "@prisma/client";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getTemplatesForReview,
  approveTemplate,
  rejectTemplate,
} from "@/actions/template-actions";

type TemplateRow = Awaited<ReturnType<typeof getTemplatesForReview>>[number];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  IN_REVIEW:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PUBLISHED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ARCHIVED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reject dialog
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async (status?: string) => {
    setLoading(true);
    const statusFilter =
      status && status !== "ALL"
        ? (status as TemplateStatus)
        : undefined;
    const data = await getTemplatesForReview(statusFilter);
    setTemplates(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    load(value);
  };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try {
        await approveTemplate(id);
        toast.success("Template approved and published");
        await load(filter);
      } catch (err: any) {
        toast.error(err.message || "Failed to approve");
      }
    });
  };

  const handleRejectConfirm = () => {
    if (!rejectDialogId) return;
    const id = rejectDialogId;
    startTransition(async () => {
      try {
        await rejectTemplate(id, rejectReason || undefined);
        toast.success("Template rejected");
        setRejectDialogId(null);
        setRejectReason("");
        await load(filter);
      } catch (err: any) {
        toast.error(err.message || "Failed to reject");
      }
    });
  };

  const pendingCount = templates.filter(
    (t) => t.status === "IN_REVIEW",
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Template Reviews
          </h1>
          <p className="text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} template${pendingCount !== 1 ? "s" : ""} pending review`
              : "No pending reviews"}
          </p>
        </div>
        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="IN_REVIEW">Pending Review</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Drafts</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="mt-8 p-8 text-center text-muted-foreground">
          No templates found for this filter.
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {templates.map((t) => {
            const isExpanded = expandedId === t.id;
            const formData = t.formData as any;
            const questions: any[] = Array.isArray(formData?.questions)
              ? formData.questions
              : [];

            return (
              <Card key={t.id} className="overflow-hidden">
                {/* Row header */}
                <div
                  className="flex cursor-pointer items-center gap-4 p-4 hover:bg-muted/30"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : t.id)
                  }
                >
                  <button className="shrink-0 text-muted-foreground">
                    {isExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>
                  <span className="text-xl">{t.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{t.name}</p>
                      {t.isOfficial && (
                        <span className="text-xs text-green-500">
                          Official
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[t.status]}`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      by {t.authorName} &middot;{" "}
                      {t.category.charAt(0) +
                        t.category.slice(1).toLowerCase().replace("_", " ")}{" "}
                      &middot; {questions.length} questions &middot;{" "}
                      {formatDate(t.createdAt.toISOString())}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t.status === "IN_REVIEW" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(t.id)}
                          disabled={isPending}
                        >
                          <Check className="mr-1 size-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setRejectDialogId(t.id);
                            setRejectReason("");
                          }}
                          disabled={isPending}
                        >
                          <X className="mr-1 size-3" />
                          Reject
                        </Button>
                      </>
                    )}
                    {t.status === "REJECTED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(t.id)}
                        disabled={isPending}
                      >
                        Reconsider
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="border-t bg-muted/10 p-4">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Template info */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Template Details
                        </h4>
                        <dl className="space-y-2 text-sm">
                          <div>
                            <dt className="text-muted-foreground">
                              Description
                            </dt>
                            <dd>{t.description}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Author</dt>
                            <dd>
                              {t.authorName}{" "}
                              {t.authorEmail && (
                                <span className="text-muted-foreground">
                                  ({t.authorEmail})
                                </span>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Pricing</dt>
                            <dd>
                              {t.pricingType === "FREE"
                                ? "Free"
                                : `$${((t.pricingAmount || 0) / 100).toFixed(2)} ${t.pricingCurrency.toUpperCase()}`}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Uses</dt>
                            <dd>{t.useCount}</dd>
                          </div>
                          {t.rejectionReason && (
                            <div>
                              <dt className="text-muted-foreground">
                                Rejection Reason
                              </dt>
                              <dd className="text-red-600 dark:text-red-400">
                                {t.rejectionReason}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      {/* Questions preview */}
                      <div>
                        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Questions ({questions.length})
                        </h4>
                        <div className="max-h-64 space-y-1 overflow-y-auto">
                          {questions.map((q: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 rounded border bg-background px-3 py-2 text-sm"
                            >
                              <span className="text-xs text-muted-foreground">
                                {idx + 1}.
                              </span>
                              <span className="flex-1 truncate">
                                {q.title}
                              </span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {q.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectDialogId}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialogId(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Template</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this template. This will be
              visible to the author.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional but recommended)..."
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogId(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
