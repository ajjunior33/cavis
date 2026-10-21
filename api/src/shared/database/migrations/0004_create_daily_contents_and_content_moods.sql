CREATE TABLE "content_moods" (
	"content_id" uuid NOT NULL,
	"mood_id" uuid NOT NULL,
	CONSTRAINT "content_moods_content_id_mood_id_pk" PRIMARY KEY("content_id","mood_id")
);
--> statement-breakpoint
CREATE TABLE "daily_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"reflection" text NOT NULL,
	"practice" text NOT NULL,
	"duration_min" integer,
	"is_demo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_moods" ADD CONSTRAINT "content_moods_content_id_daily_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."daily_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_moods" ADD CONSTRAINT "content_moods_mood_id_moods_id_fk" FOREIGN KEY ("mood_id") REFERENCES "public"."moods"("id") ON DELETE cascade ON UPDATE no action;