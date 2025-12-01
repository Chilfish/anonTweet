CREATE TABLE "tweet" (
	"id" serial PRIMARY KEY NOT NULL,
	"jsonContent" json NOT NULL,
	"tweetOwnerId" text NOT NULL,
	"tweetId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tweet_tweetId_unique" UNIQUE("tweetId")
);
--> statement-breakpoint
CREATE TABLE "tweet_entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tweetUserId" text NOT NULL,
	"entities" json NOT NULL,
	"translatedBy" text NOT NULL,
	CONSTRAINT "tweet_entities_tweetUserId_unique" UNIQUE("tweetUserId")
);
--> statement-breakpoint
ALTER TABLE "tweet_entities" ADD CONSTRAINT "tweet_entities_translatedBy_user_id_fk" FOREIGN KEY ("translatedBy") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tweet_ownerId_idx" ON "tweet" USING btree ("tweetOwnerId");--> statement-breakpoint
CREATE INDEX "tweet_entities_tweetId_idx" ON "tweet_entities" USING btree ("tweetUserId");