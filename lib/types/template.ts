export interface TemplateFormData {
  title: string;
  description: string | null;
  themeColor: string;
  backgroundColor: string;
  themeMode: "LIGHT" | "DARK" | "SYSTEM";
  showProgressBar: boolean;
  questions: TemplateQuestion[];
}

export interface TemplateQuestion {
  type: string; // QuestionType
  title: string;
  description: string | null;
  required: boolean;
  properties: Record<string, any>;
  logic: any[];
}
