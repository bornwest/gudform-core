"use client";

import { Plus, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChoiceEditor({
  choices,
  onChange,
  pictureChoice,
  choiceImages,
  onImagesChange,
  formId,
}: {
  choices: string[];
  onChange: (choices: string[]) => void;
  pictureChoice?: boolean;
  choiceImages?: (string | null)[];
  onImagesChange?: (images: (string | null)[]) => void;
  formId?: string;
}) {
  const images = choiceImages ?? choices.map(() => "");

  const syncImages = (nextChoices: string[], nextImages: (string | null)[]) => {
    onChange(nextChoices);
    onImagesChange?.(nextImages.slice(0, nextChoices.length));
  };

  const addChoice = () => {
    syncImages(
      [...choices, `Option ${choices.length + 1}`],
      [...images, ""],
    );
  };

  const removeChoice = (index: number) => {
    if (choices.length <= 1) return;
    syncImages(
      choices.filter((_, i) => i !== index),
      images.filter((_, i) => i !== index),
    );
  };

  const updateChoice = (index: number, value: string) => {
    const next = [...choices];
    next[index] = value;
    onChange(next);
  };

  const updateImage = (index: number, value: string) => {
    const next = [...images];
    next[index] = value;
    onImagesChange?.(next);
  };

  const uploadImage = async (index: number, file: File) => {
    if (!formId || !onImagesChange) return;
    const body = new FormData();
    body.append("file", file);
    body.append("formId", formId);
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json();
    if (res.ok && typeof data.url === "string") {
      updateImage(index, data.url);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Choices</Label>
      <div className="space-y-2">
        {choices.map((choice, i) => (
          <div key={`choice-${i}`} className="space-y-2">
            <div className="flex items-center gap-2">
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
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeChoice(i)}
                disabled={choices.length <= 1}
              >
                <X className="size-4" />
              </Button>
            </div>
            {pictureChoice && (
              <div className="ml-8 flex items-center gap-2">
                {images[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={images[i] || ""}
                    alt=""
                    className="size-12 rounded border object-cover"
                  />
                ) : (
                  <div className="size-12 rounded border bg-muted" />
                )}
                <Input
                  value={images[i] || ""}
                  onChange={(e) => updateImage(i, e.target.value)}
                  placeholder="Image URL"
                  className="h-8 flex-1 text-xs"
                />
                {formId && (
                  <label className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md border text-muted-foreground hover:bg-muted">
                    <Upload className="size-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(i, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <Button
        type="button"
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
