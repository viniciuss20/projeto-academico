// server.js

import express from "express";
import fs from "fs";
import cors from "cors";
import mysql from "mysql2";

// (opcional, mas ajuda no ambiente local se você usar .env)
// import dotenv from "dotenv";
// dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================== CONEXÃO COM O MYSQL (Railway ou local) ==================

// Detecta se estamos em produção (Railway) ou local
const usandoRailway = !!process.env.MYSQLHOST && process.env.MYSQLHOST !== "localhost";

const dbConfigProd = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT) || 3306,
  // Railway exige SSL
  ssl: {
    rejectUnauthorized: false,
  },
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
    return;
  }
  console.log("✅ Conectado ao MySQL!", usandoRailway ? "(Railway)" : "(Local)");
});

// ================== ARQUIVO JSON (AINDA USADO PELO DASHBOARD) ==================

const caminhoArquivo = "./respostas.json";

// ================== FUNÇÃO DE CÁLCULO ==================

function calcularPontuacao(respostas) {
  const valores = {
    "Nunca": 1,
    "Raramente": 2,
    "Às vezes": 3,
    "Frequentemente": 4,
    "Sempre": 5,
    "Sim": 5,
    "Não": 1,
    "Talvez": 3,
    "1 a 2 horas": 3,
    "3 a 5 horas": 4,
    "Mais de 6 horas": 5,
    "Não consigo ficar mais de 30 minutos sem acessar": 5,
    "Não tenho problema em permanecer longe": 1,
  };

  let pontuacao = 0;
  const respostasDetalhadas = {};

  // funciona tanto se vier { q1: "Sempre" } quanto { q1: { texto: "Sempre", ... } }
  for (const [pergunta, resposta] of Object.entries(respostas)) {
    let texto;

    if (typeof resposta === "object" && resposta !== null) {
      texto = resposta.texto || resposta.resposta || resposta.valor || "";
    } else {
      texto = resposta;
    }

    const valor = valores[texto] || 0;
    pontuacao += valor;
    respostasDetalhadas[pergunta] = { texto, valor };
  }

  const pontuacaoMax = Object.keys(respostasDetalhadas).length * 5;
  const porcentagem = Math.round((pontuacao / pontuacaoMax) * 100);

  let classificacao = "";
  if (porcentagem <= 20) classificacao = "Sem dependência";
  else if (porcentagem <= 40) classificacao = "Dependência leve";
  else if (porcentagem <= 60) classificacao = "Dependência moderada";
  else if (porcentagem <= 80) classificacao = "Dependência alta";
  else classificacao = "Dependência severa";

  return { respostasDetalhadas, pontuacao, pontuacaoMax, porcentagem, classificacao };
}

// ================== ENDPOINT QUE RECEBE AS RESPOSTAS ==================

app.post(["/registrar", "/dados"], (req, res) => {
  const { estado, idade, genero, respostas } = req.body;

  if (!estado || !idade || !genero || !respostas) {
    return res.status(400).json({ erro: "Dados incompletos enviados ao servidor." });
  }

  const resultado = calcularPontuacao(respostas);

  const novaResposta = {
    estado,
    idade,
    genero,
    ...resultado,
    data: new Date().toISOString(),
  };

  // -------- 1) SALVAR NO ARQUIVO JSON (para o dashboard) --------
  try {
    let dados = [];
    if (fs.existsSync(caminhoArquivo)) {
      const conteudo = fs.readFileSync(caminhoArquivo, "utf8");
      if (conteudo.trim() !== "") dados = JSON.parse(conteudo);
    }
    dados.push(novaResposta);
    fs.writeFileSync(caminhoArquivo, JSON.stringify(dados, null, 2));
  } catch (erro) {
    console.error("❌ Erro ao salvar no JSON:", erro);
  }

  // -------- 2) SALVAR NO MYSQL --------

  const det = novaResposta.respostasDetalhadas || {};
  const getValor = (n) => det[`q${n}`]?.valor ?? 0;

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
    getValor(1), getValor(2), getValor(3), getValor(4), getValor(5),
    getValor(6), getValor(7), getValor(8), getValor(9), getValor(10),
  ];

  db.query(sql, valores, (err) => {
    if (err) {
      console.error("❌ Erro ao inserir no MySQL:", err);
    } else {
      console.log("✅ Resposta inserida no MySQL!");
    }

    res.json({ mensagem: "Respostas salvas!", novaResposta });
  });
});

// ================== ROTA PARA MIGRAR JSON -> MYSQL ==================

app.get("/migrar-json-para-mysql", (req, res) => {
  try {
    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(400).json({ erro: "Arquivo não encontrado" });
    }

    const conteudo = fs.readFileSync(caminhoArquivo, "utf8");
    if (!conteudo.trim()) {
      return res.status(400).json({ erro: "Arquivo JSON está vazio" });
    }

    const dados = JSON.parse(conteudo);
    if (!Array.isArray(dados)) {
      return res.status(400).json({ erro: "Formato inválido no JSON" });
    }

    const valores = dados.map((item) => {
      const det = item.respostasDetalhadas || {};
      const get = (n) => det[`q${n}`]?.valor ?? 0;

      return [
        item.estado || "",
        item.idade || null,
        item.genero || "",
        get(1), get(2), get(3), get(4), get(5),
        get(6), get(7), get(8), get(9), get(10),
      ];
    });

    if (valores.length === 0) {
      return res.status(400).json({ erro: "Nenhum registro para migrar" });
    }

    const sql = `
      INSERT INTO respostas
      (estado, idade, genero,
       q1_valor, q2_valor, q3_valor, q4_valor, q5_valor,
       q6_valor, q7_valor, q8_valor, q9_valor, q10_valor)
      VALUES ?
    `;

    db.query(sql, [valores], (err, result) => {
      if (err) {
        console.error("❌ Erro ao migrar JSON -> MySQL:", err);
        return res.status(500).json({ erro: "Erro ao migrar" });
      }

      console.log(`✅ Migração concluída. Registros inseridos: ${result.affectedRows}`);
      res.json({ mensagem: "Migração concluída!", inseridos: result.affectedRows });
    });
  } catch (erro) {
    console.error("❌ Erro interno na migração:", erro);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// ================== ENDPOINTS DE LEITURA (AINDA LENDO DO JSON) ==================

app.get("/dados", (req, res) => {
  try {
    if (!fs.existsSync(caminhoArquivo)) return res.json([]);
    const conteudo = fs.readFileSync(caminhoArquivo, "utf8");
    const dados = conteudo.trim() ? JSON.parse(conteudo) : [];
    res.json(dados);
  } catch (erro) {
    console.error("❌ Erro ao ler JSON em /dados:", erro);
    res.status(500).json({ erro: "Erro ao ler JSON" });
  }
});

app.get("/respostas", (req, res) => {
  try {
    if (!fs.existsSync(caminhoArquivo)) return res.json([]);
    const conteudo = fs.readFileSync(caminhoArquivo, "utf8");
    const dados = conteudo.trim() ? JSON.parse(conteudo) : [];
    res.json(dados);
  } catch (erro) {
    console.error("❌ Erro ao ler JSON em /respostas:", erro);
    res.status(500).json({ erro: "Erro ao ler JSON" });
  }
});

// ================== INICIAR SERVIDOR ==================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT} (${usandoRailway ? "Railway" : "Local"})`);
});
