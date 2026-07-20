--> Backfill before the constraint: SET NOT NULL aborts if any row is NULL, and
--> campaigns were hand-inserted via psql before there was an admin API, so an
--> environment other than local dev may well have some. 'open' matches the
--> column default such a row was already being treated as having.
UPDATE "campaigns" SET "status" = 'open' WHERE "status" IS NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "status" SET NOT NULL;
