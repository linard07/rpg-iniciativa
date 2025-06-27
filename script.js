let papel, nick, imagemURL = null;
let personagens = [];
let jogadores = [];
let ordemTurnos = [];
let turnoAtual = 0;
let historico = [];
let rodada = 1;

function escolherPapel(tipo) {
  papel = tipo;
  document.getElementById("tela-papel").classList.add("escondido");
  document.getElementById("tela-login").classList.remove("escondido");
  document.getElementById("papelSelecionado").textContent = tipo === 'mestre' ? 'Mestre' : 'Jogador';
}

function adicionarPersonagem() {
  const nickInput = document.getElementById("nick").value.trim();
  const hp = parseInt(document.getElementById("hp").value) || 100;
  const san = parseInt(document.getElementById("sanidade").value) || 100;
  const extraLabel = document.getElementById("extra-label").value.trim();
  const extraValue = parseInt(document.getElementById("extra-value").value) || 0;
  const file = document.getElementById("imagem").files[0];

  if (!nickInput) return alert("Nick obrigatório!");

  const personagem = { nick: nickInput, imagem: null, hp, sanidade: san };

  if (extraLabel) {
    personagem.extra = { label: extraLabel, value: extraValue };
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      personagem.imagem = reader.result;
      personagens.push(personagem);
      atualizarListaPersonagens();
    };
    reader.readAsDataURL(file);
  } else {
    personagens.push(personagem);
    atualizarListaPersonagens();
  }

  document.getElementById("nick").value = '';
  document.getElementById("imagem").value = '';
  document.getElementById("hp").value = '';
  document.getElementById("sanidade").value = '';
  document.getElementById("extra-label").value = '';
  document.getElementById("extra-value").value = '';
}

function atualizarListaPersonagens() {
  const div = document.getElementById("lista-personagens");
  div.innerHTML = '';
  personagens.forEach(p => {
    const item = document.createElement("div");
    item.className = "personagem-card";
    item.innerHTML = `
      ${p.nick} (HP: ${p.hp}, San: ${p.sanidade}${p.extra ? `, ${p.extra.label}: ${p.extra.value}` : ''})
      <button onclick="removerPersonagem('${p.nick}')">Remover</button>
    `;
    div.appendChild(item);
  });
}

function removerPersonagem(nickRemover) {
  personagens = personagens.filter(p => p.nick !== nickRemover);
  atualizarListaPersonagens();
}

function entrarJogo() {
  if (papel === 'mestre') {
    jogadores = [...personagens];
    document.getElementById("tela-login").classList.add("escondido");
    document.getElementById("tela-mestre").classList.remove("escondido");
    mostrarBotaoSair();
  } else {
    const nickInput = document.getElementById("nick").value.trim();
    const file = document.getElementById("imagem").files[0];
    const extraLabel = document.getElementById("extra-label").value.trim();
    const extraValue = parseInt(document.getElementById("extra-value").value) || 0;

    if (!nickInput) return alert("Nick obrigatório!");
    nick = nickInput;
    document.getElementById("meuNick").textContent = nick;

    const novo = {
      nick,
      imagem: null,
      hp: parseInt(document.getElementById("hp").value) || 100,
      sanidade: parseInt(document.getElementById("sanidade").value) || 100
    };

    if (extraLabel) {
      novo.extra = { label: extraLabel, value: extraValue };
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        novo.imagem = reader.result;
        jogadores.push(novo);
        mostrarTelaJogador(novo);
        mostrarBotaoSair();
      };
      reader.readAsDataURL(file);
    } else {
      jogadores.push(novo);
      mostrarTelaJogador(novo);
      mostrarBotaoSair();
    }
  }
}

function mostrarTelaJogador(jogador) {
  document.getElementById("tela-login").classList.add("escondido");
  document.getElementById("tela-jogador").classList.remove("escondido");
  atualizarPainelJogador(jogador);
}

function atualizarPainelJogador(jogador) {
  const painel = document.getElementById("painel-status");

  let barraExtraHTML = '';

  if (jogador.extra) {
    barraExtraHTML = `
      <p>
        ${jogador.extra.label}: 
        <input type="number" value="${jogador.extra.value}" onchange="atualizarStatusPlayer('extra', this.value)" />
        <button onclick="removerBarraExtra()">Remover</button>
      </p>
    `;
  } else {
    barraExtraHTML = `
      <p>
        <input id="novo-extra-label" type="text" placeholder="Nome da barra extra" />
        <input id="novo-extra-valor" type="number" placeholder="Valor" />
        <button onclick="adicionarBarraExtra()">Adicionar barra extra</button>
      </p>
    `;
  }

  painel.innerHTML = `
    ${jogador.imagem ? `<img src="${jogador.imagem}" class="avatar" />` : ""}
    <p>HP: <input type="number" value="${jogador.hp}" onchange="atualizarStatusPlayer('hp', this.value)" /></p>
    <p>Sanidade: <input type="number" value="${jogador.sanidade}" onchange="atualizarStatusPlayer('sanidade', this.value)" /></p>
    ${barraExtraHTML}
  `;
}

function atualizarStatusPlayer(campo, valor) {
  const jogador = jogadores.find(j => j.nick === nick);
  if (campo === 'extra' && jogador.extra) {
    jogador.extra.value = parseInt(valor);
  } else {
    jogador[campo] = parseInt(valor);
  }
  atualizarPainelJogador(jogador);
  renderFila();
}

function adicionarBarraExtra() {
  const label = document.getElementById("novo-extra-label").value.trim();
  const valor = parseInt(document.getElementById("novo-extra-valor").value);

  if (!label) return alert("Nome da barra extra obrigatório!");
  if (isNaN(valor)) return alert("Valor da barra extra inválido!");

  const jogador = jogadores.find(j => j.nick === nick);
  jogador.extra = { label, value: valor };
  atualizarPainelJogador(jogador);
  renderFila();
}

function removerBarraExtra() {
  const jogador = jogadores.find(j => j.nick === nick);
  delete jogador.extra;
  atualizarPainelJogador(jogador);
  renderFila();
}

function mostrarFormularioNPC() {
  document.getElementById("formulario-npc").classList.toggle("escondido");
}

function adicionarNPC() {
  const nick = document.getElementById("npc-nick").value.trim();
  const hp = parseInt(document.getElementById("npc-hp").value) || 100;
  const san = parseInt(document.getElementById("npc-sanidade").value) || 100;
  const label = document.getElementById("npc-extra-label").value.trim();
  const value = parseInt(document.getElementById("npc-extra-value").value) || 0;

  if (!nick) return alert("Nome do NPC é obrigatório!");
  const npc = { nick, imagem: null, hp, sanidade: san };
  if (label) npc.extra = { label, value };
  jogadores.push(npc);
  alert("NPC adicionado!");
}

function pedirIniciativa() {
  document.getElementById("valores-recebidos").classList.remove("escondido");
  ordemTurnos = [];
  turnoAtual = 0;
  historico = [];
  rodada = 1;
  document.getElementById("contador-rodadas").textContent = rodada;
  document.getElementById("lista-iniciativas").innerHTML = '';
  document.getElementById("iniciativa-box")?.classList.remove("escondido");
}

function enviarIniciativa() {
  const valor = parseInt(document.getElementById("valor-iniciativa").value);
  if (isNaN(valor)) return alert("Valor inválido!");
  const jogador = jogadores.find(j => j.nick === nick);
  jogador.valor = valor;
  document.getElementById("iniciativa-box").classList.add("escondido");
}

function iniciarCombate() {
  ordemTurnos = jogadores.filter(j => j.valor !== undefined).sort((a, b) => b.valor - a.valor);
  renderFila();
  document.getElementById("valores-recebidos").classList.add("escondido");
  document.getElementById("combate").classList.remove("escondido");
  avisarJogadorDaVez();
}

function renderFila() {
  const container = document.getElementById("ordem-turnos");
  container.innerHTML = '';
  ordemTurnos.forEach((j, i) => {
    const div = document.createElement("div");
    div.className = i === turnoAtual ? "turno-ativo" : "";
    div.innerHTML = `
      ${j.imagem ? `<img src="${j.imagem}" class="avatar">` : ''}
      <p>${j.nick}<br>HP: ${j.hp}<br>San: ${j.sanidade}${j.extra ? `<br>${j.extra.label}: ${j.extra.value}` : ''}<br>Ini: ${j.valor}</p>
      <button onclick="aplicarDano('${j.nick}')">Dano</button>
    `;
    container.appendChild(div);
  });
}

function aplicarDano(nickAlvo) {
  const alvo = ordemTurnos.find(j => j.nick === nickAlvo);
  const dano = parseInt(prompt("Dano:"));
  if (!isNaN(dano)) {
    alvo.hp = Math.max(0, alvo.hp - dano);
    renderFila();
  }
}

function proximoTurno() {
  historico.push(ordemTurnos[turnoAtual].nick);
  atualizarHistorico();
  turnoAtual++;
  if (turnoAtual >= ordemTurnos.length) {
    turnoAtual = 0;
    rodada++;
    document.getElementById("contador-rodadas").textContent = rodada;
  }
  renderFila();
  avisarJogadorDaVez();
}

function voltarTurno() {
  turnoAtual = (turnoAtual - 1 + ordemTurnos.length) % ordemTurnos.length;
  renderFila();
  avisarJogadorDaVez();
}

function terminarCombate() {
  document.getElementById("combate").classList.add("escondido");
  document.getElementById("tela-mestre").classList.add("escondido");
  document.getElementById("tela-jogador")?.classList.add("escondido");
  document.getElementById("tela-login").classList.remove("escondido");
  personagens = [];
  ordemTurnos = [];
  historico = [];
  esconderBotaoSair();
}

function atualizarHistorico() {
  const ul = document.getElementById("historico-turnos");
  ul.innerHTML = '';
  historico.forEach((nick, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}º - ${nick}`;
    ul.appendChild(li);
  });
}

function avisarJogadorDaVez() {
  const atual = ordemTurnos[turnoAtual];
  if (atual && atual.nick === nick) {
    document.getElementById("vez-jogador").classList.remove("escondido");
  } else {
    document.getElementById("vez-jogador").classList.add("escondido");
  }
}

function terminarMinhaVez() {
  document.getElementById("vez-jogador").classList.add("escondido");
}

function mostrarBotaoSair() {
  document.getElementById("btn-sair").classList.remove("escondido");
}

function esconderBotaoSair() {
  document.getElementById("btn-sair").classList.add("escondido");
}

function sairDaMesa() {
  papel = null;
  nick = null;
  personagens = [];
  jogadores = [];
  ordemTurnos = [];
  turnoAtual = 0;
  historico = [];
  rodada = 1;

  // Esconde todas as telas
  document.getElementById("tela-papel").classList.remove("escondido");
  document.getElementById("tela-login").classList.add("escondido");
  document.getElementById("tela-jogador").classList.add("escondido");
  document.getElementById("tela-mestre").classList.add("escondido");
  document.getElementById("combate").classList.add("escondido");
  document.getElementById("valores-recebidos").classList.add("escondido");
  document.getElementById("formulario-npc").classList.add("escondido");

  // Limpa inputs e listas
  document.getElementById("nick").value = "";
  document.getElementById("imagem").value = "";
  document.getElementById("hp").value = "";
  document.getElementById("sanidade").value = "";
  document.getElementById("extra-label").value = "";
  document.getElementById("extra-value").value = "";
  atualizarListaPersonagens();

  esconderBotaoSair();
}
