// server/api/incidents.get.ts
import { getDb } from '../utils/mongodb'

export default defineEventHandler(async () => {
  const db = await getDb()

  return await db
    .collection('incidents')
    .find({})
    .sort({ date: -1 })
    .toArray()
})