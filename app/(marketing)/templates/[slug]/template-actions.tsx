"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cloneTemplateAction } from "@/actions/template-actions";
import { Button } from "@/components/ui/button";

interface TemplateActionsProps {
  templateId: string;
  pricingType: string;
  slug: string;
}

function setPendingTemplateCookie(templateId: string) {
  document.cookie = `pending_template=${templateId};path=/;max-age=600;samesite=lax`;
}

export function TemplateActions({
  templateId,
  pricingType,
  slug,
}: TemplateActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUseTemplate = async () => {
    setLoading(true);
    try {
      const result = await cloneTemplateAction(templateId);

      if ("error" in result) {
        if (result.error === "Unauthorized") {
          setPendingTemplateCookie(templateId);
          router.push(`/login?from=/templates/${slug}`);
          return;
        }
        toast.error(result.error);
        return;
      }

      toast.success("Template cloned! Redirecting to builder...");
      router.push(`/dashboard/forms/${result.id}/builder`);
    } catch {
      toast.error("Failed to use template");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/purchase`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setPendingTemplateCookie(templateId);
          router.push(`/login?from=/templates/${slug}`);
          return;
        }
        throw new Error(data.error || "Purchase failed");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start purchase");
    } finally {
      setLoading(false);
    }
  };

  if (pricingType === "FREE") {
    return (
      <Button
        className="mt-4 w-full bg-green-600 hover:bg-green-700"
        onClick={handleUseTemplate}
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
        Use Template
      </Button>
    );
  }

  return (
    <Button
      className="mt-4 w-full bg-green-600 hover:bg-green-700"
      onClick={handlePurchase}
      disabled={loading}
    >
      {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
      Purchase Template
    </Button>
  );
}
