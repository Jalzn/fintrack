ALTER TABLE "grocery_items" ADD COLUMN "brand" varchar(120);--> statement-breakpoint
ALTER TABLE "grocery_items" ADD COLUMN "code" varchar(32);--> statement-breakpoint
ALTER TABLE "grocery_items" ADD COLUMN "department" varchar(24);--> statement-breakpoint
ALTER TABLE "grocery_items" ADD COLUMN "size" varchar(32);--> statement-breakpoint
CREATE INDEX "grocery_items_department_idx" ON "grocery_items" USING btree ("department");