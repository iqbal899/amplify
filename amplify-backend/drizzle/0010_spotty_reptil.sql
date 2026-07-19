CREATE TYPE "public"."snapshot_source" AS ENUM('poll', 'settlement', 'manual');--> statement-breakpoint
CREATE TABLE "view_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"views" bigint NOT NULL,
	"reach" bigint,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"source" "snapshot_source" DEFAULT 'poll' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reel_submissions" ADD COLUMN "instagram_media_id" text;--> statement-breakpoint
ALTER TABLE "reel_submissions" ADD COLUMN "went_live_at" timestamp;--> statement-breakpoint
ALTER TABLE "view_snapshots" ADD CONSTRAINT "view_snapshots_submission_id_reel_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."reel_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "view_snapshots_submission_captured_idx" ON "view_snapshots" USING btree ("submission_id","captured_at");