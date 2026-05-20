import { getDb } from '../utils/mongodb'

export default defineEventHandler(async () => {
  const db = await getDb()

  return await db
    .collection('activityTypes')
    .find({})
    .sort({ label: 1 })
    .toArray()
})