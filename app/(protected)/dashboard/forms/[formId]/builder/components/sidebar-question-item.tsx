"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { QUESTION_TYPE_META, SCREEN_TYPES } from "./constants";
import type { Question } from "./types";

export function SidebarQuestionItem({
  question,
  index,
  isSelected,
  isFirst,
  isLast,
  totalCount,
  onClick,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  canMoveUp = true,
  canMoveDown = true,
  canDuplicate = true,
  canDelete = true,
}: {
  question: Question;
  index: number;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  totalCount: number;
  onClick: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  canDuplicate?: boolean;
  canDelete?: boolean;
}) {
  const meta = QUESTION_TYPE_META[question.type];
  const Icon = meta.icon;
  const isScreen = SCREEN_TYPES.includes(question.type);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative flex cursor-pointer gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-transparent hover:border-border hover:bg-muted/50"
      }`}
    >
      <div className="mt-0.5 flex shrink-0 items-start text-muted-foreground">
        <GripVertical className="mr-1 size-3.5 opacity-40" />
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words font-medium leading-tight">
          {!isScreen && (
            <span className="mr-1 text-muted-foreground">{index}.</span>
          )}
          {question.title || meta.label}
        </p>
        <p className="truncate text-xs text-muted-foreground">{meta.label}</p>

        {/* Action buttons inline below text on hover */}
        <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {!isFirst && canMoveUp && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              title="Move up"
            >
              <ArrowUp className="size-3" />
            </Button>
          )}
          {!isLast && canMoveDown && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              title="Move down"
            >
              <ArrowDown className="size-3" />
            </Button>
          )}
          {canDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              title="Duplicate"
            >
              <Copy className="size-3" />
            </Button>
          )}
          {totalCount > 1 && canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
