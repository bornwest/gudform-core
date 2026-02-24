"use client";

import { ShieldCheck } from "lucide-react";
import { QuestionType } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Question, QuestionProperties } from "./types";

export function ValidationEditor({
  question,
  onUpdate,
}: {
  question: Question;
  onUpdate: (props: Partial<QuestionProperties>) => void;
}) {
  const validation = (question.properties.validation ?? {}) as Record<
    string,
    any
  >;

  const update = (key: string, value: any) => {
    onUpdate({
      validation: { ...validation, [key]: value },
    });
  };

  const showEmail = question.type === QuestionType.EMAIL;
  const showPhone = question.type === QuestionType.PHONE;
  const showNumber = question.type === QuestionType.NUMBER;

  if (!showEmail && !showPhone && !showNumber) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-muted-foreground" />
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Validation Rules
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Add extra validation beyond required checks. Invalid answers will be
        blocked with an error message.
      </p>

      {showEmail && (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <div className="space-y-2">
            <Label className="text-xs">
              Allowed domains{" "}
              <span className="font-normal text-muted-foreground">
                (only these accepted)
              </span>
            </Label>
            <Input
              value={(validation.allowedDomains ?? []).join(", ")}
              onChange={(e) =>
                update(
                  "allowedDomains",
                  e.target.value
                    .split(",")
                    .map((d: string) => d.trim().toLowerCase())
                    .filter(Boolean),
                )
              }
              placeholder="e.g. company.com, agency.org"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">
              Blocked domains{" "}
              <span className="font-normal text-muted-foreground">
                (these rejected)
              </span>
            </Label>
            <Input
              value={(validation.blockedDomains ?? []).join(", ")}
              onChange={(e) =>
                update(
                  "blockedDomains",
                  e.target.value
                    .split(",")
                    .map((d: string) => d.trim().toLowerCase())
                    .filter(Boolean),
                )
              }
              placeholder="e.g. gmail.com, yahoo.com, hotmail.com"
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}

      {showPhone && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
          <div>
            <Label htmlFor="phone-format" className="cursor-pointer text-xs">
              Enforce phone format
            </Label>
            <p className="text-xs text-muted-foreground">
              Requires a valid phone pattern (digits, spaces, dashes,
              parentheses)
            </p>
          </div>
          <Switch
            id="phone-format"
            checked={validation.phoneFormat ?? false}
            onCheckedChange={(checked) => update("phoneFormat", checked)}
          />
        </div>
      )}

      {showNumber && (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <Label className="text-xs">Value range</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Minimum</Label>
              <Input
                type="number"
                value={validation.min ?? ""}
                onChange={(e) =>
                  update(
                    "min",
                    e.target.value === ""
                      ? undefined
                      : parseFloat(e.target.value),
                  )
                }
                placeholder="No min"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Maximum</Label>
              <Input
                type="number"
                value={validation.max ?? ""}
                onChange={(e) =>
                  update(
                    "max",
                    e.target.value === ""
                      ? undefined
                      : parseFloat(e.target.value),
                  )
                }
                placeholder="No max"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
