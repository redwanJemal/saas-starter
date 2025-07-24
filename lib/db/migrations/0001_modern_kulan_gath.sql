CREATE TYPE "public"."incoming_shipment_status" AS ENUM('pending', 'scanning', 'scanned', 'assigned', 'received');--> statement-breakpoint
CREATE TYPE "public"."item_assignment_status" AS ENUM('unassigned', 'assigned', 'received');--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(2) NOT NULL,
	"name" varchar(255) NOT NULL,
	"region" varchar(100),
	"calling_code" varchar(10),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "countries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "couriers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"website_url" varchar(500),
	"tracking_url_template" varchar(500),
	"supported_countries" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "couriers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(3) NOT NULL,
	"name" varchar(255) NOT NULL,
	"symbol" varchar(10),
	"decimal_places" integer DEFAULT 2,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "incoming_shipment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incoming_shipment_id" uuid NOT NULL,
	"tracking_number" varchar(255) NOT NULL,
	"courier_tracking_url" varchar(500),
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"scanned_by" uuid NOT NULL,
	"assignment_status" "item_assignment_status" DEFAULT 'unassigned',
	"assigned_customer_profile_id" uuid,
	"assigned_at" timestamp,
	"assigned_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incoming_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"batch_reference" varchar(100) NOT NULL,
	"courier_id" uuid,
	"arrival_date" date,
	"total_pieces_expected" integer,
	"manifest_file_url" varchar(500),
	"status" "incoming_shipment_status" DEFAULT 'pending',
	"scan_completed_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_couriers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"courier_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"contract_details" jsonb,
	"api_credentials" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"currency_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false,
	"exchange_rate" numeric(12, 6) DEFAULT '1.0',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "incoming_shipment_items" ADD CONSTRAINT "incoming_shipment_items_incoming_shipment_id_incoming_shipments_id_fk" FOREIGN KEY ("incoming_shipment_id") REFERENCES "public"."incoming_shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipment_items" ADD CONSTRAINT "incoming_shipment_items_scanned_by_users_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipment_items" ADD CONSTRAINT "incoming_shipment_items_assigned_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("assigned_customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipment_items" ADD CONSTRAINT "incoming_shipment_items_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipments" ADD CONSTRAINT "incoming_shipments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipments" ADD CONSTRAINT "incoming_shipments_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipments" ADD CONSTRAINT "incoming_shipments_courier_id_couriers_id_fk" FOREIGN KEY ("courier_id") REFERENCES "public"."couriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipments" ADD CONSTRAINT "incoming_shipments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_couriers" ADD CONSTRAINT "tenant_couriers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_couriers" ADD CONSTRAINT "tenant_couriers_courier_id_couriers_id_fk" FOREIGN KEY ("courier_id") REFERENCES "public"."couriers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_currencies" ADD CONSTRAINT "tenant_currencies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_currencies" ADD CONSTRAINT "tenant_currencies_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE cascade ON UPDATE no action;