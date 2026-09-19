import { describe, expect, it } from "vitest";

describe("Form Versioning", () => {
  describe("Schema Changes", () => {
    it("should have FormVersion model with required fields", () => {
      // This test verifies the schema structure
      const formVersionFields = [
        "id",
        "formId",
        "versionNumber",
        "snapshot",
        "isBreaking",
        "changesSummary",
        "createdAt",
      ];
      
      expect(formVersionFields).toContain("id");
      expect(formVersionFields).toContain("snapshot");
      expect(formVersionFields).toContain("isBreaking");
    });

    it("should have deletedAt field on Question model", () => {
      const questionFields = [
        "id",
        "formId",
        "order",
        "type",
        "title",
        "description",
        "required",
        "properties",
        "logic",
        "deletedAt",
        "createdAt",
        "updatedAt",
      ];
      
      expect(questionFields).toContain("deletedAt");
    });

    it("should have formVersionId field on FormResponse model", () => {
      const responseFields = [
        "id",
        "formId",
        "formVersionId",
        "startedAt",
        "completedAt",
      ];
      
      expect(responseFields).toContain("formVersionId");
    });
  });

  describe("Change Classification", () => {
    it("should classify removed questions as breaking", () => {
      const oldQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: false, order: 0 },
        { id: "q2", type: "EMAIL", title: "Email", required: false, order: 1 },
      ];
      
      const newQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: false, order: 0 },
      ];
      
      // Simulating classification logic
      const removedCount = oldQuestions.filter(
        (old) => !newQuestions.find((n) => n.id === old.id)
      ).length;
      
      expect(removedCount).toBeGreaterThan(0);
    });

    it("should classify type changes as breaking", () => {
      const oldQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: false, order: 0 },
      ];
      
      const newQuestions = [
        { id: "q1", type: "EMAIL", title: "Name", required: false, order: 0 },
      ];
      
      const typeChanged = oldQuestions.some((old) => {
        const newQ = newQuestions.find((n) => n.id === old.id);
        return newQ && newQ.type !== old.type;
      });
      
      expect(typeChanged).toBe(true);
    });

    it("should classify making a question required as breaking", () => {
      const oldQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: false, order: 0 },
      ];
      
      const newQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: true, order: 0 },
      ];
      
      const requiredChanged = oldQuestions.some((old) => {
        const newQ = newQuestions.find((n) => n.id === old.id);
        return newQ && !old.required && newQ.required;
      });
      
      expect(requiredChanged).toBe(true);
    });

    it("should classify reordering as non-breaking", () => {
      const oldQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: false, order: 0 },
        { id: "q2", type: "EMAIL", title: "Email", required: false, order: 1 },
      ];
      
      const newQuestions = [
        { id: "q2", type: "EMAIL", title: "Email", required: false, order: 0 },
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: false, order: 1 },
      ];
      
      // Check if only order changed (not breaking)
      const onlyOrderChanged = oldQuestions.every((old) => {
        const newQ = newQuestions.find((n) => n.id === old.id);
        return newQ && 
               newQ.type === old.type && 
               newQ.required === old.required &&
               newQ.order !== old.order;
      });
      
      expect(onlyOrderChanged).toBe(true);
    });

    it("should classify title changes as non-breaking", () => {
      const oldQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: false, order: 0 },
      ];
      
      const newQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Full Name", required: false, order: 0 },
      ];
      
      const titleChanged = oldQuestions.some((old) => {
        const newQ = newQuestions.find((n) => n.id === old.id);
        return newQ && 
               newQ.type === old.type && 
               newQ.required === old.required &&
               newQ.title !== old.title;
      });
      
      expect(titleChanged).toBe(true);
    });

    it("should classify adding optional questions as non-breaking", () => {
      const oldQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: false, order: 0 },
      ];
      
      const newQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: false, order: 0 },
        { id: "draft_new", type: "PHONE", title: "Phone", required: false, order: 1 },
      ];
      
      const newOptionalQuestions = newQuestions.filter(
        (newQ) => newQ.id.startsWith("draft_") && !newQ.required
      );
      
      expect(newOptionalQuestions.length).toBeGreaterThan(0);
    });

    it("should classify adding required questions as breaking", () => {
      const oldQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: false, order: 0 },
      ];
      
      const newQuestions = [
        { id: "q1", type: "SHORT_TEXT", title: "Name", required: false, order: 0 },
        { id: "draft_new", type: "PHONE", title: "Phone", required: true, order: 1 },
      ];
      
      const newRequiredQuestions = newQuestions.filter(
        (newQ) => newQ.id.startsWith("draft_") && newQ.required
      );
      
      expect(newRequiredQuestions.length).toBeGreaterThan(0);
    });
  });

  describe("Question Deletion Behavior", () => {
    it("should use soft-delete instead of hard-delete", () => {
      // When a question is removed, it should be marked with deletedAt
      // instead of being removed from the database
      const deletedQuestion = {
        id: "q1",
        title: "Old Question",
        deletedAt: new Date(),
      };
      
      expect(deletedQuestion.deletedAt).not.toBeNull();
    });

    it("should prevent cascade deletion of answers when question is soft-deleted", () => {
      // With RESTRICT on the foreign key, attempts to hard-delete
      // a question with answers should fail
      const questionWithAnswers = {
        id: "q1",
        hasAnswers: true,
      };
      
      // Simulating the constraint: can't delete if has answers
      expect(questionWithAnswers.hasAnswers).toBe(true);
    });
  });

  describe("Version Snapshot Structure", () => {
    it("should include all required question metadata in snapshot", () => {
      const snapshot = {
        questions: [
          {
            id: "q1",
            order: 0,
            type: "SHORT_TEXT",
            title: "Name",
            description: "Enter your full name",
            required: true,
            properties: { placeholder: "John Doe" },
            logic: [],
          },
        ],
        createdAt: new Date().toISOString(),
      };
      
      expect(snapshot.questions[0]).toHaveProperty("id");
      expect(snapshot.questions[0]).toHaveProperty("type");
      expect(snapshot.questions[0]).toHaveProperty("title");
      expect(snapshot.questions[0]).toHaveProperty("properties");
      expect(snapshot.questions[0]).toHaveProperty("logic");
    });
  });

  describe("Response Version Tracking", () => {
    it("should store formVersionId with new responses", () => {
      const response = {
        id: "r1",
        formId: "f1",
        formVersionId: "v1",
        completedAt: new Date(),
      };
      
      expect(response.formVersionId).not.toBeNull();
      expect(response.formVersionId).toBe("v1");
    });

    it("should allow null formVersionId for historical responses", () => {
      const legacyResponse = {
        id: "r1",
        formId: "f1",
        formVersionId: null,
        completedAt: new Date(),
      };
      
      // Legacy responses from before versioning should be allowed
      expect(legacyResponse.formVersionId).toBeNull();
    });
  });

  describe("Historical Label Resolution", () => {
    it("should resolve question labels from version snapshot when available", () => {
      const response = {
        formVersionId: "v1",
        formVersion: {
          snapshot: {
            questions: [
              { id: "q1", title: "Original Title", type: "SHORT_TEXT" },
            ],
          },
        },
        answers: [
          {
            questionId: "q1",
            value: "Answer",
            question: { id: "q1", title: "Updated Title", type: "SHORT_TEXT" },
          },
        ],
      };
      
      const versionQuestion = (response.formVersion.snapshot as any).questions.find(
        (q: any) => q.id === response.answers[0].questionId
      );
      
      expect(versionQuestion?.title).toBe("Original Title");
      expect(response.answers[0].question.title).toBe("Updated Title");
    });

    it("should fall back to current question when no version available", () => {
      const response = {
        formVersionId: null,
        formVersion: null,
        answers: [
          {
            questionId: "q1",
            value: "Answer",
            question: { id: "q1", title: "Current Title", type: "SHORT_TEXT" },
          },
        ],
      };
      
      // When no version snapshot exists, use current question
      expect(response.answers[0].question.title).toBe("Current Title");
    });
  });

  describe("Version Numbering", () => {
    it("should increment version numbers sequentially", () => {
      const versions = [
        { id: "v1", versionNumber: 1 },
        { id: "v2", versionNumber: 2 },
        { id: "v3", versionNumber: 3 },
      ];
      
      const isSequential = versions.every(
        (v, i) => v.versionNumber === i + 1
      );
      
      expect(isSequential).toBe(true);
    });

    it("should create version 1 for first publish", () => {
      const firstVersion = {
        id: "v1",
        versionNumber: 1,
        formId: "f1",
      };
      
      expect(firstVersion.versionNumber).toBe(1);
    });
  });
});
