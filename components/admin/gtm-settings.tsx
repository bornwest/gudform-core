"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateGtmContainerId } from "@/actions/admin-actions";
import { gtmIdError, normalizeGtmId } from "@/lib/gtm";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EVENTS: [string, string][] = [
  ["form_view", "a published form is opened"],
  ["form_start", "a respondent leaves the welcome screen, or answers their first question on a classic form"],
  ["form_question_submit", "a respondent moves past a question, or answers it on a classic form"],
  ["form_submit", "a response is saved"],
];

export function GtmSettings({ initialId }: { initialId: string }) {
  const [value, setValue] = useState(initialId);
  const [saved, setSaved] = useState(initialId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(next: string) {
    const id = normalizeGtmId(next);
    setValue(id);
    const invalid = gtmIdError(id);
    if (invalid) {
      setError(invalid);
      return;
    }
    startTransition(async () => {
      const result = await updateGtmContainerId(id);
      if ("error" in result) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      const savedId = result.gtmContainerId ?? "";
      setSaved(savedId);
      setValue(savedId);
      setError(null);
      toast.success(savedId ? "Tag Manager turned on" : "Tag Manager turned off");
    });
  }

  return (
    <SectionColumns
      title="Google Tag Manager"
      description="Loads your GTM container on every published form. Add GA4 and other tags in Tag Manager."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save(value);
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="gtm-container-id">Container ID</Label>
          <div className="flex gap-2">
            <Input
              id="gtm-container-id"
              value={value}
              placeholder="GTM-XXXXXXX"
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              aria-invalid={Boolean(error)}
              spellCheck={false}
              autoComplete="off"
              className="max-w-xs"
            />
            <Button
              type="submit"
              disabled={isPending || normalizeGtmId(value) === saved}
            >
              Save
            </Button>
            {saved && (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => save("")}
              >
                Turn off
              </Button>
            )}
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {saved
                ? `Published forms load ${saved}. Previews don't.`
                : "Tag Manager is off."}
            </p>
          )}
        </div>

        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <p className="font-medium">Events pushed to the data layer</p>
          <ul className="space-y-1 text-muted-foreground">
            {EVENTS.map(([name, when]) => (
              <li key={name}>
                <code className="text-foreground">{name}</code>: when {when}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            Each carries <code>form_id</code> and <code>form_title</code>.
            Question events also carry <code>question_id</code>,{" "}
            <code>question_number</code>, <code>question_type</code> and{" "}
            <code>question_title</code>. Answers are never sent.
          </p>
        </div>
      </form>
    </SectionColumns>
  );
}
