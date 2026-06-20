import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'wepower.db');
const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS communities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL, -- 'SUPERADMIN', 'ADMIN', 'CONSUMER', 'PROSUMER'
      communityId INTEGER,
      FOREIGN KEY(communityId) REFERENCES communities(id)
    );

    CREATE TABLE IF NOT EXISTS community_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      communityId INTEGER,
      month TEXT NOT NULL, -- YYYY-MM
      priceKwh REAL NOT NULL,
      FOREIGN KEY(communityId) REFERENCES communities(id)
    );

    CREATE TABLE IF NOT EXISTS monthly_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      month TEXT NOT NULL,
      consumptionKwh REAL NOT NULL,
      generationKwh REAL NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    db.exec(`
      INSERT INTO communities (name) VALUES ('Comunidad Solar Norte');
      INSERT INTO communities (name) VALUES ('Comunidad Eólica Sur');

      INSERT INTO users (username, password, role, communityId) VALUES ('superadmin', 'admin123', 'SUPERADMIN', NULL);
      INSERT INTO users (username, password, role, communityId) VALUES ('admin_norte', 'admin123', 'ADMIN', 1);
      INSERT INTO users (username, password, role, communityId) VALUES ('prosumidor1', 'user123', 'PROSUMER', 1);
      INSERT INTO users (username, password, role, communityId) VALUES ('consumidor1', 'user123', 'CONSUMER', 1);
      INSERT INTO users (username, password, role, communityId) VALUES ('consumidor2', 'user123', 'CONSUMER', 1);

      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-01', 500);
      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-02', 510);
      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-03', 505);
      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-04', 520);
      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-05', 515);
      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-06', 500);
      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-07', 490);
      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-08', 505);
      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-09', 510);
      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-10', 515);
      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-11', 525);
      INSERT INTO community_prices (communityId, month, priceKwh) VALUES (1, '2023-12', 530);
    `);

    const prosumerId = 3;
    const consumer1Id = 4;
    const consumer2Id = 5;

    const data = [
      { m: '2023-01', g: 310, c: 282 },
      { m: '2023-02', g: 332, c: 271 },
      { m: '2023-03', g: 340, c: 291 },
      { m: '2023-04', g: 350, c: 300 },
      { m: '2023-05', g: 300, c: 285 },
      { m: '2023-06', g: 292, c: 236 },
      { m: '2023-07', g: 350, c: 287 },
      { m: '2023-08', g: 329, c: 270 },
      { m: '2023-09', g: 315, c: 282 },
      { m: '2023-10', g: 330, c: 290 },
      { m: '2023-11', g: 333, c: 260 },
      { m: '2023-12', g: 345, c: 282 },
    ];

    const stmt = db.prepare('INSERT INTO monthly_data (userId, month, consumptionKwh, generationKwh) VALUES (?, ?, ?, ?)');
    
    db.transaction(() => {
      for (const row of data) {
        stmt.run(prosumerId, row.m, row.c, row.g);
        stmt.run(consumer1Id, row.m, Math.round(row.c * 1.1), 0);
        stmt.run(consumer2Id, row.m, Math.round(row.c * 0.9), 0);
      }
    })();
  }
}

export default db;
