import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`
  CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    content TEXT NOT NULL
  );
`);

app.get("/api/health", async (_req, res) => {
  const r = await pool.query("SELECT 1 AS ok");
  res.json({ ok: true, db: r.rows[0].ok === 1 });
});

app.get("/api/notes", async (_req, res) => {
  const r = await pool.query("SELECT id, created_at, title, content FROM notes ORDER BY id DESC LIMIT 100");
  res.json(r.rows);
});

app.post("/api/notes", async (req, res) => {
  const { title, content } = req.body ?? {};
  if (!title || !content) return res.status(400).json({ error: "title and content required" });
  const r = await pool.query(
    "INSERT INTO notes(title, content) VALUES($1,$2) RETURNING id, created_at, title, content",
    [title, content]
  );
  res.status(201).json(r.rows[0]);
});

app.listen(PORT, () => console.log(`API listening on :${PORT}`));
