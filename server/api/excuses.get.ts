import { getDb } from '../utils/mongodb'

export default defineEventHandler(async () => {
  const db = await getDb()

  return await db
    .collection('excuses')
    .find({})
    .sort({ label: 1 })
    .toArray()
})