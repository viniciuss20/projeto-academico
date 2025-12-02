// server.js
import express from "express";
import fs from "fs";
import cors from "cors";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// 🔥 CORS CONFIGURADO PARA FUNCIONAR COM VERCEL
app.use(
  cors({
    origin: [
      "https://projeto-academico-gamma.vercel.app",
      "https://geobrasil.vercel.app",
      "https://projeto-academico-git-main-vinicius-projects-09c30c54.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Adicionar headers CORS manualmente também (garantia extra)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  // Responder OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

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
    console.error('❌ Erro ao conectar ao MySQL:', err);
  } else {
    console.log(
      '✅ Conectado ao MySQL!',
      usandoRailway ? "(Railway)" : "(Local)"
    );

    // ADICIONAR COLUNA data_registro SE NÃO EXISTIR
    db.query(`
      ALTER TABLE respostas 
      ADD COLUMN data_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    `, (err) => {
      if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('✅ Coluna data_registro já existe');
        } else {
          console.error('❌ Erro ao criar coluna:', err.message);
        }
      } else {
        console.log('✅ Coluna data_registro criada com sucesso');
      }
    });

    // VERIFICAR ESTRUTURA DA TABELA
    db.query('DESCRIBE respostas', (err, results) => {
      if (err) {
        console.error('❌ Erro ao verificar estrutura:', err);
      } else {
        console.log('📋 Estrutura da tabela respostas:');
        console.table(results);
      }
    });
  }
});

/* ============================================================
   🔹 REMOVIDO: SERVIR FRONTEND
============================================================ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================
   🔹 ARQUIVO JSON PARA DASHBOARD
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

/* =====================================================
   🔐 ROTAS DE AUTENTICAÇÃO
===================================================== */

// Rota de REGISTRO
app.post("/auth/register", async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ erro: "Dados incompletos." });
  }

  try {
    // Verificar se email já existe
    const [existe] = await db.promise().query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (existe.length > 0) {
      return res.status(400).json({ erro: "Email já cadastrado." });
    }

    // Hash da senha
    const bcrypt = require('bcrypt');
    const senhaHash = await bcrypt.hash(password, 10);

    // Inserir usuário
    await db.promise().query(
      "INSERT INTO usuarios (email, username, password) VALUES (?, ?, ?)",
      [email, username, senhaHash]
    );

    console.log("✅ Usuário registrado:", email);
    res.json({ sucesso: true, mensagem: "Conta criada com sucesso!" });

  } catch (err) {
    console.error("❌ Erro ao registrar:", err);
    res.status(500).json({ erro: "Erro ao criar conta." });
  }
});

// Rota de LOGIN
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ erro: "Dados incompletos." });
  }

  try {
    const [usuarios] = await db.promise().query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ erro: "Email ou senha incorretos." });
    }

    const usuario = usuarios[0];

    // Verificar senha
    const bcrypt = require('bcrypt');
    const senhaValida = await bcrypt.compare(password, usuario.password);

    if (!senhaValida) {
      return res.status(401).json({ erro: "Email ou senha incorretos." });
    }

    console.log("✅ Login bem-sucedido:", email);
    res.json({ 
      sucesso: true, 
      user: {
        id: usuario.id,
        email: usuario.email,
        username: usuario.username
      }
    });

  } catch (err) {
    console.error("❌ Erro ao fazer login:", err);
    res.status(500).json({ erro: "Erro ao fazer login." });
  }
});

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
 q6_valor, q7_valor, q8_valor, q9_valor, q10_valor, data_registro)

    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

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
    new Date().toISOString().slice(0, 19).replace('T', ' ')
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
  console.log("📊 Requisição recebida de:", req.headers.origin);
  
  // Buscar do MySQL
  const sql = "SELECT * FROM respostas";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar do MySQL:", err);
      return res.json([]);
    }
    
    console.log(`✅ Retornando ${results.length} registros do MySQL`);
    
    // Converter para o formato esperado pelo dashboard
    const dadosFormatados = results.map((row) => ({
      estado: row.estado,
      idade: row.idade,
      genero: row.genero,
      data_registro: row.data_registro,
      q1_valor: row.q1_valor,
      q2_valor: row.q2_valor,
      q3_valor: row.q3_valor,
      q4_valor: row.q4_valor,
      q5_valor: row.q5_valor,
      q6_valor: row.q6_valor,
      q7_valor: row.q7_valor,
      q8_valor: row.q8_valor,
      q9_valor: row.q9_valor,
      q10_valor: row.q10_valor,
    }));
    
    res.json(dadosFormatados);
  });
});

/* ============================================================
   🔹 ROTA RAIZ — TESTE
============================================================ */

app.get("/", (req, res) => {
  res.json({ 
    status: "API funcionando no Railway com CORS configurado! 🚀",
    endpoints: {
      dados: "/dados",
      respostas: "/respostas (POST)"
    }
  });
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