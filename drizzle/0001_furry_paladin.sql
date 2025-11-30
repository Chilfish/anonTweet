CREATE TABLE "tweet" (
	"id" serial PRIMARY KEY NOT NULL,
	"jsonContent" json NOT NULL,
	"tweetOwnerId" text NOT NULL,
	"tweetId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tweet_ownerId_idx" ON "tweet" USING btree ("tweetOwnerId");