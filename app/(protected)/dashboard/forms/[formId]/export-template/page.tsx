"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFormById } from "@/actions/form-actions";
import { exportFormAsTemplate } from "@/actions/template-actions";
import { TemplateCategory } from "@prisma/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "SURVEY", label: "Survey" },
  { value: "FEEDBACK", label: "Feedback" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "APPLICATION", label: "Application" },
  { value: "ORDER", label: "Order" },
  { value: "QUIZ", label: "Quiz" },
  { value: "LEAD_GENERATION", label: "Lead Generation" },
  { value: "CONTACT", label: "Contact" },
  { value: "HR", label: "HR" },
  { value: "EDUCATION", label: "Education" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "OTHER", label: "Other" },
];

const EMOJI_OPTIONS = [
  "📝", "📋", "📊", "📈", "🎯", "💼", "🏢", "👥", "🎓", "🏥",
  "📞", "📧", "🗳️", "🎪", "🍽️", "🎭", "🏠", "💡", "🔧", "⭐",
];

export default function ExportTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(0);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [icon, setIcon] = useState("📝");
  const [category, setCategory] = useState<TemplateCategory>("OTHER");

  const loadForm = useCallback(async () => {
    try {
      const form = await getFormById(formId);
      if (!form) {
        toast.error("Form not found");
        router.push("/dashboard");
        return;
      }
      setFormTitle(form.title);
      setName(form.title);
      setDescription(form.description || "");
      setQuestionCount(form.questions.length);
    } catch {
      toast.error("Failed to load form");
    } finally {
      setLoading(false);
    }
  }, [formId, router]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    setSubmitting(true);
    try {
      await exportFormAsTemplate(formId, {
        name: name.trim(),
        description: description.trim(),
        longDescription: longDescription.trim() || undefined,
        icon,
        category,
      });
      toast.success("Template created! You can now submit it for review.");
      router.push("/dashboard/templates");
    } catch (err: any) {
      toast.error(err.message || "Failed to export template");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight">
        Export as Template
      </h1>
      <p className="mt-1 text-muted-foreground">
        Create a reusable template from &quot;{formTitle}&quot; ({questionCount}{" "}
        questions)
      </p>

      <Card className="mt-6 max-w-2xl p-6">
        <div className="space-y-5">
          {/* Icon */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`flex size-10 items-center justify-center rounded-lg border-2 text-xl transition-colors ${
                    icon === emoji
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-transparent hover:bg-muted"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Template Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Form Template"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Short Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of what this template is for..."
              rows={2}
            />
          </div>

          {/* Long Description */}
          <div className="space-y-2">
            <Label>Long Description (optional)</Label>
            <Textarea
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              placeholder="Detailed description about the template, its use cases, and what's included..."
              rows={4}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TemplateCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Preview</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-medium">{name || "Untitled Template"}</p>
                <p className="text-xs text-muted-foreground">
                  {description || "No description"} &middot; {questionCount}{" "}
                  questions &middot;{" "}
                  {category.toLowerCase().replace("_", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Create Template Draft
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
