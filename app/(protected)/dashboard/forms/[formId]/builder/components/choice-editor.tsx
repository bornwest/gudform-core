"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChoiceEditor({
  choices,
  onChange,
}: {
  choices: string[];
  onChange: (choices: string[]) => void;
}) {
  const addChoice = () => {
    onChange([...choices, `Option ${choices.length + 1}`]);
  };

  const removeChoice = (index: number) => {
    if (choices.length <= 1) return;
    const next = choices.filter((_, i) => i !== index);
    onChange(next);
  };

  const updateChoice = (index: number, value: string) => {
    const next = [...choices];
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <Label>Choices</Label>
      <div className="space-y-2">
        {choices.map((choice, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded border text-xs font-medium text-muted-foreground">
              {String.fromCharCode(65 + i)}
            </span>
            <Input
              value={choice}
              onChange={(e) => updateChoice(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeChoice(i)}
              disabled={choices.length <= 1}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={addChoice}
        className="w-full"
      >
        <Plus className="mr-1.5 size-3.5" />
        Add choice
      </Button>
    </div>
  );
}
