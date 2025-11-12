"use server"

import { eventFormSchema } from "@/app/schema/events"
// import { eventFormSchema } from "@/app/schema/Events"
import { db } from "@/drizzle/db"
import { EventsTable } from "@/drizzle/schema"
import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function createEvent(

    unsafeData: z.infer<typeof eventFormSchema>

):
    Promise<void> {
    try {
        const { userId } = await auth()
        const { success, data } = eventFormSchema.safeParse(unsafeData)
        if (!success || !userId) {
            throw new Error("Invalid event data or user not authenticated.")
        }

        await db.insert(EventsTable).values({ ...data, clerkUserId: userId })

    } catch (error: any) {
        throw new Error(`Failed to create event: ${error.message || error}`)
    }
    finally {
        revalidatePath('/events')

    }
}

export async function updateEvent(
    id: string,
    unsafeData: z.infer<typeof eventFormSchema>
): Promise<void> {
    try {
        const { userId } = await auth()

        const { success, data } = eventFormSchema.safeParse(unsafeData)

        if (!success || !userId) {
            throw new Error("Invalid event data or user not authenticated.")
        }

        const { rowCount } = await db.update(EventsTable).set({ ...data })
            .where(and(eq(EventsTable.id, id), eq(EventsTable.clerkUserId, userId)))

        if (rowCount === 0) {
            throw new Error("Event not found or user not authorized to update this event.")
        }
    }
    catch (error: any) {

        throw new Error(`Failed to update event: ${error.message || error}`)
    } finally {
        revalidatePath('/events')
    }
}

type EventRow = typeof EventsTable.$inferSelect

export async function deleteEvent(
    id: string,
): Promise<void> {
    try {
        const { userId } = await auth()

        if (!userId) {
            throw new Error("User not authenticated.")
        }
        const { rowCount } = await db
            .delete(EventsTable)
            .where(and(eq(EventsTable.id, id), eq(EventsTable.clerkUserId, userId)))
        if (rowCount === 0) {
            throw new Error("Event not found or user not authorized to delete this event.")
        }
    }
    catch (error: any) {

        throw new Error(`Failed to delete event: ${error.message || error}`)
    } finally {
        revalidatePath('/events')
    }
}

export async function getEvent(userId: string, eventId: string): Promise<EventRow | undefined> {
    const event = await db.query.EventsTable.findFirst({
        where: ({ id, clerkUserId }, { and, eq }) =>
            and(eq(clerkUserId, userId), eq(id, eventId))
    })
    return event ?? undefined
}


export async function getEvents(clerkUserId: string): Promise<EventRow[]> {
    const events = await db.query.EventsTable.findMany({
        where: ({ clerkUserId: userIdCol }, { eq }) => eq(userIdCol, clerkUserId),
        orderBy: ({ name }, { asc, sql }) => asc(sql`lower(${name})`),
    })

    // Return the full list of events
    return events

}

export type PublicEvent = Omit<EventRow, "isActive"> & { isActive: true }

export async function getPublicEvents(clerkUserId: string): Promise<PublicEvent[]> {
    const events = await db.query.EventsTable.findMany({
        where: ({ clerkUserId: userIdCol, isActive }, { eq, and }) =>
            and(eq(userIdCol, clerkUserId), eq(isActive, true)),
        orderBy: ({ name }, { asc, sql }) => asc(sql`lower(${name})`)
    })
    return events as PublicEvent[]
}