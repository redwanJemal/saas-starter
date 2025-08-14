CREATE TYPE "public"."address_type" AS ENUM('shipping', 'billing');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('active', 'suspended', 'expired');--> statement-breakpoint
CREATE TYPE "public"."company_type" AS ENUM('LLC', 'Corp', 'Ltd', 'Partnership', 'Sole_Proprietorship', 'Other');--> statement-breakpoint
CREATE TYPE "public"."incoming_shipment_status" AS ENUM('pending', 'scanning', 'scanned', 'assigned', 'received', 'expected');--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('shipping', 'storage', 'handling', 'personal_shopper', 'customs_duty', 'insurance', 'other');--> statement-breakpoint
CREATE TYPE "public"."item_assignment_status" AS ENUM('unassigned', 'assigned', 'received');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('not_required', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'bounced', 'unread');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('expected', 'received', 'processing', 'ready_to_ship', 'reserved', 'shipped', 'delivered', 'returned', 'disposed', 'missing', 'damaged', 'held');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."role_type" AS ENUM('customer', 'admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('standard', 'express', 'economy');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('quote_requested', 'quoted', 'paid', 'processing', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'delivery_failed', 'returned', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."tax_treatment" AS ENUM('standard', 'tax_free', 'bonded');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('customer', 'admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."warehouse_status" AS ENUM('active', 'inactive', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."personal_shopper_action" AS ENUM('submit_request', 'save_for_later');--> statement-breakpoint
CREATE TYPE "public"."personal_shopper_request_status" AS ENUM('draft', 'submitted', 'quoted', 'approved', 'purchasing', 'purchased', 'received', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."shipping_preference" AS ENUM('send_together', 'send_as_available', 'send_by_category', 'fastest_delivery');--> statement-breakpoint
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
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"customer_profile_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid,
	"description" text,
	"metadata" jsonb DEFAULT '{}',
	"ip_address" varchar(50),
	"user_agent" varchar(500),
	"previous_values" jsonb,
	"new_values" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT false,
	"tenant_rules" jsonb DEFAULT '[]',
	"user_rules" jsonb DEFAULT '[]',
	"rollout_percentage" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_name_unique" UNIQUE("name")
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
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"is_public" boolean DEFAULT false,
	"is_encrypted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tenant_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"overrides_system_default" boolean DEFAULT false,
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
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"file_url" varchar(500) NOT NULL,
	"bucket" varchar(100) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"is_public" boolean DEFAULT false,
	"description" text,
	"tags" text,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"processing_status" varchar(50) DEFAULT 'pending',
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid,
	"document_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"is_required" boolean DEFAULT false,
	"is_primary" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"attached_by" uuid,
	"attached_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temporary_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"purpose" varchar(50) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
	"reference_id" uuid,
	"reference_type" varchar(50) DEFAULT 'shipment' NOT NULL,
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
	"incoming_shipment_item_id" uuid,
	"internal_id" varchar(50) NOT NULL,
	"suite_code_captured" varchar(50),
	"tracking_number_inbound" varchar(255),
	"courier_name" varchar(255),
	"sender_name" varchar(255),
	"sender_company" varchar(255),
	"sender_tracking_url" varchar(500),
	"description" text,
	"estimated_value" numeric(12, 2) DEFAULT '0',
	"estimated_value_currency" varchar(3) DEFAULT 'USD',
	"weight_actual_kg" numeric(8, 3),
	"length_cm" numeric(8, 2),
	"width_cm" numeric(8, 2),
	"height_cm" numeric(8, 2),
	"volumetric_weight_kg" numeric(8, 3),
	"chargeable_weight_kg" numeric(8, 3),
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
	CONSTRAINT "packages_internal_id_unique" UNIQUE("internal_id"),
	CONSTRAINT "unique_tracking_courier_per_tenant" UNIQUE("tracking_number_inbound","courier_name","tenant_id")
);
--> statement-breakpoint
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
CREATE TABLE "shipment_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"declared_value" numeric(12, 2),
	"declared_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"status" "shipment_status" NOT NULL,
	"previous_status" "shipment_status",
	"notes" text,
	"changed_by" uuid,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"tracking_number" varchar(255),
	"carrier_name" varchar(255),
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
	"zone_id" uuid,
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
	"base_shipping_rate" numeric(10, 2),
	"weight_shipping_rate" numeric(10, 2),
	"rate_calculation_details" jsonb,
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
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"notification_type" varchar(50) NOT NULL,
	"status" "notification_status" DEFAULT 'unread',
	"reference_type" varchar(50),
	"reference_id" uuid,
	"sent_via_email" boolean DEFAULT false,
	"sent_via_sms" boolean DEFAULT false,
	"sent_via_push" boolean DEFAULT false,
	"read_at" timestamp,
	"clicked_at" timestamp,
	"metadata" jsonb DEFAULT '{}',
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(2) NOT NULL,
	"name" varchar(100) NOT NULL,
	"region" varchar(100),
	"subregion" varchar(100),
	"is_active" boolean DEFAULT true,
	"is_shipping_enabled" boolean DEFAULT true,
	"requires_postal_code" boolean DEFAULT true,
	"requires_state_province" boolean DEFAULT false,
	"eu_member" boolean DEFAULT false,
	"customs_form_type" varchar(50),
	"flag_emoji" varchar(10),
	"phone_prefix" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "countries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "courier_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"courier_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_express" boolean DEFAULT false,
	"is_international" boolean DEFAULT false,
	"estimated_delivery_days" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "couriers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"website" varchar(255),
	"tracking_url_template" varchar(500),
	"is_active" boolean DEFAULT true,
	"api_credentials" jsonb,
	"integration_settings" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "couriers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(3) NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true,
	"decimal_places" integer DEFAULT 2,
	"symbol_position" varchar(10) DEFAULT 'before',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "incoming_shipment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"incoming_shipment_id" uuid NOT NULL,
	"tracking_number" varchar(255),
	"courier_name" varchar(255),
	"courier_tracking_url" varchar(500),
	"scanned_by" uuid,
	"scanned_at" timestamp,
	"assigned_customer_profile_id" uuid,
	"assigned_by" uuid,
	"assigned_at" timestamp,
	"assignment_status" varchar(50) DEFAULT 'pending',
	"weight_kg" numeric(8, 3),
	"length_cm" numeric(8, 2),
	"width_cm" numeric(8, 2),
	"height_cm" numeric(8, 2),
	"description" text,
	"estimated_value" numeric(12, 2),
	"estimated_value_currency" varchar(3) DEFAULT 'USD',
	"notes" text,
	"special_instructions" text,
	"is_fragile" boolean DEFAULT false,
	"is_high_value" boolean DEFAULT false,
	"requires_adult_signature" boolean DEFAULT false,
	"is_restricted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_tracking_courier_shipment" UNIQUE("tracking_number","courier_name","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "incoming_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"batch_reference" varchar(100) NOT NULL,
	"courier_id" uuid,
	"courier_name" varchar(255),
	"tracking_number" varchar(255),
	"arrival_date" date,
	"expected_arrival_date" date,
	"actual_arrival_date" date,
	"status" varchar(50) DEFAULT 'pending',
	"received_by" uuid,
	"received_at" timestamp,
	"processed_by" uuid,
	"processed_at" timestamp,
	"notes" text,
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
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_id_customer_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_kyc_verified_by_users_id_fk" FOREIGN KEY ("kyc_verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_documents" ADD CONSTRAINT "package_documents_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_documents" ADD CONSTRAINT "package_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_documents" ADD CONSTRAINT "package_documents_attached_by_users_id_fk" FOREIGN KEY ("attached_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_documents" ADD CONSTRAINT "temporary_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_invoice_lines" ADD CONSTRAINT "financial_invoice_lines_invoice_id_financial_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."financial_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_invoices" ADD CONSTRAINT "financial_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_invoices" ADD CONSTRAINT "financial_invoices_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_invoices" ADD CONSTRAINT "financial_invoices_reference_id_shipments_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_warehouse_assignments" ADD CONSTRAINT "customer_warehouse_assignments_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_warehouse_assignments" ADD CONSTRAINT "customer_warehouse_assignments_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_warehouse_assignments" ADD CONSTRAINT "customer_warehouse_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_status_history" ADD CONSTRAINT "package_status_history_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_status_history" ADD CONSTRAINT "package_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_incoming_shipment_item_id_incoming_shipment_items_id_fk" FOREIGN KEY ("incoming_shipment_item_id") REFERENCES "public"."incoming_shipment_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zone_countries" ADD CONSTRAINT "zone_countries_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_packages" ADD CONSTRAINT "shipment_packages_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_packages" ADD CONSTRAINT "shipment_packages_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_status_history" ADD CONSTRAINT "shipment_status_history_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_status_history" ADD CONSTRAINT "shipment_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shipping_address_id_addresses_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_billing_address_id_addresses_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bin_locations" ADD CONSTRAINT "bin_locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bin_locations" ADD CONSTRAINT "bin_locations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_bin_assignments" ADD CONSTRAINT "package_bin_assignments_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_bin_assignments" ADD CONSTRAINT "package_bin_assignments_bin_id_bin_locations_id_fk" FOREIGN KEY ("bin_id") REFERENCES "public"."bin_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_charges" ADD CONSTRAINT "storage_charges_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_charges" ADD CONSTRAINT "storage_charges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_charges" ADD CONSTRAINT "storage_charges_bin_location_id_bin_locations_id_fk" FOREIGN KEY ("bin_location_id") REFERENCES "public"."bin_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_pricing" ADD CONSTRAINT "storage_pricing_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_pricing" ADD CONSTRAINT "storage_pricing_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courier_services" ADD CONSTRAINT "courier_services_courier_id_couriers_id_fk" FOREIGN KEY ("courier_id") REFERENCES "public"."couriers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipment_items" ADD CONSTRAINT "incoming_shipment_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipment_items" ADD CONSTRAINT "incoming_shipment_items_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipment_items" ADD CONSTRAINT "incoming_shipment_items_incoming_shipment_id_incoming_shipments_id_fk" FOREIGN KEY ("incoming_shipment_id") REFERENCES "public"."incoming_shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipment_items" ADD CONSTRAINT "incoming_shipment_items_scanned_by_users_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipment_items" ADD CONSTRAINT "incoming_shipment_items_assigned_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("assigned_customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipment_items" ADD CONSTRAINT "incoming_shipment_items_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipments" ADD CONSTRAINT "incoming_shipments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipments" ADD CONSTRAINT "incoming_shipments_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipments" ADD CONSTRAINT "incoming_shipments_courier_id_couriers_id_fk" FOREIGN KEY ("courier_id") REFERENCES "public"."couriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipments" ADD CONSTRAINT "incoming_shipments_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incoming_shipments" ADD CONSTRAINT "incoming_shipments_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_couriers" ADD CONSTRAINT "tenant_couriers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_couriers" ADD CONSTRAINT "tenant_couriers_courier_id_couriers_id_fk" FOREIGN KEY ("courier_id") REFERENCES "public"."couriers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_currencies" ADD CONSTRAINT "tenant_currencies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_currencies" ADD CONSTRAINT "tenant_currencies_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_request_items" ADD CONSTRAINT "personal_shopper_request_items_personal_shopper_request_id_personal_shopper_requests_id_fk" FOREIGN KEY ("personal_shopper_request_id") REFERENCES "public"."personal_shopper_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_request_status_history" ADD CONSTRAINT "personal_shopper_request_status_history_personal_shopper_request_id_personal_shopper_requests_id_fk" FOREIGN KEY ("personal_shopper_request_id") REFERENCES "public"."personal_shopper_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_request_status_history" ADD CONSTRAINT "personal_shopper_request_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_requests" ADD CONSTRAINT "personal_shopper_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_requests" ADD CONSTRAINT "personal_shopper_requests_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_requests" ADD CONSTRAINT "personal_shopper_requests_quoted_by_users_id_fk" FOREIGN KEY ("quoted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_shopper_requests" ADD CONSTRAINT "personal_shopper_requests_purchased_by_users_id_fk" FOREIGN KEY ("purchased_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "packages_tracking_number_idx" ON "packages" USING btree ("tracking_number_inbound");--> statement-breakpoint
CREATE INDEX "packages_status_idx" ON "packages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "packages_customer_idx" ON "packages" USING btree ("customer_profile_id");--> statement-breakpoint
CREATE INDEX "incoming_items_tracking_number_idx" ON "incoming_shipment_items" USING btree ("tracking_number");--> statement-breakpoint
CREATE INDEX "incoming_items_assignment_status_idx" ON "incoming_shipment_items" USING btree ("assignment_status");--> statement-breakpoint
CREATE INDEX "incoming_items_scanned_at_idx" ON "incoming_shipment_items" USING btree ("scanned_at");