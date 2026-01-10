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
 "tweetId" text NOT NULL,
 "entities" json NOT NULL,
 CONSTRAINT "tweet_entities_tweetId_unique" UNIQUE("tweetId")
);
--> statement-breakpoint
CREATE TABLE "tweet_user" (
 "id" serial PRIMARY KEY NOT NULL,
 "tweetUserName" text NOT NULL,
 "user" json NOT NULL,
 CONSTRAINT "tweet_user_tweetUserName_unique" UNIQUE("tweetUserName")
);
--> statement-breakpoint
CREATE INDEX "tweet_ownerId_idx" ON "tweet" USING btree ("tweetOwnerId");--> statement-breakpoint
CREATE INDEX "tweet_entities_tweetId_idx" ON "tweet_entities" USING btree ("tweetId");
