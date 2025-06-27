// Variáveis globais
let papel = null; // 'mestre' ou 'jogador'
let nick = null;  // nick do jogador
let personagensPorNick = {}; // objeto com arrays de personagens por nick
let personagensMesa = []; // personagens presentes na mesa (jogadores + NPCs)
let ordemTurnos = [];
let turnoAtual = 0;
let rodada = 1;
let historico = [];

// Escolher papel e nick no início
function escolherPapelENick() {
  const radios = document.getElementsByName("papel");
  let papelSelecionado = null;
  for (const r of radios) {
    if (r.checked) {
      papelSelecionado = r.value;
      break;
    }
  }

  const nickInput = document.getElementById("input-nick-inicial").value.trim();
  if (!papelSelecionado) {
    alert("Escolha um papel: Mestre ou Jogador.");
    return;
  }
  if (!nickInput) {
    alert("Digite seu nick.");
    return;
  }

  papel = papelSelecionado;
  nick = nickInput;

  // Inicializa o array de personagens para esse nick se não existir
  if (!personagensPorNick[nick]) {
    personagensPorNick[nick] = [];
  }

  // Atualiza UI
  document.getElementById("tela-inicial").classList.add("escondido");
  document.getElementById("tela-personagens").classList.remove("escondido");
  document.getElementById("label-nick-atual").textContent = nick;

  if (papel === "mestre") {
    document.getElementById("controle-mestre").classList.remove("escondido");
    document.getElementById("controle-jogador").classList.add("escondido");
    atualizarListaMesa();
  } else {
    document.getElementById("controle-jogador").classList.remove("escondido");
    document.getElementById("controle-mestre").classList.add("escondido");
    atualizarListaPersonagensUsuario();
    mostrarPainelPersonagem(null);
  }
}

// Adicionar personagem para o jogador logado
function adicionarPersonagem() {
  const nome = document.getElementById("input-nome-personagem").value.trim();
  if (!nome) {
    alert("Nome do personagem é obrigatório.");
    return;
  }
  const hp = parseInt(document.getElementById("input-hp").value);
  const sanidade = parseInt(document.getElementById("input-sanidade").value);
  const extraLabel = document.getElementById("input-extra-label").value.trim();
  const extraValue = parseInt(document.getElementById("input-extra-value").value);
  const fileInput = document.getElementById("input-imagem-personagem");
  const file = fileInput.files[0];

  const personagem = {
    nomePersonagem: nome,
    hp: isNaN(hp) ? 100 : hp,
    sanidade: isNaN(sanidade) ? 100 : sanidade,
    extra: extraLabel ? { label: extraLabel, value: isNaN(extraValue) ? 0 : extraValue } : null,
    imagem: null
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      personagem.imagem = reader.result;
      personagensPorNick[nick].push(personagem);
      atualizarListaPersonagensUsuario();
      limparFormularioPersonagem();
    };
    reader.readAsDataURL(file);
  } else {
    personagensPorNick[nick].push(personagem);
    atualizarListaPersonagensUsuario();
    limparFormularioPersonagem();
  }
}

function limparFormularioPersonagem() {
  document.getElementById("input-nome-personagem").value = "";
  document.getElementById("input-hp").value = "";
  document.getElementById("input-sanidade").value = "";
  document.getElementById("input-extra-label").value = "";
  document.getElementById("input-extra-value").value = "";
  document.getElementById("input-imagem-personagem").value = "";
}

function atualizarListaPersonagensUsuario() {
  const container = document.getElementById("lista-personagens-usuario");
  container.innerHTML = "";
  const lista = personagensPorNick[nick];

  if (!lista || lista.length === 0) {
    container.textContent = "Nenhum personagem adicionado ainda.";
    mostrarPainelPersonagem(null);
    return;
  }

  lista.forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = "personagem-card";

    div.innerHTML = `
      ${p.imagem ? `<img src="${p.imagem}" class="avatar" alt="Avatar do personagem" />` : ""}
      <div class="personagem-info">
        <strong>${p.nomePersonagem}</strong><br/>
        HP: ${p.hp}<br/>
        Sanidade: ${p.sanidade}<br/>
        ${p.extra ? `${p.extra.label}: ${p.extra.value}` : ""}
      </div>
      <div>
        <button onclick="selecionarPersonagem(${idx})">Selecionar</button>
        <button onclick="removerPersonagemUsuario(${idx})">Remover</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// Selecionar personagem para ver/editar no painel
let personagemSelecionadoIndex = null;

function selecionarPersonagem(idx) {
  personagemSelecionadoIndex = idx;
  const p = personagensPorNick[nick][idx];
  mostrarPainelPersonagem(p);
}

function mostrarPainelPersonagem(p) {
  const painel = document.getElementById("painel-jogador");
  if (!p) {
    painel.innerHTML = "<p>Nenhum personagem selecionado.</p>";
    return;
  }

  painel.innerHTML = `
    ${p.imagem ? `<img src="${p.imagem}" class="avatar" alt="Avatar do personagem" />` : ""}
    <p><strong>${p.nomePersonagem}</strong></p>
    <label>HP: <input type="number" id="painel-hp" value="${p.hp}" onchange="atualizarPersonagemSelecionado('hp', this.value)" /></label>
    <label>Sanidade: <input type="number" id="painel-sanidade" value="${p.sanidade}" onchange="atualizarPersonagemSelecionado('sanidade', this.value)" /></label>
    <label>${p.extra ? p.extra.label : 'Barra extra:'} <input type="number" id="painel-extra" value="${p.extra ? p.extra.value : 0}" onchange="atualizarPersonagemSelecionado('extra', this.value)" /></label>
  `;
}

function atualizarPersonagemSelecionado(campo, valor) {
  if (personagemSelecionadoIndex === null) return;
  const personagem = personagensPorNick[nick][personagemSelecionadoIndex];
  if (!personagem) return;

  const num = parseInt(valor);
  if (isNaN(num)) return;

  if (campo === "hp") personagem.hp = num;
  else if (campo === "sanidade") personagem.sanidade = num;
  else if (campo === "extra") {
    if (!personagem.extra) personagem.extra = { label: "Barra extra", value: 0 };
    personagem.extra.value = num;
  }

  // Atualiza lista e painel
  atualizarListaPersonagensUsuario();
  mostrarPainelPersonagem(personagem);
}

// Remover personagem do jogador
function removerPersonagemUsuario(idx) {
  if (!confirm("Remover este personagem?")) return;
  personagensPorNick[nick].splice(idx, 1);
  if (personagemSelecionadoIndex === idx) personagemSelecionadoIndex = null;
  atualizarListaPersonagensUsuario();
  mostrarPainelPersonagem(null);
}

// Mestre adiciona personagem (NPC) na mesa
function adicionarNPC() {
  const nome = document.getElementById("input-nome-npc").value.trim();
  if (!nome) {
    alert("Nome do NPC é obrigatório.");
    return;
  }
  const hp = parseInt(document.getElementById("input-hp-npc").value);
  const sanidade = parseInt(document.getElementById("input-sanidade-npc").value);
  const extraLabel = document.getElementById("input-extra-label-npc").value.trim();
  const extraValue = parseInt(document.getElementById("input-extra-value-npc").value);

  const npc = {
    nick: "MESTRE",
    nomePersonagem: nome,
    hp: isNaN(hp) ? 100 : hp,
    sanidade: isNaN(sanidade) ? 100 : sanidade,
    extra: extraLabel ? { label: extraLabel, value: isNaN(extraValue) ? 0 : extraValue } : null,
    imagem: null
  };

  personagensMesa.push(npc);
  atualizarListaMesa();
  limparFormularioNPC();
}

function limparFormularioNPC() {
  document.getElementById("input-nome-npc").value = "";
  document.getElementById("input-hp-npc").value = "";
  document.getElementById("input-sanidade-npc").value = "";
  document.getElementById("input-extra-label-npc").value = "";
  document.getElementById("input-extra-value-npc").value = "";
}

// Atualizar lista de personagens na mesa (mestre)
function atualizarListaMesa() {
  const container = document.getElementById("lista-mesa-personagens");
  container.innerHTML = "";
  if (personagensMesa.length === 0) {
    container.textContent = "Nenhum personagem na mesa.";
    return;
  }

  personagensMesa.forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = "personagem-card";
    div.innerHTML = `
      ${p.imagem ? `<img src="${p.imagem}" class="avatar" alt="Avatar do personagem" />` : ""}
      <div class="personagem-info">
        <strong>${p.nomePersonagem}</strong><br/>
        (Jogador: ${p.nick})<br/>
        HP: ${p.hp}<br/>
        Sanidade: ${p.sanidade}<br/>
        ${p.extra ? `${p.extra.label}: ${p.extra.value}` : ""}
      </div>
      <div>
        <button onclick="removerPersonagemMesa(${idx})">Remover</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function removerPersonagemMesa(idx) {
  if (!confirm("Remover este personagem da mesa?")) return;
  personagensMesa.splice(idx, 1);
  atualizarListaMesa();
}

// Entrar no combate (mestre inicia)
function iniciarCombate() {
  // Para jogadores: garantir que o jogador tenha pelo menos 1 personagem na mesa
  if (papel === "jogador" && (!personagensPorNick[nick] || personagensPorNick[nick].length === 0)) {
    alert("Você precisa adicionar pelo menos um personagem para entrar no combate.");
    return;
  }

  // Reset turno e rodada
  turnoAtual = 0;
  rodada = 1;
  historico = [];

  // Preencher personagensMesa com personagens do mestre e de todos jogadores
  personagensMesa = [];

  // Jogadores adicionam seus personagens à mesa (por enquanto só do jogador logado)
  if (papel === "jogador") {
    personagensPorNick[nick].forEach(p => {
      personagensMesa.push({
        nick,
        nomePersonagem: p.nomePersonagem,
        hp: p.hp,
        sanidade: p.sanidade,
        extra: p.extra ? {...p.extra} : null,
        imagem: p.imagem,
        valor: null // Iniciativa
      });
    });
  } else {
    // Mestre: mantém personagensMesa já adicionados, só reseta iniciativa e ordena depois
    personagensMesa.forEach(p => p.valor = null);
  }

  // Mostrar tela combate
  document.getElementById("tela-personagens").classList.add("escondido");
  document.getElementById("tela-combate").classList.remove("escondido");
  atualizarOrdemTurnosUI();

  alert("Peça para os jogadores enviarem suas iniciativas!");
}

// Jogador envia iniciativa
function enviarIniciativa(valor) {
  valor = parseInt(valor);
  if (isNaN(valor)) {
    alert("Valor inválido!");
    return;
  }

  // Achar personagem na mesa para este nick
  const personagensJogador = personagensMesa.filter(p => p.nick === nick);
  if (personagensJogador.length === 0) {
    alert("Nenhum personagem seu na mesa.");
    return;
  }

  // Para simplicidade, vamos pedir iniciativa por personagem (isso pode ser melhorado)
  // Aqui só atribuímos a iniciativa para todos personagens do jogador com o mesmo valor
  personagensJogador.forEach(p => p.valor = valor);

  alert("Iniciativa enviada! Aguarde o mestre iniciar o combate.");
}

// Ordenar e mostrar ordem de turnos
function atualizarOrdemTurnosUI() {
  ordemTurnos = personagensMesa.filter(p => p.valor !== null).sort((a, b) => b.valor - a.valor);
  const container = document.getElementById("ordem-turnos");
  container.innerHTML = "";

  ordemTurnos.forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = (idx === turnoAtual) ? "turno-ativo personagem-card" : "personagem-card";
    div.innerHTML = `
      ${p.imagem ? `<img src="${p.imagem}" class="avatar" alt="Avatar do personagem" />` : ""}
      <div class="personagem-info">
        <strong>${p.nomePersonagem}</strong><br/>
        (Jogador: ${p.nick})<br/>
        HP: ${p.hp}<br/>
        Sanidade: ${p.sanidade}<br/>
        ${p.extra ? `${p.extra.label}: ${p.extra.value}` : ""}
        <br/>Iniciativa: ${p.valor}
      </div>
      <div>
        <button onclick="aplicarDano(${idx})">Dano</button>
      </div>
    `;
    container.appendChild(div);
  });

  atualizarHistoricoUI();
  mostrarVezJogador();
}

function aplicarDano(idx) {
  const danoStr = prompt("Digite o dano:");
  const dano = parseInt(danoStr);
  if (isNaN(dano) || dano < 0) return alert("Valor inválido!");

  ordemTurnos[idx].hp = Math.max(0, ordemTurnos[idx].hp - dano);
  atualizarOrdemTurnosUI();
}

function proximoTurno() {
  if (ordemTurnos.length === 0) return;

  historico.push(ordemTurnos[turnoAtual].nomePersonagem);
  turnoAtual++;
  if (turnoAtual >= ordemTurnos.length) {
    turnoAtual = 0;
    rodada++;
    document.getElementById("contador-rodadas").textContent = rodada;
  }
  atualizarOrdemTurnosUI();
}

function terminarMinhaVez() {
  document.getElementById("vez-jogador").classList.add("escondido");
  proximoTurno();
}

function mostrarVezJogador() {
  const atual = ordemTurnos[turnoAtual];
  if (!atual) return document.getElementById("vez-jogador").classList.add("escondido");

  if (papel === "jogador" && atual.nick === nick) {
    document.getElementById("vez-jogador").classList.remove("escondido");
  } else {
    document.getElementById("vez-jogador").classList.add("escondido");
  }
}

function atualizarHistoricoUI() {
  const ul = document.getElementById("historico-turnos");
  ul.innerHTML = "";
  historico.forEach((nomePersonagem, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}º - ${nomePersonagem}`;
    ul.appendChild(li);
  });
}

// Terminar combate e voltar para tela de personagens
function terminarCombate() {
  // Atualiza status dos personagens (mescla o que está no combate de volta no personagem original)
  if (papel === "jogador") {
    // Atualiza os personagens do jogador com os valores atuais da mesa
    personagensMesa.forEach(pMesa => {
      if (pMesa.nick === nick) {
        const listaJogador = personagensPorNick[nick];
        const personagemOriginal = listaJogador.find(p => p.nomePersonagem === pMesa.nomePersonagem);
        if (personagemOriginal) {
          personagemOriginal.hp = pMesa.hp;
          personagemOriginal.sanidade = pMesa.sanidade;
          if (pMesa.extra) {
            personagemOriginal.extra = {...pMesa.extra};
          } else {
            personagemOriginal.extra = null;
          }
        }
      }
    });
  }

  // Limpa estado de combate e volta para tela de personagens
  ordemTurnos = [];
  turnoAtual = 0;
  rodada = 1;
  historico = [];

  document.getElementById("tela-combate").classList.add("escondido");
  document.getElementById("tela-personagens").classList.remove("escondido");
  atualizarListaPersonagensUsuario();
  atualizarListaMesa();
  mostrarPainelPersonagem(null);
}

// Sair da mesa - limpa tudo
function sairDaMesa() {
  papel = null;
  nick = null;
  personagensPorNick = {};
  personagensMesa = [];
  ordemTurnos = [];
  turnoAtual = 0;
  rodada = 1;
  historico = [];

  document.getElementById("tela-inicial").classList.remove("escondido");
  document.getElementById("tela-personagens").classList.add("escondido");
  document.getElementById("tela-combate").classList.add("escondido");
  document.getElementById("controle-jogador").classList.add("escondido");
  document.getElementById("controle-mestre").classList.add("escondido");
  document.getElementById("lista-personagens-usuario").innerHTML = "";
  document.getElementById("lista-mesa-personagens").innerHTML = "";
  document.getElementById("painel-jogador").innerHTML = "<p>Nenhum personagem selecionado.</p>";
  document.getElementById("input-nick-inicial").value = "";
  document.querySelectorAll('input[name="papel"]').forEach(i => i.checked = false);
}
