import { DAYS_OF_WEEK_IN_ORDER } from "@/constants";
import { relations } from "drizzle-orm";
// import { boolean, duration, index, integer, text, timestamp, uuid } from "drizzle-orm/gel-core";
import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const createdAt = timestamp("createdAt").notNull().defaultNow()

const updatedAt = timestamp("updatedAt").notNull().defaultNow()
    .$onUpdate(() => new Date())
export const EventsTable = pgTable(
    "events",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        description: text("description"),
        durationInMinutes: integer("durationInMinutes").notNull(),
        clerkUserId: text("clerkUserId").notNull(),
        isActive: boolean("isActive").notNull().default(true),
        createdAt,
        updatedAt,
    },
    table => ([
        index("clerkUserIdIndex").on(table.clerkUserId),
    ])
)

export const ScheduleTable = pgTable("schedules", {
    id: uuid("id").primaryKey().defaultRandom(),
    timezone: text("timezone").notNull(),
    clerkUserId: text("clerkUserId").notNull().unique(),
    createdAt,
    updatedAt
})

export const scheduleRelation = relations(ScheduleTable, ({ many }) => ({
    availabilities: many(ScheduleAvailabilityTable)
}))


export const scheduleOfWeek = pgEnum("day", DAYS_OF_WEEK_IN_ORDER)

export const ScheduleAvailabilityTable = pgTable("scheduleAvailabilities", {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("scheduleId").notNull().references(() => ScheduleTable.id, { onDelete: "cascade" }),
    startTime: text("startTime").notNull(),
    endTime: text("endTime").notNull(),
    dayOfWeek: scheduleOfWeek("dayOfWeek").notNull(),
},
    table => ([
        index("scheduleIndex").on(table.scheduleId)
    ])
)

export const scheduleAvailableRelation = relations(ScheduleAvailabilityTable, ({ one }) => ({
    schedule: one(ScheduleTable, {
        fields: [ScheduleAvailabilityTable.scheduleId],
        references: [ScheduleTable.id],
    }),
})
)

