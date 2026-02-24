import type {
  Collection,
  CreateCollectionInput,
  CreateFormInput,
  Form,
  GudFormConfig,
  ListCollectionsResponse,
  ListFormsParams,
  ListFormsResponse,
  ListResponsesParams,
  ListResponsesResponse,
  UpdateCollectionInput,
  UpdateFormInput,
} from "./types";
import { GudFormError } from "./types";

const DEFAULT_BASE_URL = "https://gudform.com/api/v1";

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function request<T>(
  baseUrl: string,
  apiKey: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new GudFormError(
      data.error || `Request failed with status ${res.status}`,
      res.status,
      data.code,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Resource classes
// ---------------------------------------------------------------------------

class FormsResource {
  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {}

  async list(params?: ListFormsParams): Promise<ListFormsResponse> {
    const query = new URLSearchParams();
    if (params?.collectionId) query.set("collectionId", params.collectionId);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return request(
      this.baseUrl,
      this.apiKey,
      "GET",
      `/forms${qs ? `?${qs}` : ""}`,
    );
  }

  async get(formId: string): Promise<{ form: Form }> {
    return request(this.baseUrl, this.apiKey, "GET", `/forms/${formId}`);
  }

  async create(input?: CreateFormInput): Promise<{ form: Form }> {
    return request(this.baseUrl, this.apiKey, "POST", "/forms", input);
  }

  async update(
    formId: string,
    input: UpdateFormInput,
  ): Promise<{ form: Form }> {
    return request(
      this.baseUrl,
      this.apiKey,
      "PATCH",
      `/forms/${formId}`,
      input,
    );
  }

  async delete(formId: string): Promise<void> {
    return request(this.baseUrl, this.apiKey, "DELETE", `/forms/${formId}`);
  }

  async responses(
    formId: string,
    params?: ListResponsesParams,
  ): Promise<ListResponsesResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return request(
      this.baseUrl,
      this.apiKey,
      "GET",
      `/forms/${formId}/responses${qs ? `?${qs}` : ""}`,
    );
  }
}

class CollectionsResource {
  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {}

  async list(): Promise<ListCollectionsResponse> {
    return request(this.baseUrl, this.apiKey, "GET", "/collections");
  }

  async get(collectionId: string): Promise<{ collection: Collection }> {
    return request(
      this.baseUrl,
      this.apiKey,
      "GET",
      `/collections/${collectionId}`,
    );
  }

  async create(
    input: CreateCollectionInput,
  ): Promise<{ collection: Collection }> {
    return request(this.baseUrl, this.apiKey, "POST", "/collections", input);
  }

  async update(
    collectionId: string,
    input: UpdateCollectionInput,
  ): Promise<{ collection: Collection }> {
    return request(
      this.baseUrl,
      this.apiKey,
      "PATCH",
      `/collections/${collectionId}`,
      input,
    );
  }

  async delete(collectionId: string): Promise<void> {
    return request(
      this.baseUrl,
      this.apiKey,
      "DELETE",
      `/collections/${collectionId}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Main client
// ---------------------------------------------------------------------------

export class GudForm {
  public readonly forms: FormsResource;
  public readonly collections: CollectionsResource;

  constructor(config: GudFormConfig) {
    if (!config.apiKey) {
      throw new Error("GudForm: apiKey is required");
    }
    const baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.forms = new FormsResource(baseUrl, config.apiKey);
    this.collections = new CollectionsResource(baseUrl, config.apiKey);
  }
}
