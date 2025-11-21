async function carregarDados() {
  try {
    // 🔹 SEU BACKEND NO RAILWAY (URL REAL E FUNCIONAL)
    const resposta = await fetch("https://projeto-academico-production.up.railway.app/dados");

    if (!resposta.ok) throw new Error("Falha ao obter /dados do Railway");

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
    console.error("❌ Erro ao carregar dados do Railway:", erro);
  }
}
