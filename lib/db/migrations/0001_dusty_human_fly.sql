CREATE TYPE "public"."service_type" AS ENUM('standard', 'express', 'economy');--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"service_type" "service_type" NOT NULL,
	"base_rate" numeric(10, 2) NOT NULL,
	"per_kg_rate" numeric(10, 2) NOT NULL,
	"min_charge" numeric(10, 2) NOT NULL,
	"max_weight_kg" numeric(8, 3),
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"is_active" boolean DEFAULT true,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zone_countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "zone_id" uuid;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "base_shipping_rate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "weight_shipping_rate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "rate_calculation_details" jsonb;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zone_countries" ADD CONSTRAINT "zone_countries_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;