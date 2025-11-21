// dashboard.js

document.addEventListener("DOMContentLoaded", () => {
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

  const usoNormalEl = document.getElementById("usoNormal");
  const leveEl = document.getElementById("leve");
  const moderadaEl = document.getElementById("moderada");
  const altaEl = document.getElementById("alta");
  const severaEl = document.getElementById("severa");

  const rankingContainer = document.getElementById("rankingEstados");

  let graficoBarras;
  let graficoCampanhas;
  let graficoGenero;
  let dadosRespostas = {};
  let dadosCampanhas = {};
  let dadosGenero = {};
  let todosOsDados = [];

  const API_URL = "https://projeto-academico-production.up.railway.app/dados";

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

  function normalizarTexto(txt) {
    if (typeof txt !== "string") return "";
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  function normalizarEstado(valor) {
    if (!valor) return "Não informado";
    valor = String(valor).trim();
    if (estadoMap[valor]) return estadoMap[valor];
    const upper = valor.toUpperCase();
    if (estadoMap[upper]) return estadoMap[upper];
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

    const pontuacao = valores.reduce((a, b) => a + b, 0);
    const pontuacaoMax = valores.length * 5;
    const porcentagem = Math.round((pontuacao / pontuacaoMax) * 100);

    if (porcentagem <= 20) return "Sem dependência";
    if (porcentagem <= 40) return "Dependência leve";
    if (porcentagem <= 60) return "Dependência moderada";
    if (porcentagem <= 80) return "Dependência alta";
    return "Dependência severa";
  }

  function pegarClassificacao(item) {
    const valorTexto =
      item.classificacao ||
      item.Classificacao ||
      item["Classificação"] ||
      item.classificação ||
      "";

    if (valorTexto) {
      const norm = normalizarTexto(valorTexto);
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

    if (campo) {
      const valorTxt = normalizarTexto(campo);
      if (valorTxt.includes("sim")) return "Sim";
      return "Não";
    }

    if (typeof item.q10_valor === "number") {
      return item.q10_valor >= 3 ? "Sim" : "Não";
    }

    return "Não";
  }

  function pegarGenero(item) {
    const genero =
      item.genero ||
      item["gênero"] ||
      item["Genero"] ||
      item["Gênero"] ||
      item["sexo"];

    const valor = normalizarTexto(genero);
    if (valor.includes("mascul")) return "Homem";
    if (valor.includes("fem") || valor.includes("mulher")) return "Mulher";
    return "Não informado";
  }

  function corPorIntensidade(intensidade) {
    const light = 80 - Math.round(50 * intensidade);
    return `hsl(0, 80%, ${light}%)`;
  }

  function desenharMapa() {
    const estadosSVG = ["Pernambuco", "Bahia", "Minas Gerais", "Rio de Janeiro", "São Paulo"];

    const impactos = {};
    let maxImpacto = 0;

    estadosSVG.forEach((estado) => {
      const dados = dadosRespostas[estado];
      const impacto = dados
        ? (dados.classificacoes["Dependência alta"] || 0) +
          (dados.classificacoes["Dependência severa"] || 0)
        : 0;

      impactos[estado] = impacto;
      if (impacto > maxImpacto) maxImpacto = impacto;
    });

    estadosSVG.forEach((estado) => {
      const impacto = impactos[estado] || 0;
      const intensidade = maxImpacto === 0 ? 0 : impacto / maxImpacto;
      const cor = corPorIntensidade(intensidade);

      const grupo = document.querySelector(`#mapaBrasil g[data-estado="${estado}"]`);
      if (grupo) {
        const shape = grupo.querySelector(".estado-shape");
        if (shape) {
          shape.style.fill = cor;
          shape.setAttribute("data-impacto", impacto);
          shape.style.opacity = impacto === 0 ? 0.6 : 1;
        }
      }
    });
  }

  function atualizarRankingEstados() {
    if (!rankingContainer) return;

    const ranking = Object.entries(dadosRespostas)
      .map(([estado, dados]) => ({
        estado,
        impacto: dados.classificacoes["Dependência alta"] + dados.classificacoes["Dependência severa"],
      }))
      .sort((a, b) => b.impacto - a.impacto);

    rankingContainer.innerHTML = ranking
      .map(
        (r, i) => `
      <li>
        <strong>${i + 1}º</strong> ${r.estado} — 
        <span style="color:#e74c3c">${r.impacto}</span> casos graves
      </li>`
      )
      .join("");
  }

  function atualizarEstatisticas(estado = "geral") {
    if (estado === "geral") {
      const totalRespostas = Object.values(dadosRespostas).reduce(
        (acc, estado) => acc + estado.total,
        0
      );

      let estadoMaisAfetado = "Nenhum";
      let maiorImpacto = -1;

      for (const [nomeEstado, dados] of Object.entries(dadosRespostas)) {
        const impacto =
          dados.classificacoes["Dependência alta"] +
          dados.classificacoes["Dependência severa"];

        if (impacto > maiorImpacto) {
          maiorImpacto = impacto;
          estadoMaisAfetado = nomeEstado;
        }
      }

      totalRespostasEl.textContent = totalRespostas;
      estadoMaisAfetadoEl.textContent = estadoMaisAfetado;
      totalEstadosEl.textContent = Object.keys(dadosRespostas).length;
      tituloEstadoMaisPopular.textContent = "Estado mais afetado";
    } else {
      const dadosEstado = dadosRespostas[estado] || {
        total: 0,
        classificacoes: {
          "Sem dependência": 0,
          "Dependência leve": 0,
          "Dependência moderada": 0,
          "Dependência alta": 0,
          "Dependência severa": 0,
        },
      };

      totalRespostasEl.textContent = dadosEstado.total;
      estadoMaisAfetadoEl.textContent = estado;
      totalEstadosEl.textContent = 1;
      tituloEstadoMaisPopular.textContent = "Situação do Estado";

      usoNormalEl.textContent = dadosEstado.classificacoes["Sem dependência"];
      leveEl.textContent = dadosEstado.classificacoes["Dependência leve"];
      moderadaEl.textContent = dadosEstado.classificacoes["Dependência moderada"];
      altaEl.textContent = dadosEstado.classificacoes["Dependência alta"];
      severaEl.textContent = dadosEstado.classificacoes["Dependência severa"];
    }
  }

  function criarGraficoBarras() {
    const labels = Object.keys(dadosRespostas);
    const data = Object.values(dadosRespostas).map((d) => d.total);

    if (graficoBarras) graficoBarras.destroy();

    graficoBarras = new Chart(ctxBarras, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Total de Respostas",
            data,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
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
      const totalSim = Object.values(dadosCampanhas).reduce((a, b) => a + b.Sim, 0);
      const totalNao = Object.values(dadosCampanhas).reduce((a, b) => a + b["Não"], 0);
      dados = { Sim: totalSim, Não: totalNao };
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
      const totalHomem = Object.values(dadosGenero).reduce((a, b) => a + b.Homem, 0);
      const totalMulher = Object.values(dadosGenero).reduce((a, b) => a + b.Mulher, 0);
      dados = { Homem: totalHomem, Mulher: totalMulher };
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

  async function carregarDados() {
    try {
      const resposta = await fetch(API_URL);
      if (!resposta.ok) throw new Error("Erro ao acessar o backend do Railway");

      const dados = await resposta.json();
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
      criarGraficoGenero("geral");
      criarGraficoCampanhas("geral");
      atualizarRankingEstados();
      desenharMapa();

    } catch (erro) {
      console.error("❌ Erro ao carregar dados:", erro);
    }
  }

  habilitarInteracaoMapa();
  carregarDados();
  setInterval(carregarDados, 5000);
});
