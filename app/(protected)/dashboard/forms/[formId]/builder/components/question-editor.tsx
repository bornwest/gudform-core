"use client";

import { Star } from "lucide-react";
import { QuestionType } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Question, QuestionProperties } from "./types";
import {
  QUESTION_TYPE_META,
  QUESTION_TYPE_GROUPS,
  SCREEN_TYPES,
  getDefaultProperties,
} from "./constants";
import { ChoiceEditor } from "./choice-editor";
import { ValidationEditor } from "./validation-editor";
import { LogicEditor } from "./logic-editor";

export function QuestionEditor({
  question,
  questionIndex,
  allQuestions,
  onUpdate,
}: {
  question: Question;
  questionIndex: number;
  allQuestions: Question[];
  onUpdate: (updates: Partial<Question>) => void;
}) {
  const meta = QUESTION_TYPE_META[question.type];
  const Icon = meta.icon;
  const isScreen = SCREEN_TYPES.includes(question.type);

  const updateProperties = (propUpdates: Partial<QuestionProperties>) => {
    onUpdate({
      properties: { ...question.properties, ...propUpdates },
    });
  };

  const showRequired = !isScreen;
  const showPlaceholder = (
    [
      QuestionType.SHORT_TEXT,
      QuestionType.LONG_TEXT,
      QuestionType.EMAIL,
      QuestionType.PHONE,
      QuestionType.NUMBER,
    ] as QuestionType[]
  ).includes(question.type);
  const showChoices = (
    [QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN] as QuestionType[]
  ).includes(question.type);
  const showRating = question.type === QuestionType.RATING;
  const showScale = question.type === QuestionType.SCALE;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {!isScreen ? `Question ${questionIndex}` : meta.label}
          </h2>
          <p className="text-sm text-muted-foreground">{meta.label}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="question-title">Title</Label>
          <Input
            id="question-title"
            value={question.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Enter your question..."
            className="text-base"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="question-description">
            Description{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Textarea
            id="question-description"
            value={question.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Add a description or instructions..."
            rows={3}
          />
        </div>

        {/* Question type selector */}
        <div className="space-y-2">
          <Label>Question Type</Label>
          <Select
            value={question.type}
            onValueChange={(value: QuestionType) => {
              onUpdate({
                type: value,
                properties: getDefaultProperties(value),
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPE_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {group.label}
                  </div>
                  {group.types.map((type) => {
                    const m = QUESTION_TYPE_META[type];
                    const TypeIcon = m.icon;
                    return (
                      <SelectItem key={type} value={type}>
                        <span className="flex items-center gap-2">
                          <TypeIcon className="size-4 text-muted-foreground" />
                          {m.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Required toggle */}
        {showRequired && (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="required-toggle" className="cursor-pointer">
                Required
              </Label>
              <p className="text-sm text-muted-foreground">
                Respondent must answer this question
              </p>
            </div>
            <Switch
              id="required-toggle"
              checked={question.required || false}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
          </div>
        )}

        {/* Placeholder */}
        {showPlaceholder && (
          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder text</Label>
            <Input
              id="placeholder"
              value={question.properties.placeholder || ""}
              onChange={(e) =>
                updateProperties({ placeholder: e.target.value })
              }
              placeholder="e.g. Type your answer here..."
            />
          </div>
        )}

        {/* Choices (Multiple Choice / Dropdown) */}
        {showChoices && (
          <ChoiceEditor
            choices={question.properties.choices || ["Option 1", "Option 2"]}
            onChange={(choices) => updateProperties({ choices })}
          />
        )}

        {/* Rating */}
        {showRating && (
          <div className="space-y-2">
            <Label htmlFor="max-rating">Maximum Rating</Label>
            <Select
              value={String(question.properties.maxRating || 5)}
              onValueChange={(value) =>
                updateProperties({ maxRating: parseInt(value, 10) })
              }
            >
              <SelectTrigger id="max-rating">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} star{n !== 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3 flex items-center gap-1">
              {Array.from(
                { length: question.properties.maxRating || 5 },
                (_, i) => (
                  <Star
                    key={i}
                    className="size-6 fill-yellow-400 text-yellow-400"
                  />
                ),
              )}
            </div>
          </div>
        )}

        {/* Scale */}
        {showScale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-value">Min value</Label>
                <Input
                  id="min-value"
                  type="number"
                  value={question.properties.minValue ?? 1}
                  onChange={(e) =>
                    updateProperties({
                      minValue: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-value">Max value</Label>
                <Input
                  id="max-value"
                  type="number"
                  value={question.properties.maxValue ?? 10}
                  onChange={(e) =>
                    updateProperties({
                      maxValue: parseInt(e.target.value, 10) || 10,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-label">Min label</Label>
                <Input
                  id="min-label"
                  value={question.properties.minLabel || ""}
                  onChange={(e) =>
                    updateProperties({ minLabel: e.target.value })
                  }
                  placeholder="e.g. Not likely"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-label">Max label</Label>
                <Input
                  id="max-label"
                  value={question.properties.maxLabel || ""}
                  onChange={(e) =>
                    updateProperties({ maxLabel: e.target.value })
                  }
                  placeholder="e.g. Very likely"
                />
              </div>
            </div>
            {/* Scale preview */}
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Preview
              </p>
              <div className="flex items-end justify-between gap-1">
                <span className="text-xs text-muted-foreground">
                  {question.properties.minLabel || "Min"}
                </span>
                <div className="flex gap-1">
                  {Array.from(
                    {
                      length:
                        (question.properties.maxValue ?? 10) -
                        (question.properties.minValue ?? 1) +
                        1,
                    },
                    (_, i) => (
                      <div
                        key={i}
                        className="flex size-8 items-center justify-center rounded border text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        {(question.properties.minValue ?? 1) + i}
                      </div>
                    ),
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {question.properties.maxLabel || "Max"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Validation rules (EMAIL, PHONE, NUMBER only) */}
        {!isScreen &&
          (
            [
              QuestionType.EMAIL,
              QuestionType.PHONE,
              QuestionType.NUMBER,
            ] as QuestionType[]
          ).includes(question.type) && (
            <>
              <Separator />
              <ValidationEditor
                question={question}
                onUpdate={updateProperties}
              />
            </>
          )}

        {/* Logic rules (hidden for screen types) */}
        {!isScreen && (
          <>
            <Separator />
            <LogicEditor
              question={question}
              allQuestions={allQuestions}
              onChange={(logic) => onUpdate({ logic })}
              onPropertiesUpdate={(props) =>
                onUpdate({ properties: { ...question.properties, ...props } })
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
