// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDsBKVNeE0JDTG0sjQVqkevYA67dTd4OYY",
  authDomain: "pg-iniciativa.firebaseapp.com",
  databaseURL: "https://pg-iniciativa-default-rtdb.firebaseio.com",
  projectId: "pg-iniciativa",
  storageBucket: "pg-iniciativa.appspot.com",
  messagingSenderId: "919106968054",
  appId: "1:919106968054:web:0c39fd1fdf087bf0ed4fd7",
  measurementId: "G-5QJ0FK7Y59"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let papel = null;
let nick = null;
let personagensPorNick = {};
let personagensMesa = [];
let ordemTurnos = [];
let turnoAtual = 0;
let rodada = 1;
let historico = [];
let personagemSelecionadoIndex = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-entrar").addEventListener("click", escolherPapelENick);
  document.getElementById("btn-adicionar-personagem").addEventListener("click", () => {
    adicionarPersonagem();
    salvarPersonagensNoFirebase();
  });
  document.getElementById("btn-adicionar-npc").addEventListener("click", () => {
    adicionarNPC();
    salvarNPCsNoFirebase();
  });
  document.getElementById("btn-comecar-combate").addEventListener("click", iniciarCombate);
  document.getElementById("btn-proximo-turno").addEventListener("click", proximoTurno);
  document.querySelectorAll("#btn-sair").forEach(btn => btn.addEventListener("click", sairDaMesa));

  // Inicializa drag and drop depois que o DOM estiver pronto
  initDragAndDropTurnos();
});

function escolherPapelENick() {
  const radios = document.getElementsByName("papel");
  let papelSelecionado = null;
  for (const r of radios) if (r.checked) papelSelecionado = r.value;
  const nickInput = document.getElementById("input-nick-inicial").value.trim();
  if (!papelSelecionado || !nickInput) return alert("Escolha um papel e digite seu nick.");

  papel = papelSelecionado;
  nick = nickInput;
  if (!personagensPorNick[nick]) personagensPorNick[nick] = [];

  document.getElementById("tela-inicial").classList.add("escondido");
  document.getElementById("tela-personagens").classList.remove("escondido");
  document.getElementById("label-nick-atual").textContent = nick;

  if (papel === "mestre") {
    document.getElementById("controle-mestre").classList.remove("escondido");
    document.getElementById("controle-jogador").classList.add("escondido");
    escutarPersonagensNoFirebase();
    escutarNPCsNoFirebase();
    atualizarListaMesa();
  } else {
    document.getElementById("controle-jogador").classList.remove("escondido");
    document.getElementById("controle-mestre").classList.add("escondido");
    escutarNPCsNoFirebase();
    escutarPersonagensNoFirebase();
    atualizarListaPersonagensUsuario();
    mostrarPainelPersonagem(null);
  }
}

function adicionarPersonagem() {
  if (!nick) {
    alert("Erro: você precisa escolher seu nick primeiro na tela inicial.");
    return;
  }

  if (!personagensPorNick[nick]) personagensPorNick[nick] = [];

  const nome = document.getElementById("input-nome-personagem").value.trim();
  if (!nome) return alert("Nome obrigatório.");

  if (!nome) return alert("Nome obrigatório.");
  const hp = parseInt(document.getElementById("input-hp").value) || 100;
  const san = parseInt(document.getElementById("input-sanidade").value) || 100;
  const extraLabel = document.getElementById("input-extra-label").value.trim();
  const extraValue = parseInt(document.getElementById("input-extra-value").value) || 0;
  const file = document.getElementById("input-imagem-personagem").files[0];

  const personagem = {
    nomePersonagem: nome,
    hp,
    sanidade: san,
    extra: extraLabel ? { label: extraLabel, value: extraValue } : null,
    imagem: null
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      personagem.imagem = reader.result;
      personagensPorNick[nick].push(personagem);
      atualizarListaPersonagensUsuario();
      limparFormularioPersonagem();
      salvarPersonagensNoFirebase();
    };
    reader.readAsDataURL(file);
  } else {
    personagensPorNick[nick].push(personagem);
    atualizarListaPersonagensUsuario();
    limparFormularioPersonagem();
    salvarPersonagensNoFirebase();
  }
}

function limparFormularioPersonagem() {
  ["input-nome-personagem", "input-hp", "input-sanidade", "input-extra-label", "input-extra-value", "input-imagem-personagem"]
    .forEach(id => document.getElementById(id).value = "");
}

function atualizarListaPersonagensUsuario() {
  const container = document.getElementById("lista-personagens-usuario");
  container.innerHTML = "";
  const lista = personagensPorNick[nick] || [];
  if (lista.length === 0) {
    container.textContent = "Nenhum personagem adicionado ainda.";
    mostrarPainelPersonagem(null);
    return;
  }
  lista.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "personagem-card";
    div.innerHTML = `
      ${p.imagem ? `<img src="${p.imagem}" class="avatar" />` : ""}
      <div class="personagem-info">
        <strong>${p.nomePersonagem}</strong><br>
        HP: ${p.hp}<br>
        Sanidade: ${p.sanidade}<br>
        ${p.extra ? `${p.extra.label}: ${p.extra.value}` : ""}
      </div>
      <div>
        <button onclick="selecionarPersonagem(${i})">Selecionar</button>
        <button onclick="removerPersonagemUsuario(${i})">Remover</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function selecionarPersonagem(idx) {
  personagemSelecionadoIndex = idx;
  mostrarPainelPersonagem(personagensPorNick[nick][idx]);
}

function mostrarPainelPersonagem(p) {
  const painel = document.getElementById("painel-jogador");
  if (!p) return painel.innerHTML = "<p>Nenhum personagem selecionado.</p>";
  painel.innerHTML = `
    ${p.imagem ? `<img src="${p.imagem}" class="avatar" />` : ""}
    <p><strong>${p.nomePersonagem}</strong></p>
    <label>HP: <input type="number" value="${p.hp}" onchange="atualizarPersonagemSelecionado('hp', this.value)" /></label>
    <label>Sanidade: <input type="number" value="${p.sanidade}" onchange="atualizarPersonagemSelecionado('sanidade', this.value)" /></label>
    <label>${p.extra ? p.extra.label : 'Extra'}: <input type="number" value="${p.extra ? p.extra.value : 0}" onchange="atualizarPersonagemSelecionado('extra', this.value)" /></label>
  `;
}

function atualizarPersonagemSelecionado(campo, valor) {
  if (personagemSelecionadoIndex === null) return;
  const p = personagensPorNick[nick][personagemSelecionadoIndex];
  const num = parseInt(valor);
  if (isNaN(num)) return;
  if (campo === "hp") p.hp = num;
  else if (campo === "sanidade") p.sanidade = num;
  else if (campo === "extra") {
    if (!p.extra) p.extra = { label: "Extra", value: 0 };
    p.extra.value = num;
  }
  atualizarListaPersonagensUsuario();
  mostrarPainelPersonagem(p);
  salvarPersonagensNoFirebase();
}

function removerPersonagemUsuario(i) {
  if (!confirm("Remover personagem?")) return;
  personagensPorNick[nick].splice(i, 1);
  if (personagemSelecionadoIndex === i) personagemSelecionadoIndex = null;
  atualizarListaPersonagensUsuario();
  mostrarPainelPersonagem(null);
  salvarPersonagensNoFirebase();
}

function adicionarNPC() {
  const nome = document.getElementById("input-nome-npc").value.trim();
  if (!nome) return alert("Nome obrigatório.");
  const hp = parseInt(document.getElementById("input-hp-npc").value) || 100;
  const san = parseInt(document.getElementById("input-sanidade-npc").value) || 100;
  const extraLabel = document.getElementById("input-extra-label-npc").value.trim();
  const extraValue = parseInt(document.getElementById("input-extra-value-npc").value) || 0;

  personagensMesa.push({
    nick: "MESTRE",
    nomePersonagem: nome,
    hp,
    sanidade: san,
    extra: extraLabel ? { label: extraLabel, value: extraValue } : null,
    imagem: null,
    valor: null,
    buffs: []
  });
  atualizarListaMesa();
  limparFormularioNPC();
  salvarNPCsNoFirebase();
}

function limparFormularioNPC() {
  ["input-nome-npc", "input-hp-npc", "input-sanidade-npc", "input-extra-label-npc", "input-extra-value-npc"]
    .forEach(id => document.getElementById(id).value = "");
}

function atualizarListaMesa() {
  const c = document.getElementById("lista-mesa-personagens");
  c.innerHTML = "";
  if (!personagensMesa.length) return c.textContent = "Nenhum personagem na mesa.";
  personagensMesa.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "personagem-card";
    div.innerHTML = `
      ${p.imagem ? `<img src="${p.imagem}" class="avatar" />` : ""}
      <div class="personagem-info">
        <strong>${p.nomePersonagem}</strong><br>
        (Jogador: ${p.nick})<br>
        HP: ${p.hp}<br>
        Sanidade: ${p.sanidade}<br>
        ${p.extra ? `${p.extra.label}: ${p.extra.value}` : ""}<br>
        Ini: ${p.valor !== null ? p.valor : "-"}
      </div>
      <div>
        <button onclick="aplicarDano(${i})">Dano</button><br>
        <button onclick="removerPersonagemMesa(${i})">Remover</button><br>
        <button onclick="adicionarBuffPrompt(${i})">Buff</button>
      </div>
    `;
    c.appendChild(div);
  });
}

function removerPersonagemMesa(i) {
  if (!confirm("Remover da mesa?")) return;
  personagensMesa.splice(i, 1);
  atualizarListaMesa();
  atualizarOrdemTurnosUI();
  salvarNPCsNoFirebase();
}

function adicionarBuffPrompt(i) {
  const d = parseInt(prompt("Buff duração:", "1")) || 0;
  if (d < 1) return alert("Inválido");
  personagensMesa[i].buffs.push({ turnos: d });
  atualizarListaMesa();
  atualizarOrdemTurnosUI();
  salvarNPCsNoFirebase();
}

// Função corrigida - inicia combate garantindo dados atualizados do Firebase
function iniciarCombate() {
  turnoAtual = 0;
  rodada = 1;
  historico = [];

  // Buscar dados atualizados do Firebase antes de iniciar o combate
  db.ref('personagens').once('value').then(snapshot => {
    personagensPorNick = snapshot.val() || {};

    // Guardar NPCs atuais (nick === "MESTRE")
    const npcs = personagensMesa.filter(p => p.nick === "MESTRE");

    personagensMesa = [];

    // Adiciona NPCs à mesa, pedindo iniciativa para cada um
    npcs.forEach(npc => {
      const ini = parseInt(prompt(`Iniciativa de ${npc.nomePersonagem}:`, "0")) || 0;
      npc.valor = ini;
      personagensMesa.push(npc);
    });

    // Adiciona personagens dos jogadores à mesa
    for (const j in personagensPorNick) {
      personagensPorNick[j].forEach(p => {
        personagensMesa.push({
          nick: j,
          nomePersonagem: p.nomePersonagem,
          hp: p.hp,
          sanidade: p.sanidade,
          extra: p.extra ? { ...p.extra } : null,
          imagem: p.imagem,
          valor: null,
          buffs: []
        });
      });
    }

    // Para todos que ainda não têm iniciativa, pedir agora
    personagensMesa.forEach(p => {
      if (p.valor === null) {
        const ini = parseInt(prompt(`Iniciativa de ${p.nomePersonagem}:`, "0")) || 0;
        p.valor = ini;
      }
    });

    ordenarOrdemTurnos();
    atualizarOrdemTurnosUI();

    // Troca de telas para a tela de combate
    document.getElementById("tela-personagens").classList.add("escondido");
    document.getElementById("tela-combate").classList.remove("escondido");
  });
}

function ordenarOrdemTurnos() {
  ordemTurnos = personagensMesa.slice().sort((a, b) => b.valor - a.valor);
}

function atualizarOrdemTurnosUI() {
  const c = document.getElementById("ordem-turnos");
  c.innerHTML = "";
  ordemTurnos.forEach((p, i) => {
    const isNPC = p.nick === "MESTRE";
    const mostrarDetalhes = papel === "mestre" || (!isNPC);
    const div = document.createElement("div");
    div.className = i === turnoAtual ? "turno-ativo personagem-card" : "personagem-card";

    let buffsHtml = "";
    if (p.buffs.length) {
      buffsHtml = "<div class='buffs-container'>" + p.buffs.map(b => `<span class='buff'>[${b.turnos}t]</span>`).join("") + "</div>";
    }

    div.innerHTML = `
      ${p.imagem ? `<img src="${p.imagem}" class="avatar" />` : ""}
      <div class="personagem-info">
        <strong>${p.nomePersonagem}</strong><br>
        (${p.nick})<br>
        ${mostrarDetalhes ? `HP: ${p.hp} SAN: ${p.sanidade}<br>` : ""} 
        ${p.extra && mostrarDetalhes ? `${p.extra.label}: ${p.extra.value}<br>` : ""}
        ${mostrarDetalhes ? `Ini: ${p.valor}` : ""}
        ${buffsHtml}
      </div>
      ${papel === "mestre" ? `
      <div>
        <button onclick="aplicarDano(${i})">Dano</button><br>
        <button onclick="adicionarBuffPrompt(${i})">Buff</button>
      </div>` : ""}
    `;
    c.appendChild(div);
  });
  document.getElementById("contador-rodadas").textContent = rodada;
  atualizarHistoricoUI();
}

function aplicarDano(i) {
  const d = parseInt(prompt("Dano:", "0")) || 0;
  ordemTurnos[i].hp = Math.max(0, ordemTurnos[i].hp - d);
  atualizarOrdemTurnosUI();
  salvarNPCsNoFirebase();
  salvarPersonagensNoFirebase();
}

function proximoTurno() {
  if (!ordemTurnos.length) return;
  historico.push(ordemTurnos[turnoAtual].nomePersonagem);
  ordemTurnos[turnoAtual].buffs = ordemTurnos[turnoAtual].buffs.map(b => ({ turnos: b.turnos - 1 })).filter(b => b.turnos > 0);
  turnoAtual = (turnoAtual + 1) % ordemTurnos.length;
  if (turnoAtual === 0) rodada++;
  atualizarOrdemTurnosUI();
}

function atualizarHistoricoUI() {
  const ul = document.getElementById("historico-turnos");
  ul.innerHTML = "";
  historico.forEach((n, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}º: ${n}`;
    ul.appendChild(li);
  });
}

function sairDaMesa() {
  if (!confirm("Deseja sair da mesa?")) return;
  papel = nick = null;
  personagensPorNick = {};
  personagensMesa = [];
  ordemTurnos = [];
  turnoAtual = 0;
  rodada = 1;
  historico = [];
  personagemSelecionadoIndex = null;
  document.getElementById("tela-inicial").classList.remove("escondido");
  document.getElementById("tela-personagens").classList.add("escondido");
  document.getElementById("tela-combate").classList.add("escondido");
  document.getElementById("input-nick-inicial").value = "";
  document.getElementsByName("papel").forEach(r => r.checked = false);
}

// Botão Terminar Combate
document.addEventListener("DOMContentLoaded", () => {
  const btnTerminar = document.createElement("button");
  btnTerminar.id = "btn-terminar-combate";
  btnTerminar.textContent = "Terminar Combate";
  btnTerminar.style.marginLeft = "10px";
  btnTerminar.addEventListener("click", terminarCombate);
  const btnProximo = document.getElementById("btn-proximo-turno");
  btnProximo.parentNode.insertBefore(btnTerminar, btnProximo.nextSibling);
});

function terminarCombate() {
  // Atualiza personagensPorNick para jogadores
  personagensPorNick = {};
  personagensMesa.forEach(p => {
    if (p.nick !== "MESTRE") {
      if (!personagensPorNick[p.nick]) personagensPorNick[p.nick] = [];
    }
  });
  ordemTurnos.forEach(p => {
    if (p.nick !== "MESTRE") {
      if (!personagensPorNick[p.nick]) personagensPorNick[p.nick] = [];
      const lista = personagensPorNick[p.nick];
      const idx = lista.findIndex(per => per.nomePersonagem === p.nomePersonagem);
      if (idx >= 0) {
        lista[idx] = {
          nomePersonagem: p.nomePersonagem,
          hp: p.hp,
          sanidade: p.sanidade,
          extra: p.extra ? { ...p.extra } : null,
          imagem: p.imagem
        };
      } else {
        lista.push({
          nomePersonagem: p.nomePersonagem,
          hp: p.hp,
          sanidade: p.sanidade,
          extra: p.extra ? { ...p.extra } : null,
          imagem: p.imagem
        });
      }
    }
  });
  salvarPersonagensNoFirebase();

  // Atualiza NPCs para o mestre
  personagensMesa = ordemTurnos.filter(p => p.nick === "MESTRE");
  salvarNPCsNoFirebase();

  // Reseta tela para personagens
  document.getElementById("tela-combate").classList.add("escondido");
  document.getElementById("tela-personagens").classList.remove("escondido");
  atualizarListaMesa();

  alert("Combate encerrado!");
}

// Firebase escuta e salva

function escutarPersonagensNoFirebase() {
  db.ref('personagens').on('value', snapshot => {
    personagensPorNick = snapshot.val() || {};
    if (papel === "mestre") {
      atualizarListaMesa();
    } else {
      atualizarListaPersonagensUsuario();
    }
  });
}

function escutarNPCsNoFirebase() {
  db.ref('npc').on('value', snapshot => {
    const npcArr = snapshot.val() || [];
    personagensMesa = personagensMesa.filter(p => p.nick !== "MESTRE");
    npcArr.forEach(npc => {
      personagensMesa.push({ ...npc, nick: "MESTRE", buffs: npc.buffs || [], valor: npc.valor || null });
    });
    if (papel === "mestre") {
      atualizarListaMesa();
      atualizarOrdemTurnosUI();
    }
  });
}

function salvarPersonagensNoFirebase() {
  const atual = {};
  atual[nick] = personagensPorNick[nick] || [];
  db.ref('personagens').update(atual);
}


function salvarNPCsNoFirebase() {
  const npcs = personagensMesa.filter(p => p.nick === "MESTRE").map(p => {
    const { nick, ...rest } = p;
    return rest;
  });
  db.ref('npc').set(npcs);
}

function initDragAndDropTurnos() {
  const container = document.getElementById("ordem-turnos");
  if (!container) return;

  let dragSrcEl = null;

  function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
  }

  function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDragEnter() {
    this.classList.add('over');
  }

  function handleDragLeave() {
    this.classList.remove('over');
  }

  function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (dragSrcEl !== this) {
      const nodes = Array.from(container.children);
      const srcIndex = nodes.indexOf(dragSrcEl);
      const tgtIndex = nodes.indexOf(this);
      if (srcIndex < 0 || tgtIndex < 0) return false;

      // Reordena ordemTurnos
      const moved = ordemTurnos.splice(srcIndex, 1)[0];
      ordemTurnos.splice(tgtIndex, 0, moved);

      // Ajusta turnoAtual para continuar no personagem correto
      if (turnoAtual === srcIndex) {
        turnoAtual = tgtIndex;
      } else if (srcIndex < turnoAtual && tgtIndex >= turnoAtual) {
        turnoAtual--;
      } else if (srcIndex > turnoAtual && tgtIndex <= turnoAtual) {
        turnoAtual++;
      }

      atualizarOrdemTurnosUI();
    }
    return false;
  }

  function handleDragEnd() {
    Array.from(container.children).forEach(item => {
      item.classList.remove('over');
      item.classList.remove('dragging');
    });
  }

  function addDnDHandlers(item) {
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', handleDragStart, false);
    item.addEventListener('dragenter', handleDragEnter, false);
    item.addEventListener('dragover', handleDragOver, false);
    item.addEventListener('dragleave', handleDragLeave, false);
    item.addEventListener('drop', handleDrop, false);
    item.addEventListener('dragend', handleDragEnd, false);
  }

  // Limpa e adiciona handlers
  Array.from(container.children).forEach(addDnDHandlers);
}

// Atualiza drag and drop após renderizar a lista
const originalAtualizarOrdemTurnosUI = atualizarOrdemTurnosUI;
atualizarOrdemTurnosUI = function() {
  originalAtualizarOrdemTurnosUI();
  initDragAndDropTurnos();
};