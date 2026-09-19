"use client";

import { AlignCenter, AlignLeft, Type } from "lucide-react";

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
  ScreenTitleSize,
} from "@/lib/screen-format";
import { getScreenFormat } from "@/lib/screen-format";

import type { Question, QuestionProperties } from "./types";

export function ScreenFormatEditor({
  question,
  onUpdate,
}: {
  question: Question;
  onUpdate: (props: Partial<QuestionProperties>) => void;
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
