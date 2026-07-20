ALTER TYPE "public"."campaign_status" ADD VALUE 'draft';--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "upi_id" varchar(255);