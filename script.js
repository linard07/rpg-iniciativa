// Configuração do Firebase para uso direto no navegador
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

// Inicialização compatível com navegador
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variáveis globais
let papel = null; // 'mestre' ou 'jogador'
let nick = null;  // nick do jogador
let personagensPorNick = {}; // objeto com arrays de personagens por nick
let personagensMesa = []; // personagens presentes na mesa (jogadores + NPCs)
let ordemTurnos = [];
let turnoAtual = 0;
let rodada = 1;
let historico = [];

// Para controle de seleção de personagem do jogador
let personagemSelecionadoIndex = null;

// Para facilitar referência aos elementos
const telaInicial = document.getElementById("tela-inicial");
const telaPersonagens = document.getElementById("tela-personagens");
const telaCombate = document.getElementById("tela-combate");

const labelNickAtual = document.getElementById("label-nick-atual");

const controleJogador = document.getElementById("controle-jogador");
const controleMestre = document.getElementById("controle-mestre");

const listaPersonagensUsuario = document.getElementById("lista-personagens-usuario");
const listaMesaPersonagens = document.getElementById("lista-mesa-personagens");

const painelJogador = document.getElementById("painel-jogador");

const ordemTurnosContainer = document.getElementById("ordem-turnos");
const historicoTurnosUl = document.getElementById("historico-turnos");
const contadorRodadasSpan = document.getElementById("contador-rodadas");
const vezJogadorDiv = document.getElementById("vez-jogador");

// Permite ENTER no input nick inicial
document.getElementById("input-nick-inicial").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    escolherPapelENick();
  }
});

// Permite ENTER no nome personagem
document.getElementById("input-nome-personagem").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    adicionarPersonagem();
  }
});

// Permite ENTER no nome NPC
document.getElementById("input-nome-npc").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    adicionarNPC();
  }
});

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

  if (!personagensPorNick[nick]) {
    personagensPorNick[nick] = [];
  }

  telaInicial.classList.add("escondido");
  telaPersonagens.classList.remove("escondido");
  labelNickAtual.textContent = nick;

  if (papel === "mestre") {
    controleMestre.classList.remove("escondido");
    controleJogador.classList.add("escondido");
    atualizarListaMesa();
  } else {
    controleJogador.classList.remove("escondido");
    controleMestre.classList.add("escondido");
    atualizarListaPersonagensUsuario();
    mostrarPainelPersonagem(null);
  }
}

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
  listaPersonagensUsuario.innerHTML = "";
  const lista = personagensPorNick[nick];

  if (!lista || lista.length === 0) {
    listaPersonagensUsuario.textContent = "Nenhum personagem adicionado ainda.";
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
    listaPersonagensUsuario.appendChild(div);
  });
}

function selecionarPersonagem(idx) {
  personagemSelecionadoIndex = idx;
  const p = personagensPorNick[nick][idx];
  mostrarPainelPersonagem(p);
}

function mostrarPainelPersonagem(p) {
  if (!p) {
    painelJogador.innerHTML = "<p>Nenhum personagem selecionado.</p>";
    return;
  }

  painelJogador.innerHTML = `
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

  atualizarListaPersonagensUsuario();
  mostrarPainelPersonagem(personagem);
}

function removerPersonagemUsuario(idx) {
  if (!confirm("Remover este personagem?")) return;
  personagensPorNick[nick].splice(idx, 1);
  if (personagemSelecionadoIndex === idx) personagemSelecionadoIndex = null;
  atualizarListaPersonagensUsuario();
  mostrarPainelPersonagem(null);
}

// Mestre adiciona NPC na mesa
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
    imagem: null,
    valor: null
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
  listaMesaPersonagens.innerHTML = "";
  if (personagensMesa.length === 0) {
    listaMesaPersonagens.textContent = "Nenhum personagem na mesa.";
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
        <br/>Iniciativa: ${p.valor !== null ? p.valor : '-'}
      </div>
      <div>
        <button onclick="removerPersonagemMesa(${idx})">Remover</button>
      </div>
    `;
    listaMesaPersonagens.appendChild(div);
  });
}

function removerPersonagemMesa(idx) {
  if (!confirm("Remover este personagem da mesa?")) return;
  personagensMesa.splice(idx, 1);
  atualizarListaMesa();
}

// Função para iniciar combate
async function iniciarCombate() {
  turnoAtual = 0;
  rodada = 1;
  historico = [];

  if (papel === "mestre") {
    // Filtra só NPCs
    const npcsAtuais = personagensMesa.filter(p => p.nick === "MESTRE");

    personagensMesa = [];

    // Mestre digita iniciativa para cada NPC
    for (let npc of npcsAtuais) {
      let iniStr = prompt(`Informe a iniciativa para NPC ${npc.nomePersonagem} (mestre):`, "0");
      let iniVal = parseInt(iniStr);
      npc.valor = isNaN(iniVal) ? 0 : iniVal;
      personagensMesa.push(npc);
    }

    // Adiciona personagens de todos os jogadores com iniciativa null (para cada jogador)
    for (const jogador in personagensPorNick) {
      personagensPorNick[jogador].forEach(p => {
        personagensMesa.push({
          nick: jogador,
          nomePersonagem: p.nomePersonagem,
          hp: p.hp,
          sanidade: p.sanidade,
          extra: p.extra ? {...p.extra} : null,
          imagem: p.imagem,
          valor: null
        });
      });
    }

    alert("Mestre inseriu iniciativas dos NPCs.\nAgora cada jogador deve iniciar o combate para inserir as iniciativas dos seus personagens.");

  } else {
    // Jogador precisa ter pelo menos um personagem
    if (!personagensPorNick[nick] || personagensPorNick[nick].length === 0) {
      alert("Você precisa adicionar pelo menos um personagem para entrar no combate.");
      return;
    }

    // Mantém NPCs do mestre na mesa (se já estiverem)
    personagensMesa = personagensMesa.filter(p => p.nick === "MESTRE");

    // Adiciona personagens do jogador com iniciativa null, se não estiverem
    personagensPorNick[nick].forEach(p => {
      const existe = personagensMesa.find(pm => pm.nick === nick && pm.nomePersonagem === p.nomePersonagem);
      if (!existe) {
        personagensMesa.push({
          nick,
          nomePersonagem: p.nomePersonagem,
          hp: p.hp,
          sanidade: p.sanidade,
          extra: p.extra ? {...p.extra} : null,
          imagem: p.imagem,
          valor: null
        });
      }
    });

    // Pede iniciativa para personagens do jogador sem iniciativa
    for (let p of personagensMesa) {
      if (p.nick === nick && p.valor === null) {
        let iniStr = prompt(`Informe a iniciativa para seu personagem ${p.nomePersonagem}:`, "0");
        let iniVal = parseInt(iniStr);
        p.valor = isNaN(iniVal) ? 0 : iniVal;
      }
    }

    alert("Iniciativas enviadas! Aguarde o mestre iniciar o combate.");
  }

  atualizarListaMesa();
  ordenarOrdemTurnos();
  atualizarOrdemTurnosUI();

  telaPersonagens.classList.add("escondido");
  telaCombate.classList.remove("escondido");
}

// Ordena ordemTurnos pelo valor da iniciativa do maior para o menor
function ordenarOrdemTurnos() {
  ordemTurnos = personagensMesa.filter(p => p.valor !== null);
  ordemTurnos.sort((a, b) => b.valor - a.valor);
}

// Atualiza a UI da ordem de turnos
function atualizarOrdemTurnosUI() {
  ordemTurnosContainer.innerHTML = "";

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
    ordemTurnosContainer.appendChild(div);
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
    contadorRodadasSpan.textContent = rodada;
  }
  atualizarOrdemTurnosUI();
}

function terminarMinhaVez() {
  vezJogadorDiv.classList.add("escondido");
  proximoTurno();
}

function mostrarVezJogador() {
  const atual = ordemTurnos[turnoAtual];
  if (!atual) {
    vezJogadorDiv.classList.add("escondido");
    return;
  }

  if (papel === "jogador" && atual.nick === nick) {
    vezJogadorDiv.classList.remove("escondido");
  } else {
    vezJogadorDiv.classList.add("escondido");
  }
}