ALTER TABLE "shipments" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "stripe_payment_intent_id" varchar(255);--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "payment_reference" varchar(255);