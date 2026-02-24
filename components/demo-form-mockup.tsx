import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DemoFormMockup() {
  return (
    <div className="w-full max-w-3xl">
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-muted/30 p-1 shadow-2xl shadow-green-500/10">
        <div className="rounded-lg bg-background">
          {/* Mock browser bar */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-red-400" />
              <div className="size-3 rounded-full bg-yellow-400" />
              <div className="size-3 rounded-full bg-green-400" />
            </div>
            <div className="ml-3 flex-1 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
              gudform.com/f/customer-feedback
            </div>
          </div>

          {/* Mock form content */}
          <div className="flex min-h-[340px] flex-col items-center justify-center px-8 py-12">
            {/* Progress indicator */}
            <div className="mb-8 flex items-center gap-2">
              <div className="text-xs font-medium text-muted-foreground">
                Question 2 of 5
              </div>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-green-500 to-teal-500 transition-all" />
              </div>
            </div>

            {/* Question */}
            <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
              How would you rate your experience?
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Your feedback helps us improve
            </p>

            {/* Rating buttons */}
            <div className="mt-8 flex gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl border-2 text-lg font-semibold transition-all md:size-14 md:text-xl",
                    n === 4
                      ? "border-green-500 bg-green-50 text-green-600 shadow-md shadow-green-500/20 dark:bg-green-500/10 dark:text-green-400"
                      : "border-muted hover:border-green-300",
                  )}
                >
                  {n}
                </div>
              ))}
            </div>

            {/* Navigation hint */}
            <div className="mt-8 flex items-center gap-2">
              <Button
                size="lg"
                rounded="lg"
                className="bg-gradient-to-r from-green-500 to-teal-600 px-8 text-white"
                disabled
              >
                Next
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              press{" "}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                Enter
              </kbd>{" "}
              to continue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
