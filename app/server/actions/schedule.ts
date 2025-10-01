"use server"

import { scheduleEventSchema } from "@/app/schema/schedule"
import { db } from "@/drizzle/db"
import { ScheduleAvailabilityTable, ScheduleTable } from "@/drizzle/schema"
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { BatchItem } from "drizzle-orm/batch"
import { revalidatePath } from "next/cache"
import z from "zod"

type ScheduleRow = typeof ScheduleTable.$inferSelect
type AvailabilityRow = typeof ScheduleAvailabilityTable.$inferSelect

export type fullSchedule = ScheduleRow & {
    avalablities: AvailabilityRow[]
}

export async function getSchedule(userId: string): Promise<fullSchedule> {
    const schedule = await db.query.ScheduleTable.findFirst({
        where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
        with: {
            availabilities: true,
        }
    })
    // if (!schedule) {
    //     throw new Error("No schedule found for this user")
    // }
    return schedule as fullSchedule
}

export async function saveSchedule(unsafeData: z.infer<typeof scheduleEventSchema>) {
    try {
        const { userId } = await auth()
        const { success, data } = scheduleEventSchema.safeParse(unsafeData)

        // If validation fails or no user is authenticated, throw an error
        if (!success || !userId) {
            throw new Error("Invalid schedule data or user not authenticated.")
        }
        const { availabilities, ...scheduleData } = data
        const [{ id: scheduleId }] = await db
            .insert(ScheduleTable)
            .values({ ...scheduleData, clerkUserId: userId })
            .onConflictDoUpdate({
                target: ScheduleTable.clerkUserId,
                set: scheduleData
            })
            .returning({ id: ScheduleTable.id })

        const statement: [BatchItem<"pg">] = [
            db.delete(ScheduleAvailabilityTable)
                .where(eq(ScheduleAvailabilityTable.scheduleId, scheduleId))
        ]
        if (availabilities.length > 0) {
            statement.push(
                db.insert(ScheduleAvailabilityTable).values(
                    availabilities.map(availability => ({
                        ...availability,
                        scheduleId, // Link availability to the saved schedule
                    }))
                )
            )
        }

        await db.batch(statement)

    } catch (error: any) {
        // Catch and throw an error with a readable message
        throw new Error(`Failed to save schedule: ${error.message || error}`)
    } finally {
        // Revalidate the /schedule path to update the cache and reflect the new data
        revalidatePath('/schedule')

    }
}