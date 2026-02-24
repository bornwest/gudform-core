import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import type { PaymentOption } from "@/lib/types/payment";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { responseId, selectedOptionIds } = await req.json();

    if (!responseId) {
      return NextResponse.json(
        { error: "Missing responseId" },
        { status: 400 },
      );
    }

    const form = await prisma.form.findFirst({
      where: { slug, status: "PUBLISHED", paymentEnabled: true },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found or payments not configured" },
        { status: 404 },
      );
    }

    // Verify the response exists and is pending
    const response = await prisma.formResponse.findFirst({
      where: { id: responseId, formId: form.id, paymentStatus: "PENDING" },
    });

    if (!response) {
      return NextResponse.json(
        { error: "Invalid response" },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const stripe = getStripe();

    // Build line items — multi-tier or single amount
    const formPaymentOptions = form.paymentOptions as PaymentOption[] | null;
    let lineItems: {
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }[];

    if (
      formPaymentOptions &&
      formPaymentOptions.length > 0 &&
      Array.isArray(selectedOptionIds) &&
      selectedOptionIds.length > 0
    ) {
      // Multi-tier: one line item per selected option
      const optionMap = new Map(formPaymentOptions.map((o) => [o.id, o]));
      lineItems = selectedOptionIds
        .map((id: string) => optionMap.get(id))
        .filter((opt): opt is PaymentOption => !!opt)
        .map((opt) => ({
          price_data: {
            currency: form.paymentCurrency,
            product_data: {
              name: opt.label,
              description: `Payment for: ${form.title}`,
            },
            unit_amount: opt.amount,
          },
          quantity: 1,
        }));

      if (lineItems.length === 0) {
        return NextResponse.json(
          { error: "No valid payment options selected" },
          { status: 400 },
        );
      }
    } else if (form.paymentAmount) {
      // Single amount
      lineItems = [
        {
          price_data: {
            currency: form.paymentCurrency,
            product_data: {
              name: form.paymentDescription || form.title,
              description: `Payment for: ${form.title}`,
            },
            unit_amount: form.paymentAmount,
          },
          quantity: 1,
        },
      ];
    } else {
      return NextResponse.json(
        { error: "No payment amount configured" },
        { status: 400 },
      );
    }

    // Direct Stripe checkout (self-hosted: payments go to platform's own Stripe account)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${appUrl}/f/${slug}/payment-success?session_id={CHECKOUT_SESSION_ID}&response_id=${responseId}`,
      cancel_url: `${appUrl}/f/${slug}/payment-cancel?response_id=${responseId}`,
      metadata: {
        formId: form.id,
        responseId,
        formSlug: slug,
        ...(selectedOptionIds
          ? { selectedOptionIds: JSON.stringify(selectedOptionIds) }
          : {}),
      },
    });

    // Store checkout session ID on the response
    await prisma.formResponse.update({
      where: { id: responseId },
      data: { stripeCheckoutSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Payment session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 },
    );
  }
}
