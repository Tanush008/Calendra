ALTER TABLE "scheduleAvailabilities" RENAME COLUMN "sceduleId" TO "scheduleId";--> statement-breakpoint
ALTER TABLE "scheduleAvailabilities" DROP CONSTRAINT "scheduleAvailabilities_sceduleId_schedules_id_fk";
--> statement-breakpoint
DROP INDEX "scheduleIndex";--> statement-breakpoint
ALTER TABLE "scheduleAvailabilities" ADD CONSTRAINT "scheduleAvailabilities_scheduleId_schedules_id_fk" FOREIGN KEY ("scheduleId") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduleIndex" ON "scheduleAvailabilities" USING btree ("scheduleId");