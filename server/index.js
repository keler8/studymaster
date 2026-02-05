import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS authorized_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      name TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS subjects_owner_idx ON subjects(owner_id);`);

  // Seed default admin
  const adminId = "admin-001";
  const adminEmail = "dgutierrez@gecoas.com";
  const adminPass = "Access2024";
  const adminName = "Daniel Gutiérrez";

  await pool.query(
    `INSERT INTO authorized_users(id, email, password, is_admin, name)
     VALUES ($1,$2,$3,TRUE,$4)
     ON CONFLICT (email) DO NOTHING`,
    [adminId, adminEmail, adminPass, adminName]
  );
}

await init();

app.get("/api/health", async (_req, res) => {
  const r = await pool.query("SELECT 1 AS ok");
  res.json({ ok: true, db: r.rows[0].ok === 1 });
});

// Authorized users CRUD (replace-all semantics)
app.get("/api/users", async (_req, res) => {
  const r = await pool.query(
    'SELECT id, email, password, is_admin AS "isAdmin", name FROM authorized_users ORDER BY email ASC'
  );
  res.json(r.rows);
});

app.put("/api/users", async (req, res) => {
  const users = req.body;
  if (!Array.isArray(users)) return res.status(400).json({ error: "Expected array of users" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM authorized_users");
    for (const u of users) {
      await client.query(
        `INSERT INTO authorized_users(id, email, password, is_admin, name)
         VALUES ($1,$2,$3,$4,$5)`,
        [u.id, u.email, u.password ?? null, !!u.isAdmin, u.name ?? null]
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to save users" });
  } finally {
    client.release();
  }
});

// Subjects CRUD (store whole subject JSON in data)
app.get("/api/subjects", async (req, res) => {
  const ownerId = req.query.ownerId;
  if (!ownerId || typeof ownerId !== "string") return res.status(400).json({ error: "ownerId required" });

  const r = await pool.query(
    "SELECT data FROM subjects WHERE owner_id=$1 ORDER BY updated_at DESC",
    [ownerId]
  );
  res.json(r.rows.map(row => row.data));
});

app.post("/api/subjects", async (req, res) => {
  const subject = req.body;
  if (!subject?.id || !subject?.ownerId) return res.status(400).json({ error: "Subject must include id and ownerId" });

  await pool.query(
    `INSERT INTO subjects(id, owner_id, data)
     VALUES($1,$2,$3)
     ON CONFLICT (id) DO UPDATE SET owner_id=EXCLUDED.owner_id, data=EXCLUDED.data, updated_at=now()`,
    [subject.id, subject.ownerId, subject]
  );
  res.status(201).json({ ok: true });
});

app.put("/api/subjects/:id", async (req, res) => {
  const id = req.params.id;
  const subject = req.body;
  if (!subject?.ownerId) return res.status(400).json({ error: "Subject must include ownerId" });

  await pool.query(
    `UPDATE subjects SET owner_id=$2, data=$3, updated_at=now() WHERE id=$1`,
    [id, subject.ownerId, subject]
  );
  res.json({ ok: true });
});

app.delete("/api/subjects/:id", async (req, res) => {
  const id = req.params.id;
  await pool.query("DELETE FROM subjects WHERE id=$1", [id]);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`API listening on :${PORT}`));
