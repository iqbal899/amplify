CREATE TYPE "public"."campaign_status" AS ENUM('open', 'full', 'closed');--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"track_name" varchar(255) NOT NULL,
	"artist_name" varchar(255) NOT NULL,
	"spotify_track_id" varchar(255),
	"genre" varchar(100),
	"language" varchar(100),
	"album_art" text,
	"preview_url" text,
	"description" text,
	"reward_pool" numeric(12, 2),
	"spots_total" integer NOT NULL,
	"spots_filled" integer DEFAULT 0,
	"ends_at" timestamp,
	"milestones" jsonb,
	"status" "campaign_status" DEFAULT 'open',
	"created_at" timestamp DEFAULT now() NOT NULL
);
