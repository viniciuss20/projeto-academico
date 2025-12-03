// server.js
import express from "express";
import fs from "fs";
import cors from "cors";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt"; // ← ADICIONE ESTA LINHA

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
    methods: ["GET", "POST", "OPTIONS", "PUT"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Adicionar headers CORS manualmente também (garantia extra)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  // Responder OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});
// ADICIONE ESTA ROTA DEPOIS DA CONFIGURAÇÃO DO CORS (após a linha 42)

// ====================================
// ROTA PARA SALVAR RESPOSTAS DO FORMULÁRIO
// ====================================
app.post('/respostas', async (req, res) => {
  try {
    const {
      estado,
      idade,
      genero,
      q1_valor,
      q2_valor,
      q3_valor,
      q4_valor,
      q5_valor,
      q6_valor,
      q7_valor,
      q8_valor,
      q9_valor,
      q10_valor
    } = req.body;

    // Validação básica
    if (!estado || idade === undefined || !genero) {
      return res.status(400).json({ 
        erro: 'Dados incompletos. Estado, idade e gênero são obrigatórios.' 
      });
    }

    // Inserir no banco de dados
    const query = `
      INSERT INTO respostas 
      (estado, idade, genero, q1_valor, q2_valor, q3_valor, q4_valor, q5_valor, 
       q6_valor, q7_valor, q8_valor, q9_valor, q10_valor, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const valores = [
      estado,
      idade,
      genero,
      q1_valor || 0,
      q2_valor || 0,
      q3_valor || 0,
      q4_valor || 0,
      q5_valor || 0,
      q6_valor || 0,
      q7_valor || 0,
      q8_valor || 0,
      q9_valor || 0,
      q10_valor || 0
    ];

    const [resultado] = await db.promise().query(query, valores);

    console.log('✅ Resposta salva com sucesso! ID:', resultado.insertId);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Resposta enviada com sucesso!',
      id: resultado.insertId
    });

  } catch (erro) {
    console.error('❌ Erro ao salvar resposta:', erro);
    res.status(500).json({
      erro: 'Erro ao salvar resposta no servidor.',
      detalhes: erro.message
    });
  }
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
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

/* =====================================================
   🔐 ROTAS DE AUTENTICAÇÃO
===================================================== */

app.post("/auth/register", async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "Dados incompletos." });
  }

  try {
    const [existe] = await db.promise().query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (existe.length > 0) {
      return res.status(400).json({ message: "Email já cadastrado." });
    }

    // Hash da senha usando bcrypt importado
    const senhaHash = await bcrypt.hash(password, 10);

    await db.promise().query(
      "INSERT INTO usuarios (email, username, password) VALUES (?, ?, ?)",
      [email, username, senhaHash]
    );

    console.log("✅ Usuário registrado:", email);
    res.json({ sucesso: true, message: "Conta criada com sucesso!" });

  } catch (err) {
    console.error("❌ Erro ao registrar:", err);
    res.status(500).json({ message: "Erro ao criar conta." });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Dados incompletos." });
  }

  try {
    const [usuarios] = await db.promise().query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ message: "Email ou senha incorretos." });
    }

    const usuario = usuarios[0];

    // Verificar senha usando bcrypt importado
    const senhaValida = await bcrypt.compare(password, usuario.password);

    if (!senhaValida) {
      return res.status(401).json({ message: "Email ou senha incorretos." });
    }

    console.log("✅ Login bem-sucedido:", email);
    res.json({ 
      sucesso: true,
      message: "Login realizado com sucesso!",
      user: {
        id: usuario.id,
        email: usuario.email,
        username: usuario.username
      }
    });

  } catch (err) {
    console.error("❌ Erro ao fazer login:", err);
    res.status(500).json({ message: "Erro ao fazer login." });
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

  try {
    const lista = fs.existsSync(caminhoArquivo)
      ? JSON.parse(fs.readFileSync(caminhoArquivo, "utf8"))
      : [];

    lista.push(registro);
    fs.writeFileSync(caminhoArquivo, JSON.stringify(lista, null, 2));
  } catch (err) {
    console.error("❌ Erro ao gravar JSON:", err);
  }

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

app.get("/dados", (req, res) => {
  console.log("📊 Requisição recebida de:", req.headers.origin);
  
  const sql = "SELECT * FROM respostas";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar do MySQL:", err);
      return res.json([]);
    }
    
    console.log(`✅ Retornando ${results.length} registros do MySQL`);
    
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

app.get("/", (req, res) => {
  res.json({ 
    status: "API funcionando! 🚀",
    endpoints: {
      dados: "/dados",
      respostas: "/respostas (POST)",
      registro: "/auth/register (POST)",
      login: "/auth/login (POST)"
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `🚀 Servidor rodando na porta ${PORT} → ${
      usandoRailway ? "Railway" : "Local"
    }`
  );
});