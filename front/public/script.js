// script.js (versão defensiva — mantém toda a lógica original)
document.addEventListener("DOMContentLoaded", () => {
  // pegar elementos (pode retornar null se o id não existir)
  const dadosPessoais = document.getElementById("dadosPessoais");
  const questionario = document.getElementById("questionario");
  const iniciar = document.getElementById("iniciar");
  const continuar = document.getElementById("continuar");
  const voltar = document.getElementById("voltar");
  const estadoSelect = document.getElementById("estado");
  const perguntaTexto = document.getElementById("perguntaTexto");
  const form = document.getElementById("form");

  // Barras de progresso (podem ser nulas)
  const progressBarInicio = document.getElementById("progressBar");   // 10%
  const progressBarQ = document.getElementById("progressBar2");       // dinâmico

  // Avisos rápidos se algum elemento crítico estiver faltando
  const warnIfMissing = (el, name) => {
    if (!el) console.warn(`AVISO: elemento "${name}" não encontrado no DOM.`);
  };
  warnIfMissing(dadosPessoais, "dadosPessoais");
  warnIfMissing(questionario, "questionario");
  warnIfMissing(iniciar, "iniciar");
  warnIfMissing(continuar, "continuar");
  warnIfMissing(voltar, "voltar");
  warnIfMissing(estadoSelect, "estado");
  warnIfMissing(perguntaTexto, "perguntaTexto");
  warnIfMissing(form, "form");
  warnIfMissing(progressBarInicio, "progressBar");
  warnIfMissing(progressBarQ, "progressBar2");

  // Perguntas do questionário (mantive exatamente como estava)
  const perguntas = [
    { texto: "Com que frequência você usa a internet para lazer (redes sociais, vídeos, jogos)?", opcoes: ["Raramente", "Às vezes", "Frequentemente", "Quase o tempo todo"] },
    { texto: "Você sente ansiedade quando está sem acesso à internet?", opcoes: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"] },
    { texto: "Por quantas horas você consegue ficar longe das redes sociais?", opcoes: ["1 a 2 horas", "3 a 5 horas", "Mais de 6 horas", "Não consigo ficar mais de 30 minutos sem acessar", "Não tenho problema em permanecer longe"] },
    { texto: "Você já deixou de realizar tarefas importantes por estar online?", opcoes: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"] },
    { texto: "Você se considera viciado(a) em redes sociais?", opcoes: ["Sim", "Não", "Talvez"] },
    { texto: "Você sente que perde a noção do tempo quando está na internet?", opcoes: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"] },
    { texto: "Você se irrita quando alguém interrompe seu uso da internet?", opcoes: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"] },
    { texto: "Você já tentou reduzir o tempo de uso da internet sem sucesso?", opcoes: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"] },
    { texto: "O uso da internet tem atrapalhado seus estudos ou trabalho?", opcoes: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"] },
    { texto: "Você já viu ou participou de campanhas, palestras ou programas sobre dependência de internet?", opcoes: ["Sim", "Não"] }
  ];

  // Mapeamento de valores (mantive igual)
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

  let indice = 0;
  const respostas = {};

  // Função segura para atualizar estilo (checa existência)
  function safeSetWidth(el, value) {
    if (el && el.style) el.style.width = value;
  }

  // Atualiza a barra de progresso do questionário (seguro)
  function atualizarProgresso() {
    const total = perguntas.length;
    // protege divisão por zero e uso sem element
    if (!total || typeof indice !== "number") return;
    const progresso = ((indice) / total) * 100;
    safeSetWidth(progressBarQ, `${progresso}%`);
  }

  // Renderiza pergunta atual (com checagens)
  function renderPergunta() {
    if (!perguntaTexto || !form) {
      console.error("Elemento 'perguntaTexto' ou 'form' ausente — não é possível renderizar perguntas.");
      return;
    }

    const atual = perguntas[indice];
    if (!atual) {
      console.error("Índice de pergunta inválido:", indice);
      return;
    }

    perguntaTexto.textContent = atual.texto;
    form.innerHTML = "";

    atual.opcoes.forEach((opcao) => {
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="radio" name="pergunta" value="${opcao}" required>
        ${opcao}
      `;
      form.appendChild(label);
    });

    atualizarProgresso();
  }

  // Função utilitária: obter valor de input com segurança
  function getInputValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  // INICIAR (aplica somente se o botão existir)
  if (iniciar) {
    iniciar.addEventListener("click", (e) => {
      e.preventDefault();
      const estado = estadoSelect ? estadoSelect.value.trim() : "";
      const idade = getInputValue("idade");
      const genero = getInputValue("genero");

      if (!estado || !idade || !genero) {
        alert("Por favor, preencha todos os campos!");
        return;
      }

      if (dadosPessoais) dadosPessoais.style.display = "none";
      if (questionario) questionario.style.display = "block";

      safeSetWidth(progressBarInicio, "10%");

      renderPergunta();
    });
  } else {
    console.warn("Botão 'iniciar' não encontrado — não foi possível iniciar o questionário.");
  }

  // CONTINUAR (aplica somente se o botão existir)
  if (continuar) {
    continuar.addEventListener("click", async (e) => {
      e.preventDefault();

      if (!form) {
        alert("Erro: formulário de perguntas ausente.");
        return;
      }

      const selecionada = form.querySelector("input[name='pergunta']:checked");
      if (!selecionada) {
        alert("Por favor, selecione uma resposta!");
        return;
      }

      const texto = selecionada.value;
      const valor = valores[texto] || 0;
      respostas[`q${indice + 1}`] = { texto, valor };

      if (indice < perguntas.length - 1) {
        indice++;
        renderPergunta();
        return;
      }

      // última pergunta: enviar dados
      const estado = estadoSelect ? estadoSelect.value.trim() : "";
      const idade = getInputValue("idade");
      const genero = getInputValue("genero");

      const dados = { 
  estado, 
  idade, 
  genero, 
  respostas,
  data_registro: new Date().toISOString().slice(0, 19).replace('T', ' ')
};

      try {
        const resposta = await fetch("https://projeto-academico-production.up.railway.app/respostas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        });

        if (!resposta.ok) throw new Error("Erro no servidor");

        const resultado = await resposta.json();
        alert("✅ Respostas enviadas com sucesso!");
        console.log("Servidor respondeu:", resultado);

        // reset
        Object.keys(respostas).forEach((key) => delete respostas[key]);
        indice = 0;
        if (form) form.reset();
        if (dadosPessoais) dadosPessoais.style.display = "block";
        if (questionario) questionario.style.display = "none";
        safeSetWidth(progressBarQ, "0%");

      } catch (erro) {
        console.error("❌ Erro ao enviar:", erro);
        alert("Erro ao enviar respostas. Verifique o servidor.");
      }
    });
  } else {
    console.warn("Botão 'continuar' não encontrado — o click não será processado.");
  }

  // VOLTAR (aplica somente se o botão existir)
  if (voltar) {
    voltar.addEventListener("click", () => {
      if (indice > 0) {
        indice--;
        renderPergunta();
      } else {
        if (questionario) questionario.style.display = "none";
        if (dadosPessoais) dadosPessoais.style.display = "block";
        safeSetWidth(progressBarQ, "0%");
      }
    });
  } else {
    console.warn("Botão 'voltar' não encontrado — a ação de voltar não está disponível.");
  }
});
