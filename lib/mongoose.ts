import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not set');
}

const DB_NAME = process.env.MONGODB_DB_NAME || 'emailsignature';

type GlobalMongoose = typeof globalThis & {
  mongooseConn?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const g = globalThis as GlobalMongoose;

if (!g.mongooseConn) {
  g.mongooseConn = { conn: null, promise: null };
}

export async function connectMongoose(): Promise<typeof mongoose> {
  if (g.mongooseConn!.conn) return g.mongooseConn!.conn;
  if (!g.mongooseConn!.promise) {
    g.mongooseConn!.promise = mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
    });
  }
  g.mongooseConn!.conn = await g.mongooseConn!.promise;
  return g.mongooseConn!.conn;
}

export function getMongoDb() {
  return mongoose.connection.getClient().db(mongoose.connection.db!.databaseName);
}

export function getMongoClient() {
  return mongoose.connection.getClient();
}
