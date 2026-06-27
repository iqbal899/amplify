CREATE TYPE "public"."platform" AS ENUM('instagram', 'youtube');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "reel_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"reel_url" text NOT NULL,
	"platform" "platform" NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"current_views" bigint DEFAULT 0 NOT NULL,
	"last_checked_at" timestamp,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "reel_submissions_enrollment_id_unique" UNIQUE("enrollment_id")
);
--> statement-breakpoint
ALTER TABLE "reel_submissions" ADD CONSTRAINT "reel_submissions_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;