"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Eye,
  Inbox,
  Timer,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { cn, formatDate, truncate } from "@/lib/utils";
import { formatPaymentAmount } from "@/config/currencies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteResponse,
  getFormAnalytics,
  getFormResponses,
} from "@/actions/form-actions";

type FormResponse = Awaited<ReturnType<typeof getFormResponses>>[number];
type FormAnalytics = Awaited<ReturnType<typeof getFormAnalytics>>;

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remaining}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export default function FormResponsesPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const formId = params.formId;

  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      try {
        const [responsesData, analyticsData] = await Promise.all([
          getFormResponses(formId),
          getFormAnalytics(formId),
        ]);
        setResponses(responsesData);
        setAnalytics(analyticsData);
      } catch (error) {
        toast.error("Failed to load responses");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [formId]);

  const handleDelete = (responseId: string) => {
    setResponseToDelete(responseId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!responseToDelete) return;
    startTransition(async () => {
      try {
        await deleteResponse(responseToDelete);
        setResponses((prev) => prev.filter((r) => r.id !== responseToDelete));
        toast.success("Response deleted");
        // Refresh analytics
        const updatedAnalytics = await getFormAnalytics(formId);
        setAnalytics(updatedAnalytics);
      } catch (error) {
        toast.error("Failed to delete response");
      } finally {
        setDeleteDialogOpen(false);
        setResponseToDelete(null);
      }
    });
  };

  const handleDownloadCSV = () => {
    if (responses.length === 0) {
      toast.error("No responses to export");
      return;
    }

    // Collect all unique question titles for column headers
    const questionMap = new Map<string, string>();
    for (const response of responses) {
      for (const answer of response.answers) {
        if (!questionMap.has(answer.questionId)) {
          questionMap.set(answer.questionId, answer.question.title);
        }
      }
    }

    const questionIds = Array.from(questionMap.keys());
    const headers = [
      "Response ID",
      "Submitted At",
      "Status",
      "Payment Status",
      "Payment Amount",
      ...questionIds.map((id) => questionMap.get(id) || "Unknown"),
    ];

    const rows = responses.map((response) => {
      const answerMap = new Map(
        response.answers.map((a) => [a.questionId, a.value]),
      );
      return [
        response.id,
        response.completedAt
          ? new Date(response.completedAt).toISOString()
          : new Date(response.startedAt).toISOString(),
        response.completedAt ? "Completed" : "Partial",
        response.paymentStatus || "",
        response.paymentAmount
          ? formatPaymentAmount(response.paymentAmount, response.paymentCurrency || "usd")
          : "",
        ...questionIds.map((id) => answerMap.get(id) || ""),
      ];
    });

    const csvContent = [
      headers.map(escapeCsvField).join(","),
      ...rows.map((row) => row.map(escapeCsvField).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `form-responses-${formId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-4">
          <Skeleton className="size-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-8 h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/forms/${formId}/builder`)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Responses</h1>
            <p className="text-sm text-muted-foreground">
              View and manage form responses
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadCSV}
          disabled={responses.length === 0}
        >
          <Download className="mr-2 size-4" />
          Download CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Views
            </CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics?.viewCount ?? 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              total form visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Responses
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics?.totalResponses ?? 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {analytics?.completedResponses ?? 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics?.conversionRate ?? 0}%
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-teal-500 transition-all"
                style={{ width: `${analytics?.conversionRate ?? 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics?.completionRate ?? 0}%
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
                style={{ width: `${analytics?.completionRate ?? 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Time
            </CardTitle>
            <Timer className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics?.avgCompletionTime
                ? formatDuration(analytics.avgCompletionTime)
                : "--"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              per response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payments
            </CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(() => {
                const paidResponses = responses.filter(
                  (r) => r.paymentStatus === "COMPLETED" && r.paymentAmount,
                );
                if (paidResponses.length === 0) return "--";
                const byCurrency = new Map<string, number>();
                for (const r of paidResponses) {
                  const cur = r.paymentCurrency || "usd";
                  byCurrency.set(cur, (byCurrency.get(cur) || 0) + (r.paymentAmount || 0));
                }
                return Array.from(byCurrency.entries())
                  .map(([cur, total]) => formatPaymentAmount(total, cur))
                  .join(" + ");
              })()}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {responses.filter((r) => r.paymentStatus === "COMPLETED").length} paid
              {(analytics?.pendingPaymentCount ?? 0) > 0 && (
                <span>
                  {" "}· {analytics?.pendingPaymentCount} pending
                  {(analytics?.pendingPaymentAmount ?? 0) > 0 && (
                    <span> ({formatPaymentAmount(analytics!.pendingPaymentAmount, "usd")})</span>
                  )}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Responses Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            All Responses
          </CardTitle>
          <CardDescription>
            {responses.length} total response{responses.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <Inbox className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No responses yet</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Share your form to start collecting responses. They will appear
                here in real-time.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>Response ID</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((response) => (
                  <ResponseRow
                    key={response.id}
                    response={response}
                    isExpanded={expandedId === response.id}
                    onToggle={() => toggleExpanded(response.id)}
                    onDelete={() => handleDelete(response.id)}
                    isPending={isPending}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Response</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this response? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResponseRow({
  response,
  isExpanded,
  onToggle,
  onDelete,
  isPending,
}: {
  response: FormResponse;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const isCompleted = !!response.completedAt;
  const submittedDate = response.completedAt || response.startedAt;

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={onToggle}
      >
        <TableCell>
          {isExpanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="font-mono text-sm">
          {truncate(response.id, 12)}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="text-sm">
              {formatDate(new Date(submittedDate).toISOString())}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge
            variant={isCompleted ? "default" : "secondary"}
            className={cn(
              isCompleted
                ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
            )}
          >
            {isCompleted ? "Completed" : "Partial"}
          </Badge>
        </TableCell>
        <TableCell>
          {response.paymentStatus ? (
            <Badge
              variant="secondary"
              className={cn(
                response.paymentStatus === "COMPLETED"
                  ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30"
                  : response.paymentStatus === "PENDING"
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-100"
                    : response.paymentStatus === "FAILED"
                      ? "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              {response.paymentStatus === "COMPLETED" && response.paymentAmount
                ? formatPaymentAmount(response.paymentAmount, response.paymentCurrency || "usd")
                : response.paymentStatus}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded answer details */}
      {isExpanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={6} className="p-0">
            <div className="px-6 py-4">
              <h4 className="mb-3 text-sm font-semibold">Answers</h4>
              {response.answers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No answers recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {response.answers.map((answer) => (
                    <div key={answer.id}>
                      <div className="text-xs font-medium text-muted-foreground">
                        {answer.question.title}
                      </div>
                      <div className="mt-0.5 text-sm">
                        {answer.value || (
                          <span className="italic text-muted-foreground">
                            No answer
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator className="my-4" />

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Response ID:</span>{" "}
                  <span className="font-mono">{response.id}</span>
                </div>
                <div>
                  <span className="font-medium">Started:</span>{" "}
                  {formatDate(new Date(response.startedAt).toISOString())}
                </div>
                {response.completedAt && (
                  <div>
                    <span className="font-medium">Completed:</span>{" "}
                    {formatDate(
                      new Date(response.completedAt).toISOString(),
                    )}
                  </div>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function escapeCsvField(field: string | null | undefined): string {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
