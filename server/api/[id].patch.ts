import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/mongodb'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const id = getRouterParam(event, 'id')

  if (body.adminPassword !== config.adminPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Forkert kodeord'
    })
  }

  const change = body.change === -1 ? -1 : 1
  const db = await getDb()

  await db.collection('quotes').updateOne(
    { _id: new ObjectId(id) },
    {
      $inc: {
        count: change
      }
    }
  )

  return { success: true }
})
