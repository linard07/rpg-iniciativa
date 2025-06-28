// Configuração do Firebase
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
  document.getElementById("btn-adicionar-personagem").addEventListener("click", adicionarPersonagem);
  document.getElementById("btn-adicionar-npc").addEventListener("click", adicionarNPC);
  document.getElementById("btn-comecar-combate").addEventListener("click", iniciarCombate);
  document.getElementById("btn-proximo-turno").addEventListener("click", proximoTurno);
  document.querySelectorAll("#btn-sair").forEach(btn => btn.addEventListener("click", sairDaMesa));
});

// === TELA INICIAL ===
function escolherPapelENick() {
  const radios = document.getElementsByName("papel");
  let papelSelecionado = null;
  for (const r of radios) if (r.checked) papelSelecionado = r.value;

  const nickInput = document.getElementById("input-nick-inicial").value.trim();
  if (!papelSelecionado || !nickInput) {
    alert("Escolha um papel e digite seu nick.");
    return;
  }

  papel = papelSelecionado;
  nick = nickInput;
  if (!personagensPorNick[nick]) personagensPorNick[nick] = [];

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

// === CRIAÇÃO DE PERSONAGEM ===
function adicionarPersonagem() {
  const nome = document.getElementById("input-nome-personagem").value.trim();
  if (!nome) return alert("Nome obrigatório.");

  const hp = parseInt(document.getElementById("input-hp").value) || 100;
  const sanidade = parseInt(document.getElementById("input-sanidade").value) || 100;
  const extraLabel = document.getElementById("input-extra-label").value.trim();
  const extraValue = parseInt(document.getElementById("input-extra-value").value) || 0;
  const file = document.getElementById("input-imagem-personagem").files[0];

  const personagem = {
    nomePersonagem: nome,
    hp,
    sanidade,
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
  const lista = personagensPorNick[nick] || [];

  if (lista.length === 0) {
    container.textContent = "Nenhum personagem adicionado ainda.";
    mostrarPainelPersonagem(null);
    return;
  }

  lista.forEach((p, idx) => {
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
        <button onclick="selecionarPersonagem(${idx})">Selecionar</button>
        <button onclick="removerPersonagemUsuario(${idx})">Remover</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function selecionarPersonagem(idx) {
  personagemSelecionadoIndex = idx;
  const p = personagensPorNick[nick][idx];
  mostrarPainelPersonagem(p);
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
}

function removerPersonagemUsuario(idx) {
  if (!confirm("Remover este personagem?")) return;
  personagensPorNick[nick].splice(idx, 1);
  if (personagemSelecionadoIndex === idx) personagemSelecionadoIndex = null;
  atualizarListaPersonagensUsuario();
  mostrarPainelPersonagem(null);
}

// === NPCs DO MESTRE ===
function adicionarNPC() {
  const nome = document.getElementById("input-nome-npc").value.trim();
  if (!nome) return alert("Nome obrigatório.");
  const hp = parseInt(document.getElementById("input-hp-npc").value) || 100;
  const san = parseInt(document.getElementById("input-sanidade-npc").value) || 100;
  const extraLabel = document.getElementById("input-extra-label-npc").value.trim();
  const extraValue = parseInt(document.getElementById("input-extra-value-npc").value) || 0;

  const npc = {
    nick: "MESTRE",
    nomePersonagem: nome,
    hp,
    sanidade: san,
    extra: extraLabel ? { label: extraLabel, value: extraValue } : null,
    imagem: null,
    valor: null,
    buffs: []
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

function atualizarListaMesa() {
  const c = document.getElementById("lista-mesa-personagens");
  c.innerHTML = "";
  if (personagensMesa.length === 0) {
    c.textContent = "Nenhum personagem na mesa.";
    return;
  }
  personagensMesa.forEach((p, idx) => {
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
        <button onclick="removerPersonagemMesa(${idx})">Remover</button><br>
        <button onclick="adicionarBuffPrompt(${idx})">Buff</button>
      </div>
    `;
    c.appendChild(div);
  });
}

function removerPersonagemMesa(i) {
  if (!confirm("Remover da mesa?")) return;
  personagensMesa.splice(i, 1);
  if (turnoAtual >= personagensMesa.length) turnoAtual = 0;
  atualizarListaMesa();
  atualizarOrdemTurnosUI();
}

function adicionarBuffPrompt(i) {
  let d = parseInt(prompt("Duração do buff (turnos):", "1")) || 0;
  if (d < 1) return alert("Inválido");
  personagensMesa[i].buffs.push({ turnos: d });
  atualizarListaMesa();
  atualizarOrdemTurnosUI();
}

// === COMBATE ===
function iniciarCombate() {
  turnoAtual = 0;
  rodada = 1;
  historico = [];

  const npcs = personagensMesa.filter(p => p.nick === "MESTRE");
  personagensMesa = [];

  npcs.forEach(npc => {
    let ini = parseInt(prompt(`Iniciativa NPC ${npc.nomePersonagem}:`, "0")) || 0;
    npc.valor = ini;
    npc.buffs = [];
    personagensMesa.push(npc);
  });

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

  personagensMesa.forEach(p => {
    if (p.valor === null) {
      let ini = parseInt(prompt(`Iniciativa ${p.nomePersonagem} (${p.nick}):`, "0")) || 0;
      p.valor = ini;
    }
  });

  ordenarOrdemTurnos();
  atualizarListaMesa();
  atualizarOrdemTurnosUI();

  document.getElementById("tela-personagens").classList.add("escondido");
  document.getElementById("tela-combate").classList.remove("escondido");
}

function ordenarOrdemTurnos() {
  ordemTurnos = personagensMesa.slice().sort((a, b) => b.valor - a.valor);
}

function atualizarOrdemTurnosUI() {
  const c = document.getElementById("ordem-turnos");
  c.innerHTML = "";
  ordemTurnos.forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = idx === turnoAtual ? "turno-ativo personagem-card" : "personagem-card";
    let buffsHtml = "";
    if (p.buffs.length) {
      buffsHtml = "<div class='buffs-container'>";
      p.buffs.forEach(b => buffsHtml += `<span class='buff'>[${b.turnos}t]</span>`);
      buffsHtml += "</div>";
    }
    div.innerHTML = `
      ${p.imagem ? `<img src="${p.imagem}" class="avatar" />` : ""}
      <div class="personagem-info">
        <strong>${p.nomePersonagem}</strong><br>
        (${p.nick})<br>
        HP: ${p.hp} SAN: ${p.sanidade}<br>
        ${p.extra ? `${p.extra.label}: ${p.extra.value}<br>` : ""}
        Ini: ${p.valor}<br>
        ${buffsHtml}
      </div>
      <div>
        <button onclick="aplicarDano(${idx})">Dano</button><br>
        <button onclick="adicionarBuffPromptMesa(${idx})">Buff</button>
      </div>
    `;
    c.appendChild(div);
  });
  document.getElementById("contador-rodadas").textContent = rodada;
  atualizarHistoricoUI();
}

function aplicarDano(i) {
  let d = parseInt(prompt("Dano:", "0")) || 0;
  ordemTurnos[i].hp = Math.max(0, ordemTurnos[i].hp - d);
  atualizarOrdemTurnosUI();
}

function adicionarBuffPromptMesa(i) {
  let d = parseInt(prompt("Buff turnos:", "1")) || 0;
  if (d < 1) return alert("Inválido");
  ordemTurnos[i].buffs.push({ turnos: d });
  atualizarOrdemTurnosUI();
}

function proximoTurno() {
  if (!ordemTurnos.length) return;
  historico.push(ordemTurnos[turnoAtual].nomePersonagem);
  ordemTurnos[turnoAtual].buffs = ordemTurnos[turnoAtual]
    .buffs.map(b => ({ turnos: b.turnos - 1 }))
    .filter(b => b.turnos > 0);
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

// === SAIR ===
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
  document.getElementById("tela-combate").classList.add("escondido");
  document.getElementById("tela-personagens").classList.add("escondido");
  document.getElementById("tela-inicial").classList.remove("escondido");
  document.getElementById("input-nick-inicial").value = "";
  document.getElementsByName("papel").forEach(r => r.checked = false);
}
