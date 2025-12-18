CREATE TABLE "tweet_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"tweetUserName" text NOT NULL,
	"user" text NOT NULL,
	CONSTRAINT "tweet_user_tweetUserName_unique" UNIQUE("tweetUserName")
);
