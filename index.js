const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const db = new Database('notes.db');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    user_id INTEGER
  )
`);

// ---- AUTH ROUTES ----

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, passwordHash);

  res.status(201).json({ id: result.lastInsertRowid, email });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// ---- AUTH MIDDLEWARE ----
// this function runs BEFORE any protected route, checking for a valid token
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization; // expects "Bearer <token>"
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId; // attach userId to the request for later routes to use
    next(); // move on to the actual route
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ---- NOTES ROUTES (all protected, all scoped to req.userId) ----

app.post('/notes', requireAuth, (req, res) => {
  const stmt = db.prepare('INSERT INTO notes (title, content, user_id) VALUES (?, ?, ?)');
  const result = stmt.run(req.body.title, req.body.content, req.userId);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(note);
});

app.get('/notes', requireAuth, (req, res) => {
  const notes = db.prepare('SELECT * FROM notes WHERE user_id = ?').all(req.userId);
  res.json(notes);
});

app.get('/notes/:id', requireAuth, (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

app.put('/notes/:id', requireAuth, (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  const title = req.body.title ?? note.title;
  const content = req.body.content ?? note.content;
  db.prepare('UPDATE notes SET title = ?, content = ? WHERE id = ?').run(title, content, req.params.id);
  const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.delete('/notes/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Note not found' });
  res.status(204).send();
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
