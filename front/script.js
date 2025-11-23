document.addEventListener("DOMContentLoaded", () => {
  const dadosPessoais = document.getElementById("dadosPessoais");
  const questionario = document.getElementById("questionario");
  const iniciar = document.getElementById("iniciar");
  const continuar = document.getElementById("continuar");
  const voltar = document.getElementById("voltar");
  const estadoSelect = document.getElementById("estado");
  const perguntaTexto = document.getElementById("perguntaTexto");
  const form = document.getElementById("form");

  // 🔹 Perguntas do questionário
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

  // 🔹 Mapeia os valores numéricos de cada opção
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

  // 🔹 Renderiza pergunta atual
  function renderPergunta() {
    const atual = perguntas[indice];
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
  }

  // 🔹 Iniciar questionário
  iniciar.addEventListener("click", (e) => {
    e.preventDefault();
    const estado = estadoSelect.value.trim();
    const idade = document.getElementById("idade").value.trim();
    const genero = document.getElementById("genero").value.trim();

    if (!estado || !idade || !genero) {
      alert("Por favor, preencha todos os campos!");
      return;
    }

    dadosPessoais.style.display = "none";
    questionario.style.display = "block";
    renderPergunta();
  });

  // 🔹 Continuar
  continuar.addEventListener("click", async (e) => {
    e.preventDefault();
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

    // 🔹 Envia as respostas ao servidor
    const estado = estadoSelect.value.trim();
    const idade = document.getElementById("idade").value.trim();
    const genero = document.getElementById("genero").value.trim();

    const dados = { estado, idade, genero, respostas };

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

      // Resetar tudo
      Object.keys(respostas).forEach((key) => delete respostas[key]);
      indice = 0;
      form.reset();
      dadosPessoais.style.display = "block";
      questionario.style.display = "none";

    } catch (erro) {
      console.error("❌ Erro ao enviar:", erro);
      alert("Erro ao enviar respostas. Verifique o servidor.");
    }
  });

  // 🔹 Voltar
  voltar.addEventListener("click", () => {
    if (indice > 0) {
      indice--;
      renderPergunta();
    } else {
      questionario.style.display = "none";
      dadosPessoais.style.display = "block";
    }
  });
});
