CREATE TABLE "budgets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"category_id" varchar(36) NOT NULL,
	"subcategory_id" varchar(36),
	"period_start" date NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"planned_minor_units" varchar(20) NOT NULL,
	"spent_minor_units" varchar(20) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgets_user_period_idx" ON "budgets" USING btree ("user_id","period_start");--> statement-breakpoint
CREATE INDEX "budgets_category_id_idx" ON "budgets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "budgets_subcategory_id_idx" ON "budgets" USING btree ("subcategory_id");--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_user_period_category_currency_uq" ON "budgets" USING btree ("user_id","period_start","category_id","currency_code") WHERE "budgets"."subcategory_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_user_period_subcategory_currency_uq" ON "budgets" USING btree ("user_id","period_start","subcategory_id","currency_code") WHERE "budgets"."subcategory_id" IS NOT NULL;