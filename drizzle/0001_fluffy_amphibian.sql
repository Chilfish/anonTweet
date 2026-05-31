CREATE TABLE "ig_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"postShortcode" text NOT NULL,
	"username" text NOT NULL,
	"jsonContent" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ig_post_postShortcode_unique" UNIQUE("postShortcode")
);
--> statement-breakpoint
CREATE INDEX "ig_post_username_idx" ON "ig_post" USING btree ("username");