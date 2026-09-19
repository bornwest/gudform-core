import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SAAS_MODELS,
  assertCoreSchema,
  stripSaasSchema,
} from "../scripts/strip-saas-schema.mjs";

describe("strip SaaS Prisma schema", () => {
  it("removes billing, Connect, developer, and marketplace models", () => {
    const source = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const stripped = stripSaasSchema(source);
    expect(() => assertCoreSchema(stripped)).not.toThrow();
    for (const name of SAAS_MODELS) {
      expect(stripped).not.toMatch(new RegExp(`model\\s+${name}\\s*\\{`));
    }
    expect(stripped).toMatch(/model\s+User\s*\{/);
    expect(stripped).toMatch(/model\s+TeamInvite\s*\{/);
    expect(stripped).toMatch(/model\s+FormTemplate\s*\{/);
    expect(stripped).not.toMatch(/subscription\s+Subscription\?/);
    expect(stripped).toMatch(/enum\s+SubscriptionPlan\s*\{/);
  });
});
