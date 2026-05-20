// server/api/incidents.post.ts
import { getDb } from '../utils/mongodb'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const body = await readBody(event)

  if (body.adminPassword !== config.adminPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Forkert kodeord'
    })
  }

  const incident = {
    title: body.title || null,

    activityType: body.activityType,

    status: body.status,

    date: new Date(body.date),

    delayMinutes:
      body.status === 'late'
        ? Number(body.delayMinutes)
        : null,

    cancelledNoticeMinutes:
      body.status === 'cancelled'
        ? Number(body.cancelledNoticeMinutes)
        : null,

    excuses: body.excuses || [],

    severity: Number(body.severity),

    note: body.note || null,

    reportedBy: body.reportedBy,

    createdAt: new Date()
  }

  const db = await getDb()

  await db
    .collection('incidents')
    .insertOne(incident)

  return {
    success: true
  }
})