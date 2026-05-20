// server/utils/mongodb.ts
import { MongoClient } from 'mongodb'

let client: MongoClient | null = null

export async function getDb() {
  const config = useRuntimeConfig()

  if (!config.mongodbUri) {
    throw new Error('MONGODB_URI mangler')
  }

  if (!client) {
    client = new MongoClient(config.mongodbUri)
    await client.connect()
  }

  return client.db('emil_db')
}