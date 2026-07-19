ALTER TABLE "creators" ADD COLUMN "instagram_access_token" text;--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "instagram_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "instagram_account_type" varchar(32);--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "instagram_connected_at" timestamp;