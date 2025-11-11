'use server'

import { meetingActionSchema } from "@/app/schema/meeting";
import { db } from "@/drizzle/db";
import { fromZonedTime } from "date-fns-tz";
import { getVaidTimeSch } from "./schedule";
import z from "zod";

export async function createMeeting(unsafeData: z.infer<typeof meetingActionSchema>
) {


    try {
        // Validate the incoming data against the schema
        const { success, data } = meetingActionSchema.safeParse(unsafeData);

        // If validation fails, throw an error
        if (!success) {
            throw new Error("Invalid data.");
        }
        const event = await db.query.EventsTable.findFirst({
            where: ({ clerkUserId, isActive, id }, { eq, and }) =>
                and(
                    eq(isActive, true), // Event must be active
                    eq(clerkUserId, data.clerkUserId), // Belonging to the right user
                    eq(id, data.eventId) // Matching the event ID
                ),
        });
        if (!event) {
            throw new Error("Event not found or inactive.");
        }
        const startTimeInZone = fromZonedTime(data.startTime, data.timezone);
        const endTime = new Date(startTimeInZone.getTime() + event.durationInMinutes * 60000); // duration in minutes to milliseconds
        const validTime = await getVaidTimeSch([startTimeInZone], event);
        if (validTime.length === 0) {
            throw new Error("Selected time is not available.");
        }
        await createCalenderEvent(
            {
                ...data,
                startTime: startTimeInZone,
                durationinMinutes: event.durationInMinutes,
                eventName: event.name,
            }
        )
        return { clerkUserId: data.clerkUserId, eventId: data.eventId, startTime: data.startTime }
    } catch (error: any) {
        // Log the error message (or handle it based on your need)
        console.error(`Error creating meeting: ${error.message || error}`);
        // Optionally throw the error to be handled further upstream
        throw new Error(`Failed to create meeting: ${error.message || error}`);
    }
}

function createCalenderEvent(arg0: { startTime: Date; durationinMinutes: number; eventName: string; eventId: string; clerkUserId: string; guestEmail: string; guestName: string; timezone: string; guestNotes?: string | undefined; }) {
    throw new Error("Function not implemented.");
}
