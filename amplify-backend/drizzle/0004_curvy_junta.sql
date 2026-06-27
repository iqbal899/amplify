CREATE TYPE "public"."payout_status" AS ENUM('pending', 'paid', 'failed');--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"submission_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"upi_reference" varchar(100),
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	CONSTRAINT "payouts_submission_id_unique" UNIQUE("submission_id")
);
--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_submission_id_reel_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."reel_submissions"("id") ON DELETE cascade ON UPDATE no action;