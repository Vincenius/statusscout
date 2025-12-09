import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

let db;

export async function connectDB() {
  if (db) return db;

  try {
    await client.connect();
    db = client.db('status-check');
    return db;
  } catch (error) {
    console.error('Connection error:', error);
  }
}

export async function disconnectDB() {
  try {
    await client.close();
  } catch (error) {
    console.error('Disconnection error:', error);
  }
}

export { db };
