import { getDb } from '../utils/mongodb'

export default defineEventHandler(async () => {
  const db = await getDb()

  return await db
    .collection('quotes')
    .find({})
    .sort({ count: -1 })
    .toArray()
})
