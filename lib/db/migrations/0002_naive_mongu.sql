CREATE TYPE "public"."personal_shopper_action" AS ENUM('submit_request', 'save_for_later');--> statement-breakpoint
CREATE TYPE "public"."personal_shopper_request_status" AS ENUM('draft', 'submitted', 'quoted', 'approved', 'purchasing', 'purchased', 'received', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."shipping_preference" AS ENUM('send_together', 'send_as_available', 'send_by_category', 'fastest_delivery');--> statement-breakpoint
CREATE TABLE "personal_shopper_request_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personal_shopper_request_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"description" text,
	"size" varchar(50),
	"color" varchar(50),
	"variant" varchar(100),
	"quantity" numeric(10, 0) DEFAULT '1' NOT NULL,
	"max_budget_per_item" numeric(12, 2),
	"actual_price" numeric(12, 2),
	"total_item_cost" numeric(12, 2),
	"additional_instructions" text,
	"retailer_name" varchar(255),
	"retailer_order_number" varchar(100),
	"purchased_at" timestamp,
	"retailer_tracking_number" varchar(100),
	"package_id" uuid,
	"status" varchar(50) DEFAULT 'pending',
	"sort_order" numeric(3, 0) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_shopper_request_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personal_shopper_request_id" uuid NOT NULL,
	"status" "personal_shopper_request_status" NOT NULL,
	"notes" text,
	"changed_by" uuid,
	"change_reason" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_shopper_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_profile_id" uuid NOT NULL,
	"request_number" varchar(50) NOT NULL,
	"status" "personal_shopper_request_status" DEFAULT 'draft' NOT NULL,
	"shipping_option" varchar(100),
	"shipping_preference" "shipping_preference" DEFAULT 'send_together',
	"allow_alternate_retailers" boolean DEFAULT true,
	"estimated_cost" numeric(12, 2) DEFAULT '0.00',
	"actual_cost" numeric(12, 2) DEFAULT '0.00',
	"service_fee" numeric(12, 2) DEFAULT '0.00',
	"total_amount" numeric(12, 2) DEFAULT '0.00',
	"currency_code" varchar(3) DEFAULT 'USD',
	"quoted_at" timestamp,
	"quoted_by" uuid,
	"approved_at" timestamp,
	"purchased_at" timestamp,
	"purchased_by" uuid,
	"special_instructions" text,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "personal_shopper_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
ALTER TABLE "personal_shopper_request_items" ADD CONSTRAINT "personal_shopper_request_items_personal_shopper_request_id_personal_shopper_requests_id_fk" FOREIGN KEY ("personal_shopper_request_id") REFERENCES "public"."personal_shopper_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_request_status_history" ADD CONSTRAINT "personal_shopper_request_status_history_personal_shopper_request_id_personal_shopper_requests_id_fk" FOREIGN KEY ("personal_shopper_request_id") REFERENCES "public"."personal_shopper_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_request_status_history" ADD CONSTRAINT "personal_shopper_request_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_requests" ADD CONSTRAINT "personal_shopper_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_requests" ADD CONSTRAINT "personal_shopper_requests_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_requests" ADD CONSTRAINT "personal_shopper_requests_quoted_by_users_id_fk" FOREIGN KEY ("quoted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_requests" ADD CONSTRAINT "personal_shopper_requests_purchased_by_users_id_fk" FOREIGN KEY ("purchased_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;