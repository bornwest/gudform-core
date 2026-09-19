"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

import {
  getOnboardingProgress,
  type OnboardingFormSummary,
  type OnboardingStep,
} from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STEPS: { id: OnboardingStep; label: string; href: string }[] = [
  { id: "create", label: "Create a form", href: "/dashboard" },
  { id: "publish", label: "Publish it", href: "/dashboard" },
  { id: "share", label: "Share the link", href: "/dashboard" },
  { id: "response", label: "Get a first response", href: "/dashboard" },
];

const STORAGE_KEY = "gudform:onboarding:dismissed";

export function OnboardingChecklist({
  forms,
}: {
  forms: OnboardingFormSummary[];
}) {
  const [dismissed, setDismissed] = useState(true);
  const progress = getOnboardingProgress(forms);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;
  if (progress.done) return null;

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Get your first response</h2>
          <p className="text-sm text-muted-foreground">
            Four steps. Share the form when it is published.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, "1");
            setDismissed(true);
          }}
          aria-label="Dismiss onboarding"
        >
          <X className="size-4" />
        </Button>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-4">
        {STEPS.map((step) => {
          const done = progress.completed.includes(step.id);
          const isNext = progress.next === step.id;
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  isNext ? "border-primary bg-background" : "bg-background/60"
                }`}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-full ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : "border text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-3" /> : null}
                </span>
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
