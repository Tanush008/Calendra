import { DAYS_OF_WEEK_IN_ORDER } from "@/constants";
import { timeToFloat } from "@/lib/utils";
import { z } from "zod";

export const scheduleEventSchema = z.object({
    timezone: z.string().min(1, "Required"),
    availabilites: z
        .array(
            z.object({
                dayOfWeek: z.enum(DAYS_OF_WEEK_IN_ORDER),
                startTime: z.string()
                    .regex(
                        /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, // Regex pattern to match the time format
                        "Time must be in the format HH:MM" // Custom error message if the time doesn't match the pattern

                        // ✅ Valid Examples:
                        // 00:00

                        // 09:15

                        // 14:30

                        // 23:59

                        // ❌ Invalid Examples:
                        // 9:15 (hour must be two digits)

                        // 24:00 (24 is not valid in 24-hour format)

                        // 12:60 (minutes can't be 60)

                        // 03:5 (minutes must be two digits)
                    ),
                endTime: z // 'endTime' follows the same validation as 'startTime'
                    .string()
                    .regex(
                        /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, // Regex pattern to match the time format
                        "Time must be in the format HH:MM" // Custom error message
                    ),
            })
        )
        .superRefine((availabilites, ctx) => {
            availabilites.forEach((availability, index) => {
                const overlap = availabilites.some((a, i) => {
                    return (
                        i !== index && a.dayOfWeek === availability.dayOfWeek &&
                        timeToFloat(a.startTime) < timeToFloat(availability.endTime) &&
                        timeToFloat(a.endTime) > timeToFloat(availability.startTime)
                    )
                })
                if (overlap) {
                    ctx.addIssue({
                        code: "custom", // Custom validation error code
                        message: "Availability overlaps with another", // Custom error message
                        path: [index, "startTime"],
                    })
                }
                if (
                    timeToFloat(availability.startTime) >= timeToFloat(availability.endTime) // Check if start time is greater than or equal to end time
                ) {
                    ctx.addIssue({
                        code: "custom", // Custom validation error code
                        message: "End time must be after start time", // Custom error message
                        path: [index, "endTime"], // ⬅️ This attaches error to endTime field
                    })
                }
            })
        })
})