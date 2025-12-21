CREATE TABLE "refresh_tokens" (
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp,
	"token" text NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DROP TABLE "tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;