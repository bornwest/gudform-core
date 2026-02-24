## 2026-02-21 22:00:00

### 1. Fix template SCALE question label properties

**Change Type**: fix

> **Purpose**: Ensure scale endpoint labels render correctly on forms created from templates
> **Detailed Description**: Three templates (Customer Satisfaction Survey, Net Promoter Score, Market Research Survey) defined SCALE question labels using `labels: { start, end }` nested object format, but the form renderer and question editor expect flat `minLabel` / `maxLabel` properties. Changed all three to use the correct flat property format.
> **Reason for Change**: Scale labels were silently ignored when creating forms from these templates, resulting in scales without endpoint labels
> **Impact Scope**: config/default-templates.ts; affects forms created from these 3 templates after re-seeding
> **API Changes**: None
> **Configuration Changes**: Templates must be re-seeded with `npx tsx prisma/seed-templates.ts`
> **Performance Impact**: None

   ```
   root
   - config
    - default-templates.ts // refact: Fixed SCALE label properties in 3 templates
   ```

### 2. Fix template NUMBER question validation properties

**Change Type**: fix

> **Purpose**: Ensure min/max validation is enforced on NUMBER questions in templates
> **Detailed Description**: Four templates (Product Order Form, Wedding RSVP, Restaurant Reservation, Donation Form) defined `min`/`max` directly on `properties`, but the form renderer validation checks `properties.validation.min` / `properties.validation.max`. Moved the min/max values into the correct `validation` sub-object.
> **Reason for Change**: Number range constraints were not being enforced during form submission, allowing any numeric value
> **Impact Scope**: config/default-templates.ts; affects forms created from these 4 templates after re-seeding
> **API Changes**: None
> **Configuration Changes**: Templates must be re-seeded with `npx tsx prisma/seed-templates.ts`
> **Performance Impact**: None

   ```
   root
   - config
    - default-templates.ts // refact: Fixed NUMBER validation properties in 4 templates
   ```
