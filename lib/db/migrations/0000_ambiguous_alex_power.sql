CREATE TYPE "public"."address_type" AS ENUM('shipping', 'billing');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('active', 'suspended', 'expired');--> statement-breakpoint
CREATE TYPE "public"."company_type" AS ENUM('LLC', 'Corp', 'Ltd', 'Partnership', 'Sole_Proprietorship', 'Other');--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('shipping', 'storage', 'handling', 'personal_shopper', 'customs_duty', 'insurance', 'other');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('not_required', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('expected', 'received', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'returned', 'disposed', 'missing', 'damaged', 'held');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."role_type" AS ENUM('customer', 'admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('quote_requested', 'quoted', 'paid', 'processing', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'delivery_failed', 'returned', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."tax_treatment" AS ENUM('standard', 'tax_free', 'bonded');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('customer', 'admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."warehouse_status" AS ENUM('active', 'inactive', 'maintenance');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"customer_profile_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid,
	"description" text,
	"ip_address" "inet",
	"user_agent" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_profile_id" uuid NOT NULL,
	"address_type" "address_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state_province" varchar(100),
	"postal_code" varchar(50) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"phone" varchar(50),
	"email" varchar(255),
	"delivery_instructions" text,
	"is_default" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"verification_method" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"registration_number" varchar(100),
	"tax_number" varchar(100),
	"tax_number_type" varchar(50),
	"country_code" varchar(2) NOT NULL,
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"city" varchar(100),
	"state_province" varchar(100),
	"postal_code" varchar(50),
	"company_type" "company_type",
	"industry" varchar(100),
	"verification_status" "verification_status" DEFAULT 'unverified',
	"verification_documents" jsonb DEFAULT '[]',
	"show_in_address" boolean DEFAULT false,
	"use_for_customs" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" varchar(50) NOT NULL,
	"date_of_birth" date,
	"nationality" varchar(2),
	"id_number" varchar(100),
	"kyc_status" "kyc_status" DEFAULT 'not_required',
	"kyc_documents" jsonb DEFAULT '[]',
	"kyc_notes" text,
	"kyc_verified_at" timestamp,
	"kyc_verified_by" uuid,
	"risk_level" "risk_level" DEFAULT 'low',
	"total_spent" numeric(12, 2) DEFAULT '0.00',
	"total_packages" integer DEFAULT 0,
	"total_shipments" integer DEFAULT 0,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"stripe_product_id" varchar(255),
	"plan_name" varchar(100),
	"subscription_status" varchar(50) DEFAULT 'inactive',
	"referral_code" varchar(50),
	"referred_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "customer_profiles_customer_id_unique" UNIQUE("customer_id"),
	CONSTRAINT "customer_profiles_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "customer_warehouse_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_profile_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"suite_code" varchar(50) NOT NULL,
	"status" "assignment_status" DEFAULT 'active',
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" uuid
);
--> statement-breakpoint
CREATE TABLE "financial_invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 3) DEFAULT '1.000',
	"unit_price" numeric(12, 2) NOT NULL,
	"line_total" numeric(12, 2) NOT NULL,
	"tax_rate" numeric(5, 4) DEFAULT '0.0000',
	"tax_amount" numeric(12, 2) DEFAULT '0.00',
	"reference_type" varchar(50),
	"reference_id" uuid,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_profile_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"invoice_type" "invoice_type" NOT NULL,
	"shipment_id" uuid,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0.00',
	"discount_amount" numeric(12, 2) DEFAULT '0.00',
	"total_amount" numeric(12, 2) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending',
	"paid_amount" numeric(12, 2) DEFAULT '0.00',
	"payment_method" varchar(50),
	"payment_reference" varchar(255),
	"paid_at" timestamp,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp,
	"notes" text,
	"payment_terms" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "financial_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_profile_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"subject" varchar(500),
	"message" text,
	"status" "notification_status" DEFAULT 'pending',
	"provider" varchar(50),
	"provider_message_id" varchar(255),
	"provider_response" jsonb,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"next_retry_at" timestamp,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"failed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_profile_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"email_enabled" boolean DEFAULT true,
	"sms_enabled" boolean DEFAULT false,
	"whatsapp_enabled" boolean DEFAULT false,
	"push_enabled" boolean DEFAULT true,
	"email_address" varchar(255),
	"phone_number" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"file_size_bytes" integer,
	"mime_type" varchar(100),
	"is_public" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"uploaded_by" uuid,
	"upload_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"status" "package_status" NOT NULL,
	"notes" text,
	"changed_by" uuid,
	"change_reason" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_profile_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"internal_id" varchar(50) NOT NULL,
	"suite_code_captured" varchar(50),
	"tracking_number_inbound" varchar(255),
	"sender_name" varchar(255),
	"sender_company" varchar(255),
	"sender_tracking_url" varchar(500),
	"description" text,
	"estimated_value" numeric(12, 2),
	"estimated_value_currency" varchar(3) DEFAULT 'USD',
	"weight_actual_kg" numeric(8, 3),
	"length_cm" numeric(8, 2),
	"width_cm" numeric(8, 2),
	"height_cm" numeric(8, 2),
	"volumetric_weight_kg" numeric(8, 3),
	"status" "package_status" DEFAULT 'expected',
	"expected_arrival_date" date,
	"received_at" timestamp,
	"ready_to_ship_at" timestamp,
	"storage_expires_at" timestamp,
	"warehouse_notes" text,
	"customer_notes" text,
	"special_instructions" text,
	"is_fragile" boolean DEFAULT false,
	"is_high_value" boolean DEFAULT false,
	"requires_adult_signature" boolean DEFAULT false,
	"is_restricted" boolean DEFAULT false,
	"processed_by" uuid,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "packages_internal_id_unique" UNIQUE("internal_id")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name"),
	CONSTRAINT "permissions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"role_type" "role_type" NOT NULL,
	"is_system_role" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"declared_value" numeric(12, 2),
	"declared_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_tracking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"event_code" varchar(50) NOT NULL,
	"event_description" text NOT NULL,
	"location" varchar(255),
	"event_timestamp" timestamp NOT NULL,
	"source" varchar(50) DEFAULT 'manual',
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_profile_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"shipment_number" varchar(50) NOT NULL,
	"shipping_address_id" uuid,
	"billing_address_id" uuid,
	"company_id" uuid,
	"carrier_code" varchar(50),
	"service_type" varchar(100),
	"tracking_number" varchar(255),
	"carrier_reference" varchar(255),
	"total_weight_kg" numeric(8, 3),
	"total_declared_value" numeric(12, 2),
	"declared_value_currency" varchar(3) DEFAULT 'USD',
	"shipping_cost" numeric(10, 2),
	"insurance_cost" numeric(10, 2) DEFAULT '0.00',
	"handling_fee" numeric(10, 2) DEFAULT '0.00',
	"storage_fee" numeric(10, 2) DEFAULT '0.00',
	"total_cost" numeric(10, 2),
	"cost_currency" varchar(3),
	"status" "shipment_status" DEFAULT 'quote_requested',
	"quote_expires_at" timestamp,
	"paid_at" timestamp,
	"dispatched_at" timestamp,
	"estimated_delivery_date" date,
	"delivered_at" timestamp,
	"customs_declaration" jsonb DEFAULT '{}',
	"commercial_invoice_url" varchar(500),
	"customs_status" varchar(30) DEFAULT 'pending',
	"requires_signature" boolean DEFAULT false,
	"delivery_instructions" text,
	"created_by" uuid,
	"processed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_shipment_number_unique" UNIQUE("shipment_number")
);
--> statement-breakpoint
CREATE TABLE "system_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"config_key" varchar(255) NOT NULL,
	"config_value" text,
	"config_type" varchar(50) DEFAULT 'string',
	"description" text,
	"is_public" boolean DEFAULT false,
	"is_encrypted" boolean DEFAULT false,
	"validation_rules" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"domain" varchar(255),
	"company_name" varchar(255),
	"company_registration" varchar(100),
	"tax_number" varchar(100),
	"settings" jsonb DEFAULT '{}',
	"branding" jsonb DEFAULT '{}',
	"plan_type" varchar(50) DEFAULT 'standard',
	"billing_email" varchar(255),
	"status" "tenant_status" DEFAULT 'active',
	"max_users" integer DEFAULT 1000,
	"max_packages_monthly" integer DEFAULT 10000,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"expires_at" timestamp,
	"assigned_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified_at" timestamp,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(50),
	"avatar_url" varchar(500),
	"user_type" "user_type" DEFAULT 'customer',
	"status" "user_status" DEFAULT 'active',
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" varchar(255),
	"last_login_at" timestamp,
	"last_login_ip" "inet",
	"language" varchar(10) DEFAULT 'en',
	"timezone" varchar(100) DEFAULT 'UTC',
	"currency_preference" varchar(3) DEFAULT 'USD',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"country_code" varchar(2) NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state_province" varchar(100),
	"postal_code" varchar(50) NOT NULL,
	"phone" varchar(50),
	"email" varchar(255),
	"timezone" varchar(100) DEFAULT 'UTC',
	"currency_code" varchar(3) NOT NULL,
	"tax_treatment" "tax_treatment" DEFAULT 'standard',
	"storage_free_days" integer DEFAULT 30,
	"storage_fee_per_day" numeric(8, 2) DEFAULT '1.00',
	"max_package_weight_kg" numeric(8, 2) DEFAULT '30.00',
	"max_package_value" numeric(12, 2) DEFAULT '10000.00',
	"status" "warehouse_status" DEFAULT 'active',
	"accepts_new_packages" boolean DEFAULT true,
	"operating_hours" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_id_customer_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_kyc_verified_by_users_id_fk" FOREIGN KEY ("kyc_verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_warehouse_assignments" ADD CONSTRAINT "customer_warehouse_assignments_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_warehouse_assignments" ADD CONSTRAINT "customer_warehouse_assignments_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_warehouse_assignments" ADD CONSTRAINT "customer_warehouse_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_invoice_lines" ADD CONSTRAINT "financial_invoice_lines_invoice_id_financial_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."financial_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_invoices" ADD CONSTRAINT "financial_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_invoices" ADD CONSTRAINT "financial_invoices_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_invoices" ADD CONSTRAINT "financial_invoices_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_documents" ADD CONSTRAINT "package_documents_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_documents" ADD CONSTRAINT "package_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_status_history" ADD CONSTRAINT "package_status_history_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_status_history" ADD CONSTRAINT "package_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_packages" ADD CONSTRAINT "shipment_packages_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_packages" ADD CONSTRAINT "shipment_packages_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shipping_address_id_addresses_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_billing_address_id_addresses_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;