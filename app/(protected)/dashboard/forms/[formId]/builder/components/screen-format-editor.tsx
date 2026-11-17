"use client";

import { useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  ImageIcon,
  PanelLeft,
  PanelRight,
  Type,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ScreenAlign,
  ScreenDescriptionSize,
  ScreenImagePosition,
  ScreenTitleSize,
} from "@/lib/screen-format";
import { getScreenFormat } from "@/lib/screen-format";
import { uploadFile } from "@/lib/upload-client";

import type { Question, QuestionProperties } from "./types";

export function ScreenFormatEditor({
  question,
  onUpdate,
  formId,
}: {
  question: Question;
  onUpdate: (props: Partial<QuestionProperties>) => void;
  formId?: string;
}) {
  const format = getScreenFormat(question.type, question.properties);
  const buttonText = (question.properties.buttonText as string | undefined) || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Type className="size-4 text-muted-foreground" />
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Screen formatting
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Blank lines become paragraphs. Wrap words in **double asterisks** for
        bold, or *single asterisks* for italics.
      </p>

      {question.type === "WELCOME_SCREEN" && (
        <ScreenImageField
          question={question}
          onUpdate={onUpdate}
          formId={formId}
        />
      )}

      <div className="space-y-2">
        <Label>Alignment</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={format.align}
          onValueChange={(value) => {
            if (value) onUpdate({ align: value as ScreenAlign });
          }}
          className="justify-start"
        >
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeft className="mr-1.5 size-4" />
            Left
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter className="mr-1.5 size-4" />
            Center
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Title size</Label>
          <Select
            value={format.titleSize}
            onValueChange={(value) =>
              onUpdate({ titleSize: value as ScreenTitleSize })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
              <SelectItem value="xl">Extra large</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Body size</Label>
          <Select
            value={format.descriptionSize}
            onValueChange={(value) =>
              onUpdate({ descriptionSize: value as ScreenDescriptionSize })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label htmlFor="title-bold" className="cursor-pointer">
            Bold title
          </Label>
          <p className="text-sm text-muted-foreground">
            Make the heading stand out
          </p>
        </div>
        <Switch
          id="title-bold"
          checked={format.titleBold}
          onCheckedChange={(checked) => onUpdate({ titleBold: checked })}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label htmlFor="body-bold" className="cursor-pointer">
            Bold body
          </Label>
          <p className="text-sm text-muted-foreground">
            Use a heavier weight for the description
          </p>
        </div>
        <Switch
          id="body-bold"
          checked={format.descriptionBold}
          onCheckedChange={(checked) => onUpdate({ descriptionBold: checked })}
        />
      </div>

      <ColorField
        label="Title color"
        value={format.titleColor}
        onChange={(titleColor) => onUpdate({ titleColor: titleColor ?? "" })}
      />
      <ColorField
        label="Body color"
        value={format.descriptionColor}
        onChange={(descriptionColor) =>
          onUpdate({ descriptionColor: descriptionColor ?? "" })
        }
      />

      {question.type !== "THANK_YOU_SCREEN" && (
        <div className="space-y-2">
          <Label htmlFor="button-text">Button label</Label>
          <Input
            id="button-text"
            value={buttonText}
            onChange={(e) => onUpdate({ buttonText: e.target.value })}
            placeholder={
              question.type === "WELCOME_SCREEN" ? "Start" : "Continue"
            }
          />
        </div>
      )}
    </div>
  );
}

function ScreenImageField({
  question,
  onUpdate,
  formId,
}: {
  question: Question;
  onUpdate: (props: Partial<QuestionProperties>) => void;
  formId?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const image = (question.properties.image as string | undefined) || "";
  const position: ScreenImagePosition =
    question.properties.imagePosition === "right" ? "right" : "left";

  const upload = async (file: File) => {
    if (!formId) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadFile(file, formId);
      onUpdate({ image: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ImageIcon className="size-4 text-muted-foreground" />
        <Label>Image (optional)</Label>
      </div>
      <div className="flex items-center gap-2">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="size-12 shrink-0 rounded border object-cover"
          />
        ) : (
          <div className="size-12 shrink-0 rounded border bg-muted" />
        )}
        <Input
          value={image}
          onChange={(e) => onUpdate({ image: e.target.value })}
          placeholder="Image URL"
          className="h-8 flex-1 text-xs"
        />
        {formId && (
          <label
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border text-muted-foreground hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50"
            aria-label="Upload image"
            aria-disabled={uploading}
          >
            <Upload className="size-3.5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {image && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onUpdate({ image: "" })}
            aria-label="Remove image"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
      {uploading && (
        <p className="text-xs text-muted-foreground">Uploading…</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {image && (
        <ToggleGroup
          type="single"
          variant="outline"
          value={position}
          onValueChange={(value) => {
            if (value) onUpdate({ imagePosition: value as ScreenImagePosition });
          }}
          className="justify-start"
        >
          <ToggleGroupItem value="left" aria-label="Image on left">
            <PanelLeft className="mr-1.5 size-4" />
            Image left
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Image on right">
            <PanelRight className="mr-1.5 size-4" />
            Image right
          </ToggleGroupItem>
        </ToggleGroup>
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  const color = value || "#111827";
  const custom = Boolean(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Switch
          checked={custom}
          onCheckedChange={(checked) =>
            onChange(checked ? color : undefined)
          }
        />
      </div>
      {custom && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="size-8 cursor-pointer rounded border-0"
            aria-label={label}
          />
          <Input
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
      )}
      {!custom && (
        <p className="text-xs text-muted-foreground">
          Uses the form text color
        </p>
      )}
    </div>
  );
}
