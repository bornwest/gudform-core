"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cloneTemplateAction } from "@/actions/template-actions";

export default function UseTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const triggered = useRef(false);

  useEffect(() => {
    if (!templateId || triggered.current) return;
    triggered.current = true;

    async function cloneTemplate() {
      try {
        const result = await cloneTemplateAction(templateId!);

        if ("error" in result) {
          toast.error(result.error);
          router.replace("/dashboard");
          return;
        }

        toast.success("Template cloned! Redirecting to builder...");
        router.replace(`/dashboard/forms/${result.id}/builder`);
      } catch {
        toast.error("Failed to use template");
        router.replace("/dashboard");
      }
    }

    cloneTemplate();
  }, [templateId, router]);

  if (!templateId) {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">
        Setting up your template...
      </p>
    </div>
  );
}
