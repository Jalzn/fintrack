CREATE TABLE "budget_scopes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"budget_id" varchar(36) NOT NULL,
	"category_id" varchar(36) NOT NULL,
	"subcategory_id" varchar(36)
);
--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "name" varchar(80);--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "color" varchar(20);--> statement-breakpoint
INSERT INTO "budget_scopes" ("id", "budget_id", "category_id", "subcategory_id")
SELECT gen_random_uuid()::text, "id", "category_id", "subcategory_id" FROM "budgets";--> statement-breakpoint
UPDATE "budgets" b SET "name" = c."name", "color" = c."color" FROM "categories" c WHERE b."category_id" = c."id";--> statement-breakpoint
UPDATE "budgets" SET "name" = 'Orçamento' WHERE "name" IS NULL;--> statement-breakpoint
UPDATE "budgets" SET "color" = '#4a8ee8' WHERE "color" IS NULL;--> statement-breakpoint
ALTER TABLE "budgets" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budgets" ALTER COLUMN "color" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_scopes" ADD CONSTRAINT "budget_scopes_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_scopes" ADD CONSTRAINT "budget_scopes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_scopes" ADD CONSTRAINT "budget_scopes_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budget_scopes_budget_id_idx" ON "budget_scopes" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "budget_scopes_category_id_idx" ON "budget_scopes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "budget_scopes_subcategory_id_idx" ON "budget_scopes" USING btree ("subcategory_id");--> statement-breakpoint
DROP INDEX IF EXISTS "budgets_user_period_category_currency_uq";--> statement-breakpoint
DROP INDEX IF EXISTS "budgets_user_period_subcategory_currency_uq";--> statement-breakpoint
DROP INDEX IF EXISTS "budgets_category_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "budgets_subcategory_id_idx";--> statement-breakpoint
ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "budgets_category_id_categories_id_fk";--> statement-breakpoint
ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "budgets_subcategory_id_subcategories_id_fk";--> statement-breakpoint
ALTER TABLE "budgets" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "budgets" DROP COLUMN "subcategory_id";
