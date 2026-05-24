CREATE TABLE "grocery_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"receipt_id" varchar(36) NOT NULL,
	"raw_description" varchar(500) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"quantity" varchar(20) NOT NULL,
	"unit" varchar(8) NOT NULL,
	"unit_price_minor_units" varchar(20) NOT NULL,
	"line_total_minor_units" varchar(20) NOT NULL,
	"currency_code" varchar(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grocery_receipts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"store_name" varchar(255) NOT NULL,
	"purchase_date" timestamp with time zone NOT NULL,
	"total_minor_units" varchar(20) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"transaction_id" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grocery_items" ADD CONSTRAINT "grocery_items_receipt_id_grocery_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."grocery_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grocery_items_receipt_id_idx" ON "grocery_items" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "grocery_items_normalized_name_idx" ON "grocery_items" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "grocery_receipts_user_id_idx" ON "grocery_receipts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "grocery_receipts_user_id_purchase_date_idx" ON "grocery_receipts" USING btree ("user_id","purchase_date");