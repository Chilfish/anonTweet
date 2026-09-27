CREATE TABLE "tweet_article_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tweetId" text NOT NULL,
	"translations" json NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tweet_article_translations_tweetId_unique" UNIQUE("tweetId")
);
--> statement-breakpoint
CREATE INDEX "tweet_article_translations_tweetId_idx" ON "tweet_article_translations" USING btree ("tweetId");