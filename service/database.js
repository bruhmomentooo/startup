const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

let _client = null;

async function connectDB() {
  // Prefer explicit MONGODB_URI env var
  const envUri = process.env.MONGODB_URI;
  let uri = envUri;
  let dbName = process.env.MONGODB_DBNAME || null;

  if (!uri) {
    // Try local dbConfig.json if present (private to service folder)
    const cfgPath = path.join(__dirname, 'dbConfig.json');
    if (fs.existsSync(cfgPath)) {
      try {
        const cfg = require(cfgPath);
        if (cfg && cfg.userName && cfg.password && cfg.hostname) {
          // build a connection string (supports mongodb+srv)
          uri = `mongodb+srv://${cfg.userName}:${cfg.password}@${cfg.hostname}`;
          dbName = dbName || cfg.dbName || null;
        }
      } catch (e) {
        console.error('Failed to parse dbConfig.json', e);
      }
    }
  }

  if (!uri) {
    console.log('No MongoDB configuration found (MONGODB_URI or dbConfig.json). Skipping DB connection.');
    return null;
  }

  try {
    _client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await _client.connect();
    const resolvedDbName = dbName || (process.env.MONGODB_DBNAME || undefined) || undefined;
    const db = resolvedDbName ? _client.db(resolvedDbName) : _client.db();
    console.log('Connected to MongoDB');
    return db;
  } catch (ex) {
    console.error('Unable to connect to MongoDB', ex);
    return null;
  }
}

async function close() {
  if (_client) await _client.close();
}

module.exports = { connectDB, close };