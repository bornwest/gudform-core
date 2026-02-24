"use client";

import { useCallback, useState } from "react";
import { Check } from "lucide-react";

import type { PaymentOption, PaymentSelectionMode } from "@/lib/types/payment";
import { formatPaymentAmount, getCurrency } from "@/config/currencies";
import { cn, contrastColor } from "@/lib/utils";

interface PaymentSelectorProps {
  options: PaymentOption[];
  selectionMode: PaymentSelectionMode;
  currency: string;
  themeColor: string;
  bgIsDark: boolean;
  onConfirm: (selectedIds: string[]) => void;
  submitting: boolean;
}

export function PaymentSelector({
  options,
  selectionMode,
  currency,
  themeColor,
  bgIsDark,
  onConfirm,
  submitting,
}: PaymentSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (selectionMode === "single") {
          return new Set([id]);
        }
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [selectionMode],
  );

  const total = options
    .filter((o) => selectedIds.has(o.id))
    .reduce((sum, o) => sum + o.amount, 0);

  const currencyConfig = getCurrency(currency);
  const meetsMinimum = total >= currencyConfig.minAmount;
  const canConfirm = selectedIds.size > 0 && meetsMinimum && !submitting;

  const c = bgIsDark
    ? {
        text: "text-gray-100",
        textMuted: "text-gray-400",
        border: "border-gray-700",
        surface: "bg-gray-800/50",
      }
    : {
        text: "text-gray-900",
        textMuted: "text-gray-500",
        border: "border-gray-300",
        surface: "bg-gray-50",
      };

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6">
      <h3 className={cn("text-xl font-bold", c.text)}>
        {selectionMode === "single"
          ? "Select a payment option"
          : "Select your options"}
      </h3>

      <div className="flex w-full flex-col gap-3">
        {options.map((opt) => {
          const isSelected = selectedIds.has(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={cn(
                "flex items-center justify-between rounded-xl border-2 px-5 py-4 text-left transition-all",
                c.text,
                isSelected
                  ? "shadow-md"
                  : cn(c.border, "hover:shadow-sm"),
              )}
              style={
                isSelected
                  ? {
                      borderColor: themeColor,
                      backgroundColor: `${themeColor}10`,
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border-2 transition-colors",
                    !isSelected && c.border,
                  )}
                  style={
                    isSelected
                      ? {
                          backgroundColor: themeColor,
                          borderColor: themeColor,
                        }
                      : undefined
                  }
                >
                  {isSelected && (
                    <Check
                      className="size-3.5"
                      style={{ color: contrastColor(themeColor) }}
                    />
                  )}
                </div>
                <span className="text-base font-medium">{opt.label}</span>
              </div>
              <span className="text-base font-bold">
                {formatPaymentAmount(opt.amount, currency)}
              </span>
            </button>
          );
        })}
      </div>

      {selectionMode === "multi" && selectedIds.size > 0 && (
        <div className={cn("text-base font-semibold", c.text)}>
          Total: {formatPaymentAmount(total, currency)}
        </div>
      )}

      <button
        onClick={() => onConfirm(Array.from(selectedIds))}
        disabled={!canConfirm}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg px-8 text-base font-semibold transition-all hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:brightness-75 disabled:pointer-events-none disabled:opacity-40"
        style={{
          backgroundColor: themeColor,
          color: contrastColor(themeColor),
        }}
      >
        {submitting ? (
          <div
            className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          `Continue to payment${selectedIds.size > 0 ? ` - ${formatPaymentAmount(total, currency)}` : ""}`
        )}
      </button>
    </div>
  );
}
