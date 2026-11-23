import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { headers } from "next/headers";

import {
  getClosedPublicForm,
  getPreviewForm,
  getPublicForm,
  recordFormView,
} from "@/actions/form-actions";
import { FormRenderer } from "@/components/form-renderer/form-renderer";
import { GoogleTagManager } from "@next/third-parties/google";
import { getGtmContainerId } from "@/lib/site-settings";

import { FormClosed } from "./form-closed";

interface FormPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    preview?: string;
    embed?: string;
  }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: FormPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;

  const form = preview === "true"
    ? await getPreviewForm(slug)
    : await getPublicForm(slug);

  if (!form) {
    const closed = preview === "true" ? null : await getClosedPublicForm(slug);
    return closed
      ? { title: closed.title, description: "This form is closed" }
      : { title: "Form Not Found" };
  }

  return {
    title: form.title,
    description: form.description || "Fill out this form",
  };
}

export default async function PublicFormPage({
  params,
  searchParams,
}: FormPageProps) {
  const { slug } = await params;
  const { preview, embed } = await searchParams;

  const isPreview = preview === "true";
  const isEmbed = embed === "1" || embed === "true";
  const form = isPreview
    ? await getPreviewForm(slug)
    : await getPublicForm(slug);

  if (!form) {
    const closed = isPreview ? null : await getClosedPublicForm(slug);
    if (closed) {
      return (
        <FormClosed
          title={closed.title}
          themeMode={closed.themeMode}
          message={closed.closedMessage}
        />
      );
    }
    notFound();
  }

  // Track form view (non-preview only, fire-and-forget)
  if (!isPreview) {
    const headersList = await headers();
    recordFormView(form.id, {
      ipAddress: headersList.get("x-forwarded-for")?.split(",")[0] ?? undefined,
      userAgent: headersList.get("user-agent") ?? undefined,
      referrer: headersList.get("referer") ?? undefined,
    }).catch(() => {});
  }

  // GTM runs on the live form only, never in preview.
  const gtmContainerId = isPreview ? null : await getGtmContainerId();

  const formData = {
    id: form.id,
    slug: form.slug,
    title: form.title,
    description: form.description,
    themeColor: form.themeColor,
    backgroundColor: form.backgroundColor,
    themeMode: form.themeMode,
    showProgressBar: form.showProgressBar,
    displayMode: form.displayMode,
    redirectUrl: form.redirectUrl,
    gtm: Boolean(gtmContainerId),
    paymentEnabled: form.paymentEnabled,
    paymentAmount: form.paymentAmount,
    paymentCurrency: form.paymentCurrency,
    paymentDescription: form.paymentDescription,
    paymentOptions: (form.paymentOptions as import("@/lib/types/payment").PaymentOption[] | null) ?? null,
    paymentSelectionMode: (form.paymentSelectionMode as import("@/lib/types/payment").PaymentSelectionMode) || "single",
    questions: form.questions.map((q) => ({
      id: q.id,
      order: q.order,
      type: q.type,
      title: q.title,
      description: q.description,
      required: q.required,
      properties: q.properties as Record<string, any>,
      logic: Array.isArray(q.logic) ? (q.logic as any[]) : [],
    })),
  };

  return (
    <>
      {isPreview && (
        <div className="fixed inset-x-0 top-0 z-50 bg-amber-500 px-4 py-1.5 text-center text-sm font-medium text-amber-950">
          Preview Mode — Changes are not live until published
        </div>
      )}
      {gtmContainerId && <GoogleTagManager gtmId={gtmContainerId} />}
      <FormRenderer form={formData} isPreview={isPreview} isEmbed={isEmbed} />
    </>
  );
}
