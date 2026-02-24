import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { contrastColor } from "@/lib/utils";

interface PaymentCancelProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    response_id?: string;
  }>;
}

export default async function PaymentCancelPage({
  params,
  searchParams,
}: PaymentCancelProps) {
  const { slug } = await params;
  const { response_id } = await searchParams;

  const form = await prisma.form.findFirst({
    where: { slug },
    select: {
      id: true,
      title: true,
      themeColor: true,
      backgroundColor: true,
      themeMode: true,
    },
  });

  if (!form) notFound();

  // Determine effective background colour.  When themeMode is DARK and the
  // stored background is plain white we swap it to a dark surface.
  const defaultBg = form.backgroundColor || "#ffffff";
  const isDefaultWhiteBg =
    defaultBg.toLowerCase() === "#ffffff" || defaultBg.toLowerCase() === "#fff";
  const bgColor =
    form.themeMode === "DARK" && isDefaultWhiteBg ? "#0f172a" : defaultBg;

  // Detect dark background using actual luminance — reliable for every colour.
  const isDark = contrastColor(bgColor) === "white";

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: bgColor }}
    >
      <div className="text-center">
        <div
          className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full"
          style={{
            backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
          }}
        >
          <svg
            className="size-8"
            style={{ color: isDark ? "#f87171" : "#ef4444" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1
          className="text-3xl font-bold"
          style={{ color: isDark ? "#f9fafb" : "#111827" }}
        >
          Payment cancelled
        </h1>
        <p
          className="mt-4 text-lg"
          style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
        >
          Your payment was not completed. No charges were made.
        </p>
        <div className="mt-8">
          <Link
            href={`/f/${slug}`}
            className="inline-flex items-center rounded-lg px-6 py-3 text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: form.themeColor, color: contrastColor(form.themeColor) }}
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  );
}
