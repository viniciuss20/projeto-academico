// dashboard.js

document.addEventListener("DOMContentLoaded", () => {

  const API_URL = "https://projeto-academico-production.up.railway.app/dados";

  /* -------------------------------------------------------
      ELEMENTOS DO DOM
  ------------------------------------------------------- */
  const totalRespostasEl = document.getElementById("totalRespostas");
  const estadoMaisAfetadoEl = document.getElementById("EstadoMaisAfetado");
  const totalEstadosEl = document.getElementById("totalEstados");
  const tituloDashboard = document.getElementById("tituloDashboard");
  const tituloEstadoMaisPopular = document.querySelector("#estadoMaisPopularTitulo");

  const graficoBarrasContainer = document.getElementById("graficoBarrasContainer");
  const graficoCampanhasContainer = document.getElementById("graficoCampanhasContainer");
  const graficoGeneroContainer = document.getElementById("graficoGeneroContainer");

  const ctxBarras = document.getElementById("graficoBarras").getContext("2d");
  const ctxCampanhas = document.getElementById("graficoCampanhas").getContext("2d");
  const ctxGenero = document.getElementById("graficoGenero").getContext("2d");

  const cardsClassificacao = document.querySelector(".classificacao-cards");
  const rankingContainer = document.getElementById("rankingEstados");

  const usoNormalEl = document.getElementById("usoNormal");
  const leveEl = document.getElementById("leve");
  const moderadaEl = document.getElementById("moderada");
  const altaEl = document.getElementById("alta");
  const severaEl = document.getElementById("severa");

  /* -------------------------------------------------------
      VARIÁVEIS GLOBAIS
  ------------------------------------------------------- */

  let graficoBarras;
  let graficoCampanhas;
  let graficoGenero;

  let dadosRespostas = {};
  let dadosCampanhas = {};
  let dadosGenero = {};
  let todosOsDados = [];

  const estadoMap = {
    PE: "Pernambuco",
    Pernambuco: "Pernambuco",
    SP: "São Paulo",
    "São Paulo": "São Paulo",
    RJ: "Rio de Janeiro",
    "Rio de Janeiro": "Rio de Janeiro",
    MG: "Minas Gerais",
    "Minas Gerais": "Minas Gerais",
    BA: "Bahia",
    Bahia: "Bahia",
  };

  /* -------------------------------------------------------
      FUNÇÕES UTILITÁRIAS
  ------------------------------------------------------- */

  function normalizarTexto(txt) {
    if (typeof txt !== "string") return "";
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  function normalizarEstado(valor) {
    if (!valor) return "Não informado";
    valor = String(valor).trim();

    if (estadoMap[valor]) return estadoMap[valor];
    if (estadoMap[valor.toUpperCase()]) return estadoMap[valor.toUpperCase()];

    const capitalizado = valor[0]?.toUpperCase() + valor.slice(1).toLowerCase();
    if (estadoMap[capitalizado]) return estadoMap[capitalizado];

    return valor;
  }

  function calcularClassificacaoAPartirDosValores(item) {
    const valores = [];

    for (let i = 1; i <= 10; i++) {
      const campo = item[`q${i}_valor`];
      if (typeof campo === "number") valores.push(campo);
    }

    if (valores.length === 0) return "Sem dependência";

    const pont = valores.reduce((acc, v) => acc + v, 0);
    const max = valores.length * 5;
    const pct = Math.round((pont / max) * 100);

    if (pct <= 20) return "Sem dependência";
    if (pct <= 40) return "Dependência leve";
    if (pct <= 60) return "Dependência moderada";
    if (pct <= 80) return "Dependência alta";
    return "Dependência severa";
  }

  function pegarClassificacao(item) {
    const texto =
      item.classificacao ||
      item.Classificacao ||
      item["Classificação"] ||
      item.classificação ||
      "";

    if (texto) {
      const norm = normalizarTexto(texto);
      if (norm.includes("sem")) return "Sem dependência";
      if (norm.includes("leve")) return "Dependência leve";
      if (norm.includes("moderada")) return "Dependência moderada";
      if (norm.includes("alta")) return "Dependência alta";
      if (norm.includes("severa")) return "Dependência severa";
    }

    return calcularClassificacaoAPartirDosValores(item);
  }

  function pegarCampanha(item) {
    let campo =
      item.campanha ||
      item["campanhas"] ||
      item["Você já viu ou participou de campanhas, palestras ou programas sobre dependência de internet?"];

    if (!campo && item.respostasDetalhadas?.q10) {
      campo = item.respostasDetalhadas.q10.texto;
    }

    if (!campo && typeof item.q10_valor === "number") {
      return item.q10_valor >= 3 ? "Sim" : "Não";
    }

    const t = normalizarTexto(campo || "");
    if (t.includes("sim")) return "Sim";
    return "Não";
  }

  function pegarGenero(item) {
    const genero =
      item.genero ||
      item["gênero"] ||
      item["Genero"] ||
      item["Gênero"] ||
      item["sexo"];

    const g = normalizarTexto(genero || "");
    if (g.includes("masc")) return "Homem";
    if (g.includes("fem") || g.includes("mulher")) return "Mulher";
    return "Não informado";
  }

  /* -------------------------------------------------------
      MAPA
  ------------------------------------------------------- */

  function corPorIntensidade(int) {
    const light = 80 - Math.round(50 * int);
    return `hsl(0, 80%, ${light}%)`;
  }

  function desenharMapa() {
    const estados = ["Pernambuco", "Bahia", "Minas Gerais", "Rio de Janeiro", "São Paulo"];

    let max = 0;
    const impactos = {};

    estados.forEach((estado) => {
      const d = dadosRespostas[estado];
      const impacto = d
        ? d.classificacoes["Dependência alta"] + d.classificacoes["Dependência severa"]
        : 0;

      impactos[estado] = impacto;
      if (impacto > max) max = impacto;
    });

    estados.forEach((estado) => {
      const grupo = document.querySelector(`#mapaBrasil g[data-estado="${estado}"]`);
      if (!grupo) return;

      const shape = grupo.querySelector(".estado-shape");
      if (!shape) return;

      const impacto = impactos[estado];
      const intensidade = max ? impacto / max : 0;

      shape.style.fill = corPorIntensidade(intensidade);
      shape.style.opacity = impacto === 0 ? 0.6 : 1;
    });
  }

  /* -------------------------------------------------------
      RANKING
  ------------------------------------------------------- */

  function atualizarRankingEstados() {
    if (!rankingContainer) return;

    const ranking = Object.entries(dadosRespostas)
      .map(([estado, d]) => ({
        estado,
        impacto: d.classificacoes["Dependência alta"] + d.classificacoes["Dependência severa"],
      }))
      .sort((a, b) => b.impacto - a.impacto);

    rankingContainer.innerHTML = ranking
      .map(
        (r, i) => `
      <li>
        <strong>${i + 1}º</strong> ${r.estado} — 
        <span style="color:#e74c3c">${r.impacto}</span>
      </li>`
      )
      .join("");
  }

  /* -------------------------------------------------------
      ESTATÍSTICAS
  ------------------------------------------------------- */

  function atualizarEstatisticas(estado = "geral") {
    if (estado === "geral") {
      const total = Object.values(dadosRespostas).reduce((acc, d) => acc + d.total, 0);

      let mais = "Nenhum";
      let maior = -1;

      for (const [est, d] of Object.entries(dadosRespostas)) {
        const impacto = d.classificacoes["Dependência alta"] + d.classificacoes["Dependência severa"];
        if (impacto > maior) {
          maior = impacto;
          mais = est;
        }
      }

      totalRespostasEl.textContent = total;
      estadoMaisAfetadoEl.textContent = mais;
      totalEstadosEl.textContent = Object.keys(dadosRespostas).length;

      tituloEstadoMaisPopular.textContent = "Estado mais afetado";
      return;
    }

    const d = dadosRespostas[estado] || {
      total: 0,
      classificacoes: {
        "Sem dependência": 0,
        "Dependência leve": 0,
        "Dependência moderada": 0,
        "Dependência alta": 0,
        "Dependência severa": 0,
      },
    };

    totalRespostasEl.textContent = d.total;
    estadoMaisAfetadoEl.textContent = estado;
    totalEstadosEl.textContent = 1;

    usoNormalEl.textContent = d.classificacoes["Sem dependência"];
    leveEl.textContent = d.classificacoes["Dependência leve"];
    moderadaEl.textContent = d.classificacoes["Dependência moderada"];
    altaEl.textContent = d.classificacoes["Dependência alta"];
    severaEl.textContent = d.classificacoes["Dependência severa"];

    tituloEstadoMaisPopular.textContent = "Situação do estado";
  }

  /* -------------------------------------------------------
      GRÁFICOS
  ------------------------------------------------------- */

  function criarGraficoBarras() {
    const labels = Object.keys(dadosRespostas);
    const values = Object.values(dadosRespostas).map((d) => d.total);

    if (graficoBarras) graficoBarras.destroy();

    graficoBarras = new Chart(ctxBarras, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Total de Respostas",
            data: values,
            backgroundColor: "rgba(54,162,235,0.6)",
            borderColor: "rgba(54,162,235,1)",
            borderWidth: 1,
          },
        ],
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } },
    });
  }

  function criarGraficoCampanhas(estado = "geral") {
    let dados;
    if (estado === "geral") {
      const sim = Object.values(dadosCampanhas).reduce((acc, d) => acc + d.Sim, 0);
      const nao = Object.values(dadosCampanhas).reduce((acc, d) => acc + d["Não"], 0);
      dados = { Sim: sim, Não: nao };
    } else {
      dados = dadosCampanhas[estado] || { Sim: 0, Não: 0 };
    }

    if (graficoCampanhas) graficoCampanhas.destroy();

    graficoCampanhas = new Chart(ctxCampanhas, {
      type: "pie",
      data: {
        labels: ["Sim", "Não"],
        datasets: [
          {
            data: [dados.Sim, dados["Não"]],
            backgroundColor: ["#4CAF50", "#F44336"],
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      },
    });
  }

  function criarGraficoGenero(estado = "geral") {
    let dados;
    if (estado === "geral") {
      const homem = Object.values(dadosGenero).reduce((acc, d) => acc + d.Homem, 0);
      const mulher = Object.values(dadosGenero).reduce((acc, d) => acc + d.Mulher, 0);
      dados = { Homem: homem, Mulher: mulher };
    } else {
      dados = dadosGenero[estado] || { Homem: 0, Mulher: 0 };
    }

    if (graficoGenero) graficoGenero.destroy();

    graficoGenero = new Chart(ctxGenero, {
      type: "pie",
      data: {
        labels: ["Homem", "Mulher"],
        datasets: [
          {
            data: [dados.Homem, dados.Mulher],
            backgroundColor: ["#2196F3", "#E91E63"],
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      },
    });
  }

  /* -------------------------------------------------------
      CARREGAR DADOS
  ------------------------------------------------------- */

  async function carregarDados() {
    try {
      const resp = await fetch(API_URL);
      if (!resp.ok) throw new Error("Erro ao acessar API do Railway");

      const dados = await resp.json();
      todosOsDados = dados;

      const agrupado = {};
      const campanhasAgrupadas = {};
      const generoAgrupado = {};

      dados.forEach((item) => {
        const estado = normalizarEstado(item.estado || "");
        const classificacao = pegarClassificacao(item);
        const campanha = pegarCampanha(item);
        const genero = pegarGenero(item);

        if (!agrupado[estado]) {
          agrupado[estado] = {
            total: 0,
            classificacoes: {
              "Sem dependência": 0,
              "Dependência leve": 0,
              "Dependência moderada": 0,
              "Dependência alta": 0,
              "Dependência severa": 0,
            },
          };

          campanhasAgrupadas[estado] = { Sim: 0, Não: 0 };
          generoAgrupado[estado] = { Homem: 0, Mulher: 0, "Não informado": 0 };
        }

        agrupado[estado].total++;
        agrupado[estado].classificacoes[classificacao]++;
        campanhasAgrupadas[estado][campanha]++;
        generoAgrupado[estado][genero]++;
      });

      dadosRespostas = agrupado;
      dadosCampanhas = campanhasAgrupadas;
      dadosGenero = generoAgrupado;

      atualizarEstatisticas("geral");
      criarGraficoBarras();
      criarGraficoCampanhas("geral");
      criarGraficoGenero("geral");
      atualizarRankingEstados();
      desenharMapa();

    } catch (err) {
      console.error("❌ Erro ao carregar dados:", err);
    }
  }

  /* -------------------------------------------------------
      EXECUÇÃO INICIAL
  ------------------------------------------------------- */

  carregarDados();
  setInterval(carregarDados, 5000);

});
