import { getDb } from '../utils/mongodb'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (body.adminPassword !== config.adminPassword) {
    throw createError({
      statusCode: 401
    })
  }

  const db = await getDb()

  await db.collection('activityTypes').insertOne({
    label: body.label,
    value: slugify(body.label),
    createdAt: new Date()
  })

  return { success: true }
})