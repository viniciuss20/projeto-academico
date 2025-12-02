// dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://projeto-academico-production.up.railway.app/dados";

  /* -------------------------------------------------------
      ELEMENTOS DO DOM
  ------------------------------------------------------- */
  const totalRespostasEl = document.getElementById("totalRespostas");
  const estadoMaisAfetadoEl = document.getElementById("EstadoMaisAfetado");
  const totalEstadosEl = document.getElementById("totalEstados");
  const faixaEtariaEl = document.getElementById("faixaEtaria");
  const tituloDashboard = document.getElementById("tituloDashboard");
  const tituloEstadoMaisPopular = document.querySelector("#estadoMaisPopularTitulo");

  const graficoBarrasContainer = document.getElementById("graficoBarrasContainer");
  const graficoCampanhasContainer = document.getElementById("graficoCampanhasContainer");
  const graficoGeneroContainer = document.getElementById("graficoGeneroContainer");
  const graficoSeverosContainer = document.getElementById("graficoSeverosContainer");
  const mapaBrasilContainer = document.getElementById("mapaBrasilContainer");
  const mapaBrasilObject = document.getElementById("mapaBrasil");

  const ctxBarras = document.getElementById("graficoBarras")?.getContext?.("2d");
  const ctxCampanhas = document.getElementById("graficoCampanhas")?.getContext?.("2d");
  const ctxGenero = document.getElementById("graficoGenero")?.getContext?.("2d");
  const ctxSeveros = document.getElementById("graficoSeveros")?.getContext?.("2d");

  const cardsClassificacao = document.querySelector(".classificacao-cards");
  const usoNormalEl = document.getElementById("usoNormal");
  const leveEl = document.getElementById("leve");
  const moderadaEl = document.getElementById("moderada");
  const altaEl = document.getElementById("alta");
  const severaEl = document.getElementById("severa");

  const estadoListEl = document.getElementById("estadoList");

  /* -------------------------------------------------------
      LISTA DE ESTADOS
  ------------------------------------------------------- */
  const ESTADOS_BRASIL = [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
    "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
    "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
    "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
    "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins",
  ];

  const estadoMap = {
    AC:"Acre", Acre:"Acre", AL:"Alagoas", Alagoas:"Alagoas", AP:"Amapá", Amapá:"Amapá",
    AM:"Amazonas", Amazonas:"Amazonas", BA:"Bahia", Bahia:"Bahia", CE:"Ceará", Ceará:"Ceará",
    DF:"Distrito Federal", "Distrito Federal":"Distrito Federal",
    ES:"Espírito Santo", "Espírito Santo":"Espírito Santo",
    GO:"Goiás", "Goiás":"Goiás", MA:"Maranhão", Maranhão:"Maranhão",
    MT:"Mato Grosso", "Mato Grosso":"Mato Grosso",
    MS:"Mato Grosso do Sul", "Mato Grosso do Sul":"Mato Grosso do Sul",
    MG:"Minas Gerais", "Minas Gerais":"Minas Gerais",
    PA:"Pará", Pará:"Pará", PB:"Paraíba", "Paraíba":"Paraíba",
    PR:"Paraná", Paraná:"Paraná", PE:"Pernambuco", Pernambuco:"Pernambuco",
    PI:"Piauí", Piauí:"Piauí",
    RJ:"Rio de Janeiro", "Rio de Janeiro":"Rio de Janeiro",
    RN:"Rio Grande do Norte", "Rio Grande do Norte":"Rio Grande do Norte",
    RS:"Rio Grande do Sul", "Rio Grande do Sul":"Rio Grande do Sul",
    RO:"Rondônia", Rondônia:"Rondônia",
    RR:"Roraima", Roraima:"Roraima",
    SC:"Santa Catarina", "Santa Catarina":"Santa Catarina",
    SP:"São Paulo", "São Paulo":"São Paulo",
    SE:"Sergipe", Sergipe:"Sergipe",
    TO:"Tocantins", Tocantins:"Tocantins"
  };

  // Mapeamento de IDs do SVG para nomes completos dos estados
  // Incluindo variações possíveis de IDs
  const svgIdParaEstado = {
    "Piaui": "Piauí",
    "Ceara": "Ceará",
    "Alagoas": "Alagoas",
    "Sergipe": "Sergipe",
    "Fernando_de_Noronha": "Pernambuco",
    "Pernambuco": "Pernambuco",
    "Paraiba": "Paraíba",
    "BrasiliaDistritoFederal": "Distrito Federal",
    "Maranhao": "Maranhão",
    "Para": "Pará",
    "SaoPaulo": "São Paulo",
    "Rio_deJaneiro": "Rio de Janeiro",
    "RiodeJaneiro": "Rio de Janeiro",
    "EspiritoSanto": "Espírito Santo",
    "SantaCatarina": "Santa Catarina",
    "Acre": "Acre",
    "Bahia": "Bahia",
    "BA": "Bahia",
    "Goias": "Goiás",
    "Parana": "Paraná",
    "MatoGrosso": "Mato Grosso",
    "MatoGrossodoSul": "Mato Grosso do Sul",
    "MatoGrossodosul": "Mato Grosso do Sul",
    "MatoGrossodoSul": "Mato Grosso do Sul",
    "MS": "Mato Grosso do Sul",
    "MinasGerais": "Minas Gerais",
    "Tocantins": "Tocantins",
    "RioGrandedoNorte": "Rio Grande do Norte",
    "RioGrandedoSul": "Rio Grande do Sul",
    "RioGrandedosul": "Rio Grande do Sul",
    "RioGrandedoSul": "Rio Grande do Sul",
    "RS": "Rio Grande do Sul",
    "Rondonia": "Rondônia",
    "Roraima": "Roraima",
    "Amapa": "Amapá",
    "Amazonas": "Amazonas"
  };

  /* -------------------------------------------------------
      VARIÁVEIS GLOBAIS
  ------------------------------------------------------- */
  let graficoBarras, graficoCampanhas, graficoGenero, graficoSeveros;
  let dadosRespostas = {};
  let dadosCampanhas = {};
  let dadosGenero = {};
  let todosOsDados = [];
  let svgEstadosPaths = [];

  /* -------------------------------------------------------
      SIDEBAR DE ESTADOS
  ------------------------------------------------------- */
  function popularSidebarEstados() {
    estadoListEl.innerHTML = "";

    const liGeral = document.createElement("li");
    liGeral.dataset.estado = "geral";
    liGeral.textContent = "Geral";
    liGeral.classList.add("active");
    estadoListEl.appendChild(liGeral);

    ESTADOS_BRASIL.forEach((estado) => {
      const li = document.createElement("li");
      li.dataset.estado = estado;
      li.textContent = estado;
      estadoListEl.appendChild(li);
    });
  }

  popularSidebarEstados();

  /* -------------------------------------------------------
      NORMALIZAÇÕES
  ------------------------------------------------------- */
  function normalizarTexto(txt) {
    if (typeof txt !== "string") return "";
    return txt.normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .trim();
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

  /* -------------------------------------------------------
      CLASSIFICAÇÃO
  ------------------------------------------------------- */
  function calcularClassificacaoAPartirDosValores(item) {
    const valores = [];
    for (let i = 1; i <= 10; i++) {
      const n = item[`q${i}_valor`];
      if (typeof n === "number") valores.push(n);
    }
    if (!valores.length) return "Sem dependência";

    const pont = valores.reduce((a, b) => a + b, 0);
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

  /* -------------------------------------------------------
      CAMPANHAS / GÊNERO
  ------------------------------------------------------- */
  function pegarCampanha(item) {
    let campo =
      item.campanha ||
      item["campanhas"] ||
      item["Você já viu ou participou de campanhas, palestras ou programas sobre dependência de internet?"];

    if (!campo && item.respostasDetalhadas?.q10)
      campo = item.respostasDetalhadas.q10.texto;

    if (!campo && typeof item.q10_valor === "number")
      return item.q10_valor >= 3 ? "Sim" : "Não";

    return normalizarTexto(campo || "").includes("sim") ? "Sim" : "Não";
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
      MAPA — HEATMAP COM CORES CORRIGIDAS
  ------------------------------------------------------- */
  function getImpactoColor(percentual) {
    const p = Number(percentual);
    if (p <= 10) return "#cbd5e1";  // Cinza claro
    if (p <= 25) return "#93c5fd";  // Azul claro
    if (p <= 45) return "#3b82f6";  // Azul médio
    if (p <= 65) return "#1e40af";  // Azul escuro
    return "#1e3a8a";               // Azul muito escuro
  }

  function pintarMapaBrasil() {
    if (!svgEstadosPaths.length) {
      console.warn("⚠️ Nenhum estado encontrado no mapa SVG");
      return;
    }

    console.log("🎨 Iniciando pintura do mapa...");
    
    svgEstadosPaths.forEach((grupo) => {
      const idOriginal = grupo.id;
      const nomeEstado = svgIdParaEstado[idOriginal];
      
      if (!nomeEstado) {
        console.warn(`⚠️ Estado não mapeado: ${idOriginal}`);
        return;
      }

      const d = dadosRespostas[nomeEstado];
      const paths = grupo.querySelectorAll("path, polygon, rect");

      if (!d || !d.total) {
        paths.forEach((p) => {
          p.style.fill = "#e5e7eb";
          p.style.opacity = 0.7;
          p.style.transition = "all 0.3s ease";
        });
        return;
      }

      const altos = d.classificacoes["Dependência alta"] || 0;
      const severos = d.classificacoes["Dependência severa"] || 0;
      const total = d.total || 0;
      const percentual = total ? ((altos + severos) / total) * 100 : 0;
      const cor = getImpactoColor(percentual);

      console.log(`🎨 ${nomeEstado}: ${percentual.toFixed(1)}% afetado - cor: ${cor}`);

      paths.forEach((p) => {
        p.style.fill = cor;
        p.style.opacity = 1;
        p.style.transition = "all 0.3s ease";
        p.style.cursor = "pointer";
      });

      // ✅ ADICIONAR EVENTO DE CLIQUE NO ESTADO
      grupo.style.cursor = "pointer";
      grupo.addEventListener("click", () => {
        console.log(`🖱️ Clicou em: ${nomeEstado}`);
        selecionarEstado(nomeEstado);
      });

      // Adicionar efeito hover
      grupo.addEventListener("mouseenter", () => {
        paths.forEach((p) => {
          p.style.opacity = 0.8;
          p.style.filter = "brightness(1.1)";
        });
      });

      grupo.addEventListener("mouseleave", () => {
        paths.forEach((p) => {
          p.style.opacity = 1;
          p.style.filter = "brightness(1)";
        });
      });
    });

    console.log("✅ Mapa pintado com sucesso!");
  }

  function desenharMapa() {
    // Função vazia por enquanto - o mapa já está no HTML
    // A pintura é feita pela função pintarMapaBrasil()
    console.log("📍 Preparando mapa para pintura...");
  }

  function inicializarMapaInterativo() {
    if (!mapaBrasilObject) {
      console.error("❌ Elemento mapaBrasil não encontrado no HTML");
      return;
    }

    console.log("⏳ Aguardando carregamento do SVG...");

    mapaBrasilObject.addEventListener("load", () => {
      console.log("✅ SVG carregado! Iniciando busca por estados...");
      
      const svgDoc = mapaBrasilObject.contentDocument;
      if (!svgDoc) {
        console.error("❌ Não foi possível acessar o conteúdo do SVG");
        return;
      }

      // Busca todos os elementos com ID
      svgEstadosPaths = [];
      const todosComId = svgDoc.querySelectorAll("[id]");
      
      console.log("🔍 ========== LISTA COMPLETA DE IDs NO SVG ==========");
      const idsEncontrados = [];
      todosComId.forEach(el => {
        idsEncontrados.push(el.id);
      });
      console.log("IDs encontrados:", idsEncontrados.sort());
      console.log("====================================================");
      
      // Primeiro tenta buscar pelos IDs conhecidos
      Object.keys(svgIdParaEstado).forEach(idEstado => {
        const elemento = svgDoc.getElementById(idEstado);
        if (elemento) {
          svgEstadosPaths.push(elemento);
          console.log(`✅ Estado encontrado: ${idEstado} -> ${svgIdParaEstado[idEstado]}`);
        }
      });

      // Busca por IDs não mapeados
      console.log("🔍 ========== IDs NÃO MAPEADOS ==========");
      todosComId.forEach(el => {
        const id = el.id;
        
        // Verifica se já foi adicionado
        if (svgEstadosPaths.includes(el)) return;
        
        // Tenta encontrar correspondência no mapeamento
        const estadoNome = svgIdParaEstado[id];
        if (estadoNome) {
          svgEstadosPaths.push(el);
          console.log(`✅ Estado encontrado (alternativo): ${id} -> ${estadoNome}`);
        } else {
          // Log de IDs não mapeados para debug - com destaque
          if (id && !id.includes('_') && id.length > 2) {
            console.log(`⚠️ IMPORTANTE - ID não mapeado: "${id}"`);
          }
        }
      });
      console.log("=========================================");

      console.log(`📊 Total de estados mapeados: ${svgEstadosPaths.length} de 27`);

      // Lista estados que NÃO foram encontrados
      const estadosNaoEncontrados = ESTADOS_BRASIL.filter(estado => {
        return !svgEstadosPaths.some(el => {
          const idOriginal = el.id;
          const nomeEstado = svgIdParaEstado[idOriginal];
          return nomeEstado === estado;
        });
      });
      
      if (estadosNaoEncontrados.length > 0) {
        console.warn("⚠️ Estados SEM mapeamento:", estadosNaoEncontrados);
      }

      // Pinta o mapa após encontrar os estados
      if (Object.keys(dadosRespostas).length > 0) {
        pintarMapaBrasil();
      }
    });

    mapaBrasilObject.addEventListener("error", () => {
      console.error("❌ Erro ao carregar arquivo SVG do mapa");
      console.error("Verifique se o arquivo existe em: maps/Brazil_states.svg");
    });
  }

  /* -------------------------------------------------------
      FAIXA ETÁRIA — CORREÇÃO COMPLETA
  ------------------------------------------------------- */
  function mapAgeToBucket(idadeRaw) {
    if (idadeRaw == null) return "Não informado";

    const s = String(idadeRaw).toLowerCase().trim();

    const onlyNums = s.match(/\d+/g);
    if (onlyNums && onlyNums.length === 1) {
      const n = parseInt(onlyNums[0], 10);

      if (n <= 8) return "Crianças (0–8)";
      if (n <= 12) return "Crianças (9–12)";
      if (n <= 17) return "Adolescentes (13–17)";
      if (n <= 24) return "Jovens (18–24)";
      if (n <= 44) return "Adultos (25–44)";
      if (n <= 64) return "Meia-idade (45–64)";
      return "Idosos (65+)";
    }

    const range = s.match(/(\d{1,3})\s*(?:-|a|até)\s*(\d{1,3})/);
    if (range) {
      const a = parseInt(range[1], 10);
      const b = parseInt(range[2], 10);
      return mapAgeToBucket(Math.round((a + b) / 2));
    }

    if (s.includes("crian")) return "Crianças (0–12)";
    if (s.includes("adole") || s.includes("teen")) return "Adolescentes (13–17)";
    if (s.includes("jovem")) return "Jovens (18–24)";
    if (s.includes("adult")) return "Adultos (25–44)";
    if (s.includes("idos")) return "Idosos (65+)";

    return "Não informado";
  }

  function extrairIdade(item) {
    return (
      item.idade ??
      item.Idade ??
      item.age ??
      item.Age ??
      item.faixaEtaria ??
      item.faixa_etaria ??
      item.idade_resposta ??
      item.idadeUsuario ??
      item["Qual sua idade?"] ??
      item["qual_sua_idade"] ??
      item["Idade do participante"] ??
      item.respostasDetalhadas?.q1 ??
      ""
    );
  }

  function obterFaixaEtariaMaisAfetadaPorEstado(estado) {
    const filtro = todosOsDados.filter((p) => {
      const est = normalizarEstado(p.estado || "");
      return est === estado;
    });

    if (!filtro.length) return "Não informado";

    const counts = {};
    filtro.forEach((p) => {
      const idadeRaw = extrairIdade(p);
      const bucket = mapAgeToBucket(idadeRaw);
      counts[bucket] = (counts[bucket] || 0) + 1;
    });

    const ordenado = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!ordenado.length) return "Não informado";

    const [faixa, qtd] = ordenado[0];
    const total = filtro.length;
    const perc = Math.round((qtd / total) * 100);

    return `${faixa} — ${perc}%`;
  }

  function obterFaixaEtariaMaisAfetadaGeral() {
    if (!todosOsDados.length) return "Não informado";

    const counts = {};

    todosOsDados.forEach((p) => {
      const idadeRaw = extrairIdade(p);
      const bucket = mapAgeToBucket(idadeRaw);
      counts[bucket] = (counts[bucket] || 0) + 1;
    });

    const ordenado = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!ordenado.length) return "Não informado";

    const [faixa, qtd] = ordenado[0];
    const total = todosOsDados.length;
    const perc = Math.round((qtd / total) * 100);

    return `${faixa} — ${perc}%`;
  }

  function atualizarFaixaNoCard(estado) {
    if (!faixaEtariaEl) return;

    if (estado === "geral") {
      faixaEtariaEl.textContent = obterFaixaEtariaMaisAfetadaGeral();
    } else {
      faixaEtariaEl.textContent = obterFaixaEtariaMaisAfetadaPorEstado(estado);
    }
  }

  /* -------------------------------------------------------
      ESTATÍSTICAS E GRÁFICOS
  ------------------------------------------------------- */
  function atualizarEstatisticas(estado = "geral") {
    if (estado === "geral") {
      graficoBarrasContainer.style.display = "block";

      const total = Object.values(dadosRespostas).reduce((a, d) => a + d.total, 0);

      let maior = -1;
      let mais = "Nenhum";

      for (const [est, d] of Object.entries(dadosRespostas)) {
        const impacto =
          (d.classificacoes["Dependência alta"] || 0) +
          (d.classificacoes["Dependência severa"] || 0);

        if (impacto > maior) {
          maior = impacto;
          mais = est;
        }
      }

      totalRespostasEl.textContent = total;
      estadoMaisAfetadoEl.textContent = mais;

      tituloEstadoMaisPopular.textContent = "Estado mais afetado";

      cardsClassificacao.style.display = "none";
      graficoCampanhasContainer.style.display = "none";
      graficoGeneroContainer.style.display = "none";

      graficoSeverosContainer.style.display = "block";
      mapaBrasilContainer.style.display = "block";

      criarGraficoSeveros();
      desenharMapa();
      pintarMapaBrasil();

      atualizarFaixaNoCard("geral");
      return;
    }

    // Estado específico
    graficoBarrasContainer.style.display = "none";

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

    usoNormalEl.textContent = d.classificacoes["Sem dependência"];
    leveEl.textContent = d.classificacoes["Dependência leve"];
    moderadaEl.textContent = d.classificacoes["Dependência moderada"];
    altaEl.textContent = d.classificacoes["Dependência alta"];
    severaEl.textContent = d.classificacoes["Dependência severa"];

    tituloEstadoMaisPopular.textContent = "Situação do estado";

    cardsClassificacao.style.display = "flex";
    graficoCampanhasContainer.style.display = "block";
    graficoGeneroContainer.style.display = "block";

    graficoSeverosContainer.style.display = "none";
    mapaBrasilContainer.style.display = "none";

    atualizarFaixaNoCard(estado);
  }

  /* -------------------------------------------------------
      GRÁFICOS
  ------------------------------------------------------- */
  function criarGraficoBarras() {
    if (!ctxBarras) return;

    const labels = Object.keys(dadosRespostas);
    const values = Object.values(dadosRespostas).map((d) => d.total);

    if (graficoBarras) graficoBarras.destroy();

    graficoBarras = new Chart(ctxBarras, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Total de respostas",
            data: values,
            backgroundColor: "rgba(59,130,246,0.6)",
            borderColor: "rgba(37,99,235,1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } },
      },
    });
  }

  function criarGraficoSeveros() {
    if (!ctxSeveros) return;

    const lista = Object.entries(dadosRespostas)
      .map(([estado, d]) => ({
        estado,
        severos: d.classificacoes["Dependência severa"] || 0,
      }))
      .filter((i) => i.severos > 0)
      .sort((a, b) => b.severos - a.severos);

    if (!lista.length) {
      if (graficoSeveros) graficoSeveros.destroy();
      return;
    }

    const top = lista.slice(0, 4);
    const labels = top.map((i) => i.estado);
    const values = top.map((i) => i.severos);

    if (graficoSeveros) graficoSeveros.destroy();

    graficoSeveros = new Chart(ctxSeveros, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: ["#111827", "#60A5FA", "#6EE7B7", "#A5B4FC"],
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "65%",
        plugins: {
          legend: { position: "right", labels: { usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.parsed}`,
            },
          },
        },
      },
    });
  }

  function criarGraficoCampanhas(estado = "geral") {
    if (!ctxCampanhas) return;

    let dados;

    if (estado === "geral") {
      const sim = Object.values(dadosCampanhas).reduce((a, d) => a + d.Sim, 0);
      const nao = Object.values(dadosCampanhas).reduce(
        (a, d) => a + d["Não"],
        0
      );
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
            backgroundColor: ["#22C55E", "#EF4444"],
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      },
    });
  }

  function criarGraficoGenero(estado = "geral") {
    if (!ctxGenero) return;

    let dados;

    if (estado === "geral") {
      const homem = Object.values(dadosGenero).reduce(
        (a, d) => a + d.Homem,
        0
      );
      const mulher = Object.values(dadosGenero).reduce(
        (a, d) => a + d.Mulher,
        0
      );
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
            backgroundColor: ["#3B82F6", "#EC4899"],
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      },
    });
  }

  /* -------------------------------------------------------
      EVENTO: Troca de estado na sidebar
  ------------------------------------------------------- */
  function selecionarEstado(estado) {
    document.querySelectorAll("#estadoList li").forEach((li) => {
      li.classList.remove("active");
      if (li.dataset.estado === estado) li.classList.add("active");
    });

    tituloDashboard.textContent =
      estado === "geral"
        ? "Resultados Gerais da Pesquisa"
        : `Resultados de ${estado}`;

    atualizarEstatisticas(estado);
    criarGraficoCampanhas(estado);
    criarGraficoGenero(estado);
  }

  estadoListEl.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    selecionarEstado(li.dataset.estado);
  });

  /* -------------------------------------------------------
      CARREGAMENTO DOS DADOS DA API
  ------------------------------------------------------- */
  async function carregarDados() {
    try {
      const resp = await fetch(API_URL);
      if (!resp.ok) throw new Error("Erro ao acessar API");

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
          generoAgrupado[estado] = {
            Homem: 0,
            Mulher: 0,
            "Não informado": 0,
          };
        }

        agrupado[estado].total++;
        agrupado[estado].classificacoes[classificacao]++;
        campanhasAgrupadas[estado][campanha]++;
        generoAgrupado[estado][genero]++;
      });

      dadosRespostas = agrupado;
      dadosCampanhas = campanhasAgrupadas;
      dadosGenero = generoAgrupado;

      console.log("📊 Dados carregados:", {
        totalEstados: Object.keys(dadosRespostas).length,
        totalRespostas: todosOsDados.length
      });

      atualizarEstatisticas("geral");
      criarGraficoBarras();
      criarGraficoCampanhas("geral");
      criarGraficoGenero("geral");
      desenharMapa();
      
      // Aguarda um pouco para garantir que o SVG foi carregado
      setTimeout(() => {
        pintarMapaBrasil();
      }, 500);

    } catch (err) {
      console.error("❌ ERRO AO CARREGAR DADOS:", err);
    }
  }

  /* -------------------------------------------------------
      EXECUÇÃO INICIAL
  ------------------------------------------------------- */
  console.log("🚀 Iniciando dashboard...");
  inicializarMapaInterativo();
  carregarDados();
});