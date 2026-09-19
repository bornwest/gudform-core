"use client";

import { useState } from "react";
import { FileJson } from "lucide-react";
import { toast } from "sonner";

import { importFormDefinition } from "@/lib/form-import";
import type { Question } from "@/app/(protected)/dashboard/forms/[formId]/builder/components/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuestionType } from "@prisma/client";

export function ImportFormDialog({
  onImport,
}: {
  onImport: (questions: Question[], title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");

  const handleImport = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      toast.error("Paste valid JSON");
      return;
    }
    const result = importFormDefinition(parsed);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onImport(
      result.questions.map((question) => ({
        type: question.type,
        title: question.title,
        description: question.description,
        required: question.required,
        properties: question.properties,
        logic: [],
      })),
      result.title,
    );
    setOpen(false);
    setRaw("");
    toast.success(`Imported ${result.questions.length} questions`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileJson className="mr-1.5 size-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import questions</DialogTitle>
          <DialogDescription>
            Paste a Typeform fields export, a Google Forms items export, or a
            GudForm questions JSON array. This replaces the current questions
            (thank-you screen is kept if the import has none).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="import-json">JSON</Label>
          <Textarea
            id="import-json"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={12}
            placeholder='{ "title": "Launch survey", "fields": [{ "type": "short_text", "title": "Name" }] }'
            className="font-mono text-xs"
          />
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={!raw.trim()}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function mergeImportedQuestions(
  existing: Question[],
  imported: Question[],
): Question[] {
  const hasThankYou = imported.some(
    (question) => question.type === QuestionType.THANK_YOU_SCREEN,
  );
  if (hasThankYou) return imported;
  const thankYou = existing.find(
    (question) => question.type === QuestionType.THANK_YOU_SCREEN,
  );
  return thankYou ? [...imported, thankYou] : imported;
}
