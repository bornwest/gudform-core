// ---------------------------------------------------------------------------
// Shared types for the GudForm SDK
// ---------------------------------------------------------------------------

export interface GudFormConfig {
  apiKey: string;
  baseUrl?: string;
}

// Forms
export interface Form {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  themeColor: string;
  backgroundColor: string;
  themeMode: "LIGHT" | "DARK" | "SYSTEM";
  showProgressBar: boolean;
  redirectUrl: string | null;
  notifyOnResponse: boolean;
  paymentEnabled: boolean;
  paymentAmount: number | null;
  paymentCurrency: string;
  collectionId: string | null;
  collection: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  _count: { questions: number; responses: number };
}

export interface CreateFormInput {
  title?: string;
  description?: string;
  collectionId?: string;
  questions?: QuestionInput[];
}

export interface QuestionInput {
  id?: string;
  type: string;
  title: string;
  description?: string;
  required?: boolean;
  properties?: Record<string, unknown>;
}

export interface Question {
  id: string;
  formId: string;
  order: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  properties: Record<string, unknown>;
}

export interface UpdateFormInput {
  title?: string;
  description?: string;
  status?: "DRAFT" | "PUBLISHED" | "CLOSED";
  themeColor?: string;
  backgroundColor?: string;
  themeMode?: "LIGHT" | "DARK" | "SYSTEM";
  showProgressBar?: boolean;
  redirectUrl?: string | null;
  notifyOnResponse?: boolean;
  webhookUrl?: string;
  collectionId?: string;
}

export interface ListFormsParams {
  collectionId?: string;
  page?: number;
  limit?: number;
}

export interface ListFormsResponse {
  forms: Form[];
  total: number;
  page: number;
  limit: number;
}

// Responses
export interface FormResponse {
  id: string;
  formId: string;
  completedAt: string | null;
  createdAt: string;
  answers: Array<{
    questionId: string;
    value: string;
    question: {
      title: string;
      type: string;
    };
  }>;
  metadata: Record<string, unknown> | null;
}

export interface ListResponsesParams {
  page?: number;
  limit?: number;
}

export interface ListResponsesResponse {
  responses: FormResponse[];
  total: number;
  page: number;
  limit: number;
}

// Collections
export interface Collection {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { forms: number; teams: number };
}

export interface CreateCollectionInput {
  name: string;
}

export interface UpdateCollectionInput {
  name: string;
}

export interface ListCollectionsResponse {
  collections: Collection[];
}

// Errors
export class GudFormError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "UNKNOWN") {
    super(message);
    this.name = "GudFormError";
    this.status = status;
    this.code = code;
  }
}
