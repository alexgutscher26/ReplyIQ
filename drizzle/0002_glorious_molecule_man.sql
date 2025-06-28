CREATE TABLE IF NOT EXISTS "replier_brand_voice_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"brand_voice_id" uuid,
	"prompt" text NOT NULL,
	"generated_content" text NOT NULL,
	"content_type" text,
	"platform" text,
	"metadata" jsonb,
	"quality_score" integer,
	"is_used" boolean DEFAULT false,
	"tokens_used" integer,
	"generation_time" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "replier_brand_voice_training_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_voice_id" uuid NOT NULL,
	"content_type" text NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"platform" text,
	"metadata" jsonb,
	"word_count" integer,
	"is_processed" boolean DEFAULT false,
	"analysis_score" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "replier_brand_voices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"industry" text,
	"tone_attributes" jsonb,
	"writing_style" jsonb,
	"vocabulary" jsonb,
	"brand_personality" jsonb,
	"content_examples" jsonb,
	"analysis_results" jsonb,
	"training_status" text DEFAULT 'draft' NOT NULL,
	"is_active" boolean DEFAULT true,
	"training_progress" integer DEFAULT 0,
	"model_version" text,
	"last_training_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "replier_brand_voice_generations" ADD CONSTRAINT "replier_brand_voice_generations_user_id_replier_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."replier_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "replier_brand_voice_generations" ADD CONSTRAINT "replier_brand_voice_generations_brand_voice_id_replier_brand_voices_id_fk" FOREIGN KEY ("brand_voice_id") REFERENCES "public"."replier_brand_voices"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "replier_brand_voice_training_data" ADD CONSTRAINT "replier_brand_voice_training_data_brand_voice_id_replier_brand_voices_id_fk" FOREIGN KEY ("brand_voice_id") REFERENCES "public"."replier_brand_voices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "replier_brand_voices" ADD CONSTRAINT "replier_brand_voices_user_id_replier_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."replier_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generations_user_id_idx" ON "replier_brand_voice_generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generations_brand_voice_id_idx" ON "replier_brand_voice_generations" USING btree ("brand_voice_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generations_content_type_idx" ON "replier_brand_voice_generations" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generations_created_at_idx" ON "replier_brand_voice_generations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_data_brand_voice_id_idx" ON "replier_brand_voice_training_data" USING btree ("brand_voice_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_data_content_type_idx" ON "replier_brand_voice_training_data" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "training_data_processed_idx" ON "replier_brand_voice_training_data" USING btree ("is_processed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_voices_user_id_idx" ON "replier_brand_voices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_voices_name_idx" ON "replier_brand_voices" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_voices_status_idx" ON "replier_brand_voices" USING btree ("training_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_voices_active_idx" ON "replier_brand_voices" USING btree ("is_active");