"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  getMyTemplates,
  submitTemplateForReview,
  deleteTemplateDraft,
} from "@/actions/template-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TemplateRow = Awaited<ReturnType<typeof getMyTemplates>>[number];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  IN_REVIEW:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PUBLISHED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ARCHIVED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

export default function MyTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyTemplates();
      setTemplates(data);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmitForReview = (id: string) => {
    startTransition(async () => {
      try {
        await submitTemplateForReview(id);
        toast.success("Template submitted for review");
        await load();
      } catch (err: any) {
        toast.error(err.message || "Failed to submit");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteTemplateDraft(id);
        toast.success("Template deleted");
        await load();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete");
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Templates</h1>
          <p className="text-muted-foreground">
            Templates you&apos;ve created from your forms
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Plus className="mr-1.5 size-4" />
              Export from Form
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="mt-8 p-8 text-center">
          <p className="text-muted-foreground">
            You haven&apos;t created any templates yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Go to any form in your dashboard and use the &quot;Export as
            Template&quot; option.
          </p>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex items-center gap-4 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                {t.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{t.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[t.status]}`}
                  >
                    {t.status.replace("_", " ")}
                  </span>
                </div>
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {t.description}
                </p>
                {t.rejectionReason && (
                  <p className="mt-1 text-xs text-red-500">
                    Rejection: {t.rejectionReason}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {t.useCount} uses
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {t.pricingType === "FREE"
                    ? "Free"
                    : `$${((t.pricingAmount || 0) / 100).toFixed(2)}`}
                </Badge>
                {(t.status === "DRAFT" || t.status === "REJECTED") && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleSubmitForReview(t.id)}
                      disabled={isPending}
                    >
                      Submit for Review
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(t.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
                {t.status === "PUBLISHED" && (
                  <Link href={`/templates/${t.slug}`}>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
