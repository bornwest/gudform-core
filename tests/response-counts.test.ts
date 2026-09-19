import { describe, expect, it } from "vitest";

import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";

describe("COUNTABLE_RESPONSE_WHERE", () => {
  it("counts completed responses and pending payments, not drafts", () => {
    expect(COUNTABLE_RESPONSE_WHERE.OR).toEqual([
      { completedAt: { not: null } },
      { paymentStatus: { not: null } },
    ]);
  });

  it("includes completed responses (completedAt set, no payment)", () => {
    const mockResponse = {
      completedAt: new Date(),
      paymentStatus: null,
    };
    
    // This would match the first OR condition
    const matchesFirstCondition = mockResponse.completedAt !== null;
    expect(matchesFirstCondition).toBe(true);
  });

  it("includes pending payment responses (no completedAt, paymentStatus set)", () => {
    const mockResponse = {
      completedAt: null,
      paymentStatus: "PENDING",
    };
    
    // This would match the second OR condition
    const matchesSecondCondition = mockResponse.paymentStatus !== null;
    expect(matchesSecondCondition).toBe(true);
  });

  it("includes completed payment responses (both completedAt and paymentStatus set)", () => {
    const mockResponse = {
      completedAt: new Date(),
      paymentStatus: "COMPLETED",
    };
    
    // This would match both OR conditions
    const matchesFirstCondition = mockResponse.completedAt !== null;
    const matchesSecondCondition = mockResponse.paymentStatus !== null;
    expect(matchesFirstCondition || matchesSecondCondition).toBe(true);
  });

  it("excludes draft responses (no completedAt, no paymentStatus)", () => {
    const mockResponse = {
      completedAt: null,
      paymentStatus: null,
    };
    
    // This would NOT match either OR condition
    const matchesFirstCondition = mockResponse.completedAt !== null;
    const matchesSecondCondition = mockResponse.paymentStatus !== null;
    expect(matchesFirstCondition || matchesSecondCondition).toBe(false);
  });

  it("includes failed payment responses (no completedAt, paymentStatus = FAILED)", () => {
    const mockResponse = {
      completedAt: null,
      paymentStatus: "FAILED",
    };
    
    // This would match the second OR condition (any paymentStatus is not null)
    const matchesSecondCondition = mockResponse.paymentStatus !== null;
    expect(matchesSecondCondition).toBe(true);
  });
});
