CREATE TABLE IF NOT EXISTS "replier_tool_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"tool_category" text NOT NULL,
	"action_type" text DEFAULT 'usage' NOT NULL,
	"metadata" jsonb,
	"duration" integer,
	"tokens_used" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "replier_tool_analytics" ADD CONSTRAINT "replier_tool_analytics_user_id_replier_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."replier_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_analytics_user_id_idx" ON "replier_tool_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_analytics_tool_name_idx" ON "replier_tool_analytics" USING btree ("tool_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_analytics_tool_category_idx" ON "replier_tool_analytics" USING btree ("tool_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_analytics_created_at_idx" ON "replier_tool_analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_analytics_user_tool_idx" ON "replier_tool_analytics" USING btree ("user_id","tool_name");