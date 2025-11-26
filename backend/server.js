// server.js
import express from "express";
import fs from "fs";
import cors from "cors";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// 🔥 CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

/* ============================================================
   🔹 CONFIGURAÇÃO DO BANCO (Railway ou Local)
============================================================ */

const usandoRailway =
  !!process.env.MYSQLHOST && process.env.MYSQLHOST !== "localhost";

const dbConfigProd = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT) || 3306,
  ssl: { rejectUnauthorized: false },
};

const dbConfigLocal = {
  host: "localhost",
  user: "root",
  password: "vinicius",
  database: "dependencia_internet",
  port: 3306,
};

const db = mysql.createConnection(usandoRailway ? dbConfigProd : dbConfigLocal);

db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao MySQL:", err);
  } else {
    console.log(
      "✅ Conectado ao MySQL!",
      usandoRailway ? "(Railway)" : "(Local)"
    );
  }
});

/* ============================================================
   🔹 CONFIG FRONTEND (SERVIR ARQUIVOS ESTÁTICOS)
============================================================ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 SERVIR A PASTA "front"
app.use(express.static(path.join(__dirname, "front")));

// 👉 QUANDO ACESSAR "/", ENTREGAR index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "front", "index.html"));
});

/* ============================================================
   🔹 ARQUIVO JSON (dashboard)
============================================================ */

const caminhoArquivo = path.join(__dirname, "respostas.json");

/* ============================================================
   🔹 FUNÇÃO DE CÁLCULO
============================================================ */

function calcularPontuacao(respostas) {
  const valores = {
    Nunca: 1,
    Raramente: 2,
    "Às vezes": 3,
    Frequentemente: 4,
    Sempre: 5,
    Sim: 5,
    Não: 1,
    Talvez: 3,
    "1 a 2 horas": 3,
    "3 a 5 horas": 4,
    "Mais de 6 horas": 5,
    "Não consigo ficar mais de 30 minutos sem acessar": 5,
    "Não tenho problema em permanecer longe": 1,
  };

  let pontuacao = 0;
  const respostasDetalhadas = {};

  for (const [pergunta, resp] of Object.entries(respostas)) {
    const texto = typeof resp === "object" ? resp.texto || resp.resposta : resp;
    const valor = valores[texto] || 0;

    respostasDetalhadas[pergunta] = { texto, valor };
    pontuacao += valor;
  }

  const max = Object.keys(respostasDetalhadas).length * 5;
  const porcentagem = Math.round((pontuacao / max) * 100);

  let classificacao =
    porcentagem <= 20
      ? "Sem dependência"
      : porcentagem <= 40
      ? "Dependência leve"
      : porcentagem <= 60
      ? "Dependência moderada"
      : porcentagem <= 80
      ? "Dependência alta"
      : "Dependência severa";

  return { respostasDetalhadas, pontuacao, porcentagem, max, classificacao };
}

/* ============================================================
   🔹 ENDPOINT QUE RECEBE AS RESPOSTAS
============================================================ */

app.post("/respostas", (req, res) => {
  const { estado, idade, genero, respostas } = req.body;

  if (!estado || !idade || !genero || !respostas) {
    return res.status(400).json({ erro: "Dados incompletos." });
  }

  const result = calcularPontuacao(respostas);

  const registro = {
    estado,
    idade,
    genero,
    ...result,
    data: new Date().toISOString(),
  };

  // ---------------- JSON ----------------
  try {
    const lista = fs.existsSync(caminhoArquivo)
      ? JSON.parse(fs.readFileSync(caminhoArquivo, "utf8"))
      : [];

    lista.push(registro);

    fs.writeFileSync(caminhoArquivo, JSON.stringify(lista, null, 2));
  } catch (err) {
    console.error("❌ Erro ao gravar JSON:", err);
  }

  // ---------------- MySQL ----------------
  const det = result.respostasDetalhadas;
  const v = (n) => det[`q${n}`]?.valor || 0;

  const sql = `
    INSERT INTO respostas
    (estado, idade, genero,
      q1_valor, q2_valor, q3_valor, q4_valor, q5_valor,
      q6_valor, q7_valor, q8_valor, q9_valor, q10_valor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const valores = [
    estado,
    idade,
    genero,
    v(1),
    v(2),
    v(3),
    v(4),
    v(5),
    v(6),
    v(7),
    v(8),
    v(9),
    v(10),
  ];

  db.query(sql, valores, (err) => {
    if (err) console.error("❌ MySQL:", err);
    else console.log("✅ Registro inserido no MySQL");
  });

  res.json({ sucesso: true });
});

/* ============================================================
   🔹 ENDPOINT DO DASHBOARD
============================================================ */

app.get("/dados", (req, res) => {
  if (!fs.existsSync(caminhoArquivo)) return res.json([]);
  const conteudo = fs.readFileSync(caminhoArquivo, "utf8");
  res.json(conteudo.trim() ? JSON.parse(conteudo) : []);
});

/* ============================================================
   🔹 INICIAR SERVIDOR
============================================================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `🚀 Servidor rodando na porta ${PORT} → ${
      usandoRailway ? "Railway" : "Local"
    }`
  );
});
