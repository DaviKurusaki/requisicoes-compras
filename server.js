const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// BANCO DE DADOS
// =========================
const db = new Database("database.db");

// middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =========================
// CRIA TABELAS SE NÃO EXISTIREM
// =========================
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS requisicoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT,
  descricao TEXT,
  status TEXT,
  data TEXT
)
`).run();

// =========================
// USUÁRIO PADRÃO
// login: admin
// senha: 123
// =========================
db.prepare(`
INSERT OR IGNORE INTO users (id, username, password)
VALUES (1, 'admin', '123')
`).run();

// =========================
// LOGIN
// =========================
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare(
    "SELECT * FROM users WHERE username = ? AND password = ?"
  ).get(username, password);

  if (user) res.json({ success: true });
  else res.json({ success: false });
});

// =========================
// CRUD REQUISIÇÕES
// =========================

// CREATE – criar requisição
app.post("/requisicoes", (req, res) => {
  const { usuario, descricao } = req.body;
  const data = new Date().toLocaleString();

  const stmt = db.prepare(`
    INSERT INTO requisicoes (usuario, descricao, status, data)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(usuario, descricao, "Pendente", data);

  res.json({ id: result.lastInsertRowid });
});

// READ – listar todas
app.get("/requisicoes", (req, res) => {
  const rows = db.prepare(
    "SELECT * FROM requisicoes ORDER BY id DESC"
  ).all();
  res.json(rows);
});

// READ – buscar por ID
app.get("/requisicoes/:id", (req, res) => {
  const row = db.prepare(
    "SELECT * FROM requisicoes WHERE id = ?"
  ).get(req.params.id);
  res.json(row);
});

// UPDATE – editar descrição
app.put("/requisicoes/:id", (req, res) => {
  const { descricao } = req.body;
  db.prepare(
    "UPDATE requisicoes SET descricao = ? WHERE id = ?"
  ).run(descricao, req.params.id);

  res.json({ updated: true });
});

// UPDATE – alterar status
app.put("/requisicoes/:id/status", (req, res) => {
  const { status } = req.body;
  db.prepare(
    "UPDATE requisicoes SET status = ? WHERE id = ?"
  ).run(status, req.params.id);

  res.json({ statusUpdated: true });
});

// DELETE – excluir requisição
app.delete("/requisicoes/:id", (req, res) => {
  db.prepare(
    "DELETE FROM requisicoes WHERE id = ?"
  ).run(req.params.id);

  res.json({ deleted: true });
});

// =========================
// START SERVIDOR
// =========================
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
