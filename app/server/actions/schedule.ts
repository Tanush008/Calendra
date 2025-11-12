"use server"

import { scheduleEventSchema } from "@/app/schema/schedule"
import { db } from "@/drizzle/db"
import { ScheduleAvailabilityTable, ScheduleTable } from "@/drizzle/schema"
import { auth } from "@clerk/nextjs/server"
import { addMinutes, areIntervalsOverlapping, isFriday, isMonday, isSaturday, isSunday, isThursday, isTuesday, isWednesday, isWithinInterval, setHours, setMinutes } from "date-fns"
import { eq } from "drizzle-orm"
import { BatchItem } from "drizzle-orm/batch"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCalenderEvents } from "../google/googleCalender"
import { DAYS_OF_WEEK_IN_ORDER } from "@/constants"
import { fromZonedTime } from "date-fns-tz"

type ScheduleRow = typeof ScheduleTable.$inferSelect
type AvailabilityRow = typeof ScheduleAvailabilityTable.$inferSelect

export type fullSchedule = ScheduleRow & {
    availabilities: AvailabilityRow[]
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
        const { availabilites, ...scheduleData } = data as z.infer<typeof scheduleEventSchema>
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
        if (availabilites.length > 0) {
            statement.push(
                db.insert(ScheduleAvailabilityTable).values(
                    availabilites.map(availability => ({
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

export async function getVaidTimeSch(
    timesInOrder: Date[],
    event: { clerkUserId: string, durationInMinutes: number }
): Promise<Date[]> {
    const { clerkUserId: userId, durationInMinutes } = event

    // Define the start and end of the overall range to check
    const start = timesInOrder[0]
    const end = timesInOrder.at(-1)

    // If start or end is missing, there are no times to check
    if (!start || !end) return []

    // Fetch the user's saved schedule along with their availabilities
    const schedule = await getSchedule(userId)

    // If no schedule is found, return an empty list (user has no availabilities)
    if (schedule == null) return []

    // Group availabilities by day of the week (e.g., Monday, Tuesday)
    const groupedAvailabilities = Object.groupBy(
        schedule.availabilities,
        a => a.dayOfWeek
    )

    // Fetch all existing Google Calendar events between start and end
    const eventTimes = await getCalenderEvents(userId, {
        start,
        end,
    })

    // Filter and return only valid time slots based on availability and conflicts
    return timesInOrder.filter(intervalDate => {
        // Get the user's availabilities for the specific day, adjusted to their timezone
        const availabilities = getAvailabilities(
            groupedAvailabilities,
            intervalDate,
            schedule.timezone
        )


        // Define the time range for a potential event starting at this interval
        const eventInterval = {
            start: intervalDate, // Proposed start time
            end: addMinutes(intervalDate, durationInMinutes), // Proposed end time (start + duration)
        }

        // Keep only the time slots that satisfy two conditions:
        return (
            // 1. This time slot does not overlap with any existing calendar events
            eventTimes.every(eventTime => {
                return !areIntervalsOverlapping(eventTime, eventInterval)
            }) &&
            // 2. The entire proposed event fits within at least one availability window
            availabilities.some(availability => {
                return (
                    isWithinInterval(eventInterval.start, availability) && // Start is inside availability
                    isWithinInterval(eventInterval.end, availability) // End is inside availability
                )
            })
        )
    })
}


function getAvailabilities(
    groupedAvailabilities: Partial<Record<(typeof DAYS_OF_WEEK_IN_ORDER)[number], (typeof ScheduleAvailabilityTable.$inferSelect)[]>>,
    date: Date,
    timezone: string): { start: Date; end: Date }[] {
    const dayOfWeek = (() => {
        if (isMonday(date)) return "monday"
        if (isTuesday(date)) return "tuesday"
        if (isWednesday(date)) return "wednesday"
        if (isThursday(date)) return "thursday"
        if (isFriday(date)) return "friday"
        if (isSaturday(date)) return "saturday"
        if (isSunday(date)) return "sunday"
        return null // If the date doesn't match any day (highly unlikely), return null
    })()
    if (!dayOfWeek) return []

    const dayAvailabilities = groupedAvailabilities[dayOfWeek]

    if (!dayAvailabilities) return []

    return dayAvailabilities.map(({ startTime, endTime }) => {
        // Parse startTime (e.g., "09:30") into hours and minutes
        const [startHour, startMinute] = startTime.split(":").map(Number)
        // Parse endTime (e.g., "17:00") into hours and minutes
        const [endHour, endMinute] = endTime.split(":").map(Number)
        // Create a start Date object set to the correct hour and minute, then convert it to the given timezone
        const start = fromZonedTime(
            setMinutes(setHours(date, startHour), startMinute),
            timezone
        )

        // Create an end Date object set to the correct hour and minute, then convert it to the given timezone
        const end = fromZonedTime(
            setMinutes(setHours(date, endHour), endMinute),
            timezone
        )

        // Return the availability interval
        return { start, end }
    })
}