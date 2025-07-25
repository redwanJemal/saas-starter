CREATE TABLE "bin_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"bin_code" varchar(20) NOT NULL,
	"zone_name" varchar(50) NOT NULL,
	"description" text,
	"max_capacity" integer DEFAULT 10,
	"current_occupancy" integer DEFAULT 0,
	"max_weight_kg" numeric(8, 3),
	"daily_premium" numeric(6, 2) DEFAULT '0.00',
	"currency" varchar(3) DEFAULT 'USD',
	"is_climate_controlled" boolean DEFAULT false,
	"is_secured" boolean DEFAULT false,
	"is_accessible" boolean DEFAULT true,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_bin_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"bin_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	"removed_at" timestamp,
	"removed_by" uuid,
	"assignment_reason" varchar(100),
	"removal_reason" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"charge_from_date" date NOT NULL,
	"charge_to_date" date NOT NULL,
	"days_charged" integer NOT NULL,
	"base_storage_fee" numeric(8, 2) NOT NULL,
	"bin_location_fee" numeric(8, 2) DEFAULT '0.00',
	"total_storage_fee" numeric(8, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"bin_location_id" uuid,
	"is_invoiced" boolean DEFAULT false,
	"invoice_id" uuid,
	"daily_rate" numeric(6, 2) NOT NULL,
	"free_days_applied" integer DEFAULT 0,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"calculated_by" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "storage_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid,
	"free_days" integer DEFAULT 7 NOT NULL,
	"daily_rate_after_free" numeric(8, 2) DEFAULT '2.00' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bin_locations" ADD CONSTRAINT "bin_locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bin_locations" ADD CONSTRAINT "bin_locations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_bin_assignments" ADD CONSTRAINT "package_bin_assignments_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_bin_assignments" ADD CONSTRAINT "package_bin_assignments_bin_id_bin_locations_id_fk" FOREIGN KEY ("bin_id") REFERENCES "public"."bin_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_charges" ADD CONSTRAINT "storage_charges_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_charges" ADD CONSTRAINT "storage_charges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_charges" ADD CONSTRAINT "storage_charges_bin_location_id_bin_locations_id_fk" FOREIGN KEY ("bin_location_id") REFERENCES "public"."bin_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_pricing" ADD CONSTRAINT "storage_pricing_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_pricing" ADD CONSTRAINT "storage_pricing_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;