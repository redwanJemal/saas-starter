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
CREATE TABLE "temporary_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"purpose" varchar(50) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "package_documents" DROP CONSTRAINT "package_documents_uploaded_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "package_documents" ALTER COLUMN "package_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "package_documents" ADD COLUMN "document_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "package_documents" ADD COLUMN "is_required" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "package_documents" ADD COLUMN "is_primary" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "package_documents" ADD COLUMN "display_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "package_documents" ADD COLUMN "attached_by" uuid;--> statement-breakpoint
ALTER TABLE "package_documents" ADD COLUMN "attached_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "package_documents" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_documents" ADD CONSTRAINT "temporary_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_documents" ADD CONSTRAINT "package_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_documents" ADD CONSTRAINT "package_documents_attached_by_users_id_fk" FOREIGN KEY ("attached_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_documents" DROP COLUMN "file_name";--> statement-breakpoint
ALTER TABLE "package_documents" DROP COLUMN "file_size";--> statement-breakpoint
ALTER TABLE "package_documents" DROP COLUMN "mime_type";--> statement-breakpoint
ALTER TABLE "package_documents" DROP COLUMN "file_url";--> statement-breakpoint
ALTER TABLE "package_documents" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "package_documents" DROP COLUMN "uploaded_by";--> statement-breakpoint
ALTER TABLE "package_documents" DROP COLUMN "uploaded_at";