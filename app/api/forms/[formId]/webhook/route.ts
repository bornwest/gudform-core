import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// Generate embed code and webhook URL
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const { formId } = await params;
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await prisma.form.findFirst({
      where: { id: formId, userId: user.id },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const formUrl = `${baseUrl}/f/${form.slug}`;

    const embedCode = `<iframe src="${formUrl}" width="100%" height="600" frameborder="0" style="border:none;"></iframe>`;

    const scriptEmbed = `<div id="gudform-${form.slug}"></div>
<script src="${baseUrl}/embed.js" data-form="${form.slug}"></script>`;

    return NextResponse.json({
      formUrl,
      embedCode,
      scriptEmbed,
      webhookUrl: `${baseUrl}/api/forms/${form.id}/responses`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate embed info" },
      { status: 500 },
    );
  }
}
