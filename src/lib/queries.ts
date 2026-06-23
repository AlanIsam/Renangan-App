import { prisma } from "@/lib/db"
import type { Activity } from "@/lib/activity-utils"

export function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function loadActivities(): Promise<Activity[]> {
  const rows = await prisma.activity.findMany({
    orderBy: { date: "desc" },
  })

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    name: r.name,
    type: r.type,
    elapsedTime: r.elapsedTime,
    movingTime: r.movingTime,
    distance: r.distance,
    maxHeartRate: r.maxHeartRate,
    avgHeartRate: r.avgHeartRate,
    calories: r.calories,
    avgSpeed: r.avgSpeed,
    poolLength: r.poolLength,
  }))
}

export async function loadSwimActivities(): Promise<Activity[]> {
  const rows = await prisma.activity.findMany({
    where: { type: "Swim" },
    orderBy: { date: "desc" },
  })

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    name: r.name,
    type: r.type,
    elapsedTime: r.elapsedTime,
    movingTime: r.movingTime,
    distance: r.distance,
    maxHeartRate: r.maxHeartRate,
    avgHeartRate: r.avgHeartRate,
    calories: r.calories,
    avgSpeed: r.avgSpeed,
    poolLength: r.poolLength,
  }))
}

export type WorkoutWithExercises = {
  id: string
  date: Date
  name: string
  duration: number | null
  notes: string | null
  exercises: {
    id: string
    name: string
    category: string
    sets: number
    reps: number | null
    weight: number | null
    duration: number | null
    orderIdx: number
  }[]
}

export async function loadWorkouts(): Promise<WorkoutWithExercises[]> {
  return prisma.workout.findMany({
    orderBy: { date: "desc" },
    include: {
      exercises: { orderBy: { orderIdx: "asc" } },
    },
  })
}

export async function createWorkout(data: {
  date: Date
  name: string
  duration?: number | null
  notes?: string | null
  exercises: {
    name: string
    category: string
    sets: number
    reps?: number | null
    weight?: number | null
    duration?: number | null
  }[]
}) {
  return prisma.workout.create({
    data: {
      date: data.date,
      name: data.name,
      duration: data.duration ?? null,
      notes: data.notes ?? null,
      exercises: {
        create: data.exercises.map((ex, i) => ({
          name: ex.name,
          category: ex.category,
          sets: ex.sets,
          reps: ex.reps ?? null,
          weight: ex.weight ?? null,
          duration: ex.duration ?? null,
          orderIdx: i,
        })),
      },
    },
    include: { exercises: true },
  })
}

export type PlanWithDays = {
  id: string
  name: string
  weekStart: Date
  active: boolean
  summary: string | null
  createdAt: Date
  days: {
    id: string
    dayOfWeek: number
    type: string
    focus: string
    notes: string | null
    items: {
      id: string
      name: string
      detail: string | null
      tag: string | null
      orderIdx: number
    }[]
  }[]
}

const planInclude = {
  days: {
    orderBy: { dayOfWeek: "asc" as const },
    include: { items: { orderBy: { orderIdx: "asc" as const } } },
  },
}

export async function getCurrentWeekPlan(): Promise<PlanWithDays | null> {
  const monday = getMonday(new Date())
  return prisma.plan.findFirst({
    where: { weekStart: monday },
    include: planInclude,
  })
}

export async function getAllPlans(): Promise<PlanWithDays[]> {
  return prisma.plan.findMany({
    orderBy: { weekStart: "desc" },
    include: planInclude,
  })
}

export async function savePlan(data: {
  name: string
  weekStart: Date
  summary?: string | null
  days: {
    dayOfWeek: number
    type: string
    focus: string
    notes?: string | null
    items: { name: string; detail?: string | null; tag?: string | null }[]
  }[]
}) {
  const existing = await prisma.plan.findFirst({ where: { weekStart: data.weekStart } })
  if (existing) {
    await prisma.plan.delete({ where: { id: existing.id } })
  }

  return prisma.plan.create({
    data: {
      name: data.name,
      weekStart: data.weekStart,
      summary: data.summary ?? null,
      active: true,
      days: {
        create: data.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          type: day.type,
          focus: day.focus,
          notes: day.notes ?? null,
          items: {
            create: day.items.map((item, i) => ({
              name: item.name,
              detail: item.detail ?? null,
              tag: item.tag ?? null,
              orderIdx: i,
            })),
          },
        })),
      },
    },
    include: planInclude,
  })
}

export async function deletePlan(id: string) {
  return prisma.plan.delete({ where: { id } })
}

export async function getPlanForWeek(weekStart: Date): Promise<PlanWithDays | null> {
  return prisma.plan.findFirst({
    where: { weekStart },
    include: planInclude,
  })
}

export async function deleteWorkout(id: string) {
  return prisma.workout.delete({ where: { id } })
}

export async function deleteActivity(id: string) {
  return prisma.activity.delete({ where: { id } })
}

export async function updateActivity(id: string, data: {
  date: Date
  name: string
  distance: number
  movingTime: number
  avgHeartRate?: number | null
  poolLength?: number | null
}) {
  return prisma.activity.update({
    where: { id },
    data: {
      ...data,
      elapsedTime: data.movingTime,
    },
  })
}

export async function updateWorkout(id: string, data: {
  date: Date
  name: string
  duration?: number | null
  notes?: string | null
  exercises: {
    name: string
    category: string
    sets: number
    reps?: number | null
    weight?: number | null
    duration?: number | null
  }[]
}) {
  await prisma.exercise.deleteMany({ where: { workoutId: id } })

  return prisma.workout.update({
    where: { id },
    data: {
      date: data.date,
      name: data.name,
      duration: data.duration ?? null,
      notes: data.notes ?? null,
      exercises: {
        create: data.exercises.map((ex, i) => ({
          name: ex.name,
          category: ex.category,
          sets: ex.sets,
          reps: ex.reps ?? null,
          weight: ex.weight ?? null,
          duration: ex.duration ?? null,
          orderIdx: i,
        })),
      },
    },
    include: { exercises: true },
  })
}

export async function createActivity(data: {
  date: Date
  name: string
  type: string
  distance: number
  movingTime: number
  avgHeartRate?: number | null
  maxHeartRate?: number | null
  calories?: number | null
  poolLength?: number | null
}) {
  return prisma.activity.create({
    data: {
      ...data,
      elapsedTime: data.movingTime,
      source: "manual",
    },
  })
}
