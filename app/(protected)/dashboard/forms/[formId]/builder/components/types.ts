import { FormStatus, QuestionType } from "@prisma/client";
import type { LogicRule } from "@/lib/types/logic";

export interface QuestionProperties {
  placeholder?: string;
  choices?: string[];
  allowMultiple?: boolean;
  minSelections?: number;
  maxSelections?: number;
  allowOther?: boolean;
  ranking?: boolean;
  pictureChoice?: boolean;
  choiceImages?: (string | null)[];
  capture?: string;
  maxRating?: number;
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  format?: string;
  buttonText?: string;
  align?: "left" | "center";
  titleSize?: "sm" | "md" | "lg" | "xl";
  titleColor?: string;
  titleBold?: boolean;
  descriptionSize?: "sm" | "md" | "lg";
  descriptionColor?: string;
  descriptionBold?: boolean;
  maxFileSize?: number;
  maxFileSizeMB?: number;
  [key: string]: any;
}

export interface Question {
  id?: string;
  type: QuestionType;
  title: string;
  description?: string;
  required?: boolean;
  properties: QuestionProperties;
  logic: LogicRule[];
}

export interface FormData {
  id: string;
  title: string;
  description: string | null;
  status: FormStatus;
  slug: string;
  questions: Array<{
    id: string;
    type: QuestionType;
    title: string;
    description: string | null;
    required: boolean;
    properties: any;
    order: number;
  }>;
  _count: { responses: number };
}
