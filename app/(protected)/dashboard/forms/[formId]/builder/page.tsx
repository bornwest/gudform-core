"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getFormById, saveQuestions, updateForm, publishDraftQuestions } from "@/actions/form-actions";
import { FormStatus, FormThemeMode, QuestionType } from "@prisma/client";
import {
  ArrowLeft,
  ChevronDown,
  DollarSign,
  Eye,
  Monitor,
  Moon,
  Palette,
  Plus,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { isOssEdition, OSS_PLAN_FEATURES } from "@/config/edition";
import { PLANS, SubscriptionPlan } from "@/config/subscriptions";
import {
  CURRENCIES,
  formatPaymentAmount,
  fromSmallestUnit,
  getCurrency,
  getMinDisplayAmount,
  toSmallestUnit,
} from "@/config/currencies";
import type { LogicRule } from "@/lib/types/logic";
import type { PaymentOption, PaymentSelectionMode } from "@/lib/types/payment";
import { contrastColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import type { Question, QuestionProperties } from "./components/types";
import {
  QUESTION_TYPE_GROUPS,
  SCREEN_TYPES,
  FORM_COMPONENTS,
  getThankYouScreenIndex,
  normalizeQuestionsThankYouLast,
  createQuestionFromPalette,
  type PaletteItem,
} from "./components/constants";
import { SidebarQuestionItem } from "./components/sidebar-question-item";
import { QuestionEditor } from "./components/question-editor";
import {
  ImportFormDialog,
  mergeImportedQuestions,
} from "@/components/forms/import-form-dialog";
