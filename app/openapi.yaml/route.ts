import { siteConfig } from "@/config/site";

export async function GET() {
  const base = siteConfig.url.replace(/\/+$/, "");
  const yaml = `openapi: 3.1.0
info:
  title: GudForm API
  version: 1.2.0
  description: REST API for forms, questions, and responses. Authenticate with an API key.
servers:
  - url: ${base}/api/v1
security:
  - bearerAuth: []
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: API key
      description: Keys start with ff_
  schemas:
    Question:
      type: object
      required: [type]
      properties:
        id:
          type: string
        type:
          type: string
          enum: [WELCOME_SCREEN, SHORT_TEXT, LONG_TEXT, MULTIPLE_CHOICE, DROPDOWN, EMAIL, NUMBER, PHONE, DATE, RATING, SCALE, YES_NO, FILE_UPLOAD, STATEMENT, THANK_YOU_SCREEN]
        title:
          type: string
        description:
          type: string
        required:
          type: boolean
        properties:
          type: object
    Answer:
      type: object
      required: [questionId, value]
      properties:
        questionId:
          type: string
        value:
          type: string
paths:
  /forms:
    get:
      summary: List forms
      parameters:
        - in: query
          name: collectionId
          schema: { type: string }
      responses:
        "200":
          description: Form list
    post:
      summary: Create a form
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                title: { type: string }
                description: { type: string }
                collectionId: { type: string }
                questions:
                  type: array
                  items: { $ref: "#/components/schemas/Question" }
      responses:
        "201":
          description: Created
  /forms/{formId}:
    get:
      summary: Get a form and its questions
      parameters:
        - in: path
          name: formId
          required: true
          schema: { type: string }
      responses:
        "200":
          description: Form
    patch:
      summary: Update a form
      parameters:
        - in: path
          name: formId
          required: true
          schema: { type: string }
      responses:
        "200":
          description: Updated
    delete:
      summary: Delete a form
      parameters:
        - in: path
          name: formId
          required: true
          schema: { type: string }
      responses:
        "200":
          description: Deleted
  /forms/{formId}/questions:
    put:
      summary: Replace questions on a form
      parameters:
        - in: path
          name: formId
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [questions]
              properties:
                questions:
                  type: array
                  items: { $ref: "#/components/schemas/Question" }
      responses:
        "200":
          description: Questions
  /forms/{formId}/responses:
    get:
      summary: List responses
      parameters:
        - in: path
          name: formId
          required: true
          schema: { type: string }
      responses:
        "200":
          description: Responses
    post:
      summary: Submit a response
      parameters:
        - in: path
          name: formId
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [answers]
              properties:
                answers:
                  type: array
                  items: { $ref: "#/components/schemas/Answer" }
      responses:
        "201":
          description: Submitted
`;

  return new Response(yaml, {
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
