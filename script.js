// Import Firebase pelo CDN (modular SDK 9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, updateDoc, deleteDoc, query, where, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// CONFIGURAÇÃO FIREBASE - substitua pelos seus dados do console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDsBKVNeE0JDTG0sjQVqkevYA67dTd4OYY",
  authDomain: "pg-iniciativa.firebaseapp.com",
  projectId: "pg-iniciativa",
  storageBucket: "pg-iniciativa.firebasestorage.app",
  messagingSenderId: "919106968054",
  appId: "1:919106968054:web:0c39fd1fdf087bf0ed4fd7",
  measurementId: "G-5QJ0FK7Y59"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ELEMENTOS HTML
const telaInicial = document.getElementById('tela-inicial');
const telaPersonagens = document.getElementById('tela-personagens');
const telaCombate = document.getElementById('tela-combate');

const labelNickAtual = document.getElementById('label-nick-atual');

const controleJogador = document.getElementById('controle-jogador');
const controleMestre = document.getElementById('controle-mestre');

const listaPersonagensUsuario = document.getElementById('lista-personagens-usuario');
const listaMesaPersonagens = document.getElementById('lista-mesa-personagens');

const inputNickInicial = document.getElementById('input-nick-inicial');

const btnComecarCombateJogador = controleJogador.querySelector('#btn-comecar-combate');
const btnComecarCombateMestre = controleMestre.querySelector('#btn-comecar-combate');

const btnSair = document.getElementById('btn-sair');

const ordemTurnos = document.getElementById('ordem-turnos');
const historicoTurnos = document.getElementById('historico-turnos');
const contadorRodadas = document.getElementById('contador-rodadas');

const vezJogador = document.getElementById('vez-jogador');

// VARIÁVEIS DE CONTROLE
let usuario = null; // { papel: 'mestre' | 'jogador', nick: string }
let personagensUsuario = []; // Personagens do jogador logado
let personagensMesa = [];   // Personagens da mesa (todos)
let turnoAtualIndex = 0;
let rodadaAtual = 1;
let emCombate = false;

// Função para iniciar com papel e nick
window.escolherPapelENick = async function() {
  const papelRadio = document.querySelector('input[name="papel"]:checked');
  const nick = inputNickInicial.value.trim();

  if (!papelRadio) {
    alert('Selecione um papel: Mestre ou Jogador.');
    return;
  }
  if (!nick) {
    alert('Digite seu nick.');
    return;
  }

  usuario = { papel: papelRadio.value, nick };

  labelNickAtual.textContent = `${usuario.nick} (${usuario.papel})`;

  telaInicial.classList.add('escondido');
  telaPersonagens.classList.remove('escondido');

  if (usuario.papel === 'jogador') {
    controleJogador.classList.remove('escondido');
    controleMestre.classList.add('escondido');
    escutarPersonagensUsuario();
  } else {
    controleMestre.classList.remove('escondido');
    controleJogador.classList.add('escondido');
    escutarPersonagensMesa();
  }
};

// ======= FUNÇÕES FIRESTORE =======

// Coleção personagens
const personagensCol = collection(db, 'personagens');

// Escutar personagens do usuário (jogador)
function escutarPersonagensUsuario() {
  const q = query(personagensCol, where('proprietario', '==', usuario.nick));
  onSnapshot(q, (snapshot) => {
    personagensUsuario = [];
    snapshot.forEach(docSnap => {
      personagensUsuario.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderizarPersonagensUsuario();
  });
}

// Escutar todos personagens da mesa (mestre)
function escutarPersonagensMesa() {
  onSnapshot(personagensCol, (snapshot) => {
    personagensMesa = [];
    snapshot.forEach(docSnap => {
      personagensMesa.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderizarPersonagensMesa();
  });
}

// Criar personagem (jogador)
async function criarPersonagemUsuario(nome, hp, sanidade, extraLabel, extraValue) {
  if (!nome) return alert('Digite o nome do personagem.');
  const novoPersonagem = {
    nome,
    hp: Number(hp) || 100,
    sanidade: Number(sanidade) || 100,
    extraLabel: extraLabel || '',
    extraValue: Number(extraValue) || 0,
    proprietario: usuario.nick,
    mestre: false,
    ordemIniciativa: 0
  };

  await addDoc(personagensCol, novoPersonagem);
}

// Criar NPC (mestre)
window.adicionarNPC = async function() {
  const nome = document.getElementById('input-nome-npc').value.trim();
  const hp = Number(document.getElementById('input-hp-npc').value);
  const sanidade = Number(document.getElementById('input-sanidade-npc').value);
  const extraLabel = document.getElementById('input-extra-label-npc').value.trim();
  const extraValue = Number(document.getElementById('input-extra-value-npc').value);

  if (!nome) return alert('Digite o nome do NPC');

  const npc = {
    nome,
    hp: hp || 100,
    sanidade: sanidade || 100,
    extraLabel: extraLabel || '',
    extraValue: extraValue || 0,
    proprietario: 'mestre',
    mestre: true,
    ordemIniciativa: 0
  };

  await addDoc(personagensCol, npc);

  // Limpar inputs
  document.getElementById('input-nome-npc').value = '';
  document.getElementById('input-hp-npc').value = '';
  document.getElementById('input-sanidade-npc').value = '';
  document.getElementById('input-extra-label-npc').value = '';
  document.getElementById('input-extra-value-npc').value = '';
};

// Renderizar lista personagens jogador
function renderizarPersonagensUsuario() {
  listaPersonagensUsuario.innerHTML = '';
  if (personagensUsuario.length === 0) {
    listaPersonagensUsuario.innerHTML = '<p>Você não tem personagens cadastrados.</p>';
    return;
  }

  personagensUsuario.forEach(p => {
    const div = document.createElement('div');
    div.textContent = `${p.nome} - HP: ${p.hp} - Sanidade: ${p.sanidade}` + (p.extraLabel ? ` - ${p.extraLabel}: ${p.extraValue}` : '');
    listaPersonagensUsuario.appendChild(div);
  });
}

// Renderizar lista personagens mesa (mestre)
function renderizarPersonagensMesa() {
  listaMesaPersonagens.innerHTML = '';
  if (personagensMesa.length === 0) {
    listaMesaPersonagens.innerHTML = '<p>Nenhum personagem na mesa.</p>';
    return;
  }

  personagensMesa.forEach(p => {
    const div = document.createElement('div');
    div.textContent = `${p.nome} (Proprietário: ${p.proprietario}) - HP: ${p.hp} - Sanidade: ${p.sanidade}` + (p.extraLabel ? ` - ${p.extraLabel}: ${p.extraValue}` : '');

    // Botão remover (só mestre pode)
    const btnRemover = document.createElement('button');
    btnRemover.textContent = 'Remover';
    btnRemover.style.marginLeft = '10px';
    btnRemover.onclick = () => {
      if (confirm(`Remover personagem ${p.nome}?`)) {
        deleteDoc(doc(db, 'personagens', p.id));
      }
    };

    div.appendChild(btnRemover);
    listaMesaPersonagens.appendChild(div);
  });
}

// Função para jogador criar personagem pelo formulário (controle jogador)
document.getElementById('input-nome-personagem').closest('div').querySelector('button')?.addEventListener('click', () => {});

// Como você não pediu, vou ativar botão para criar personagem:

// O botão de criar personagem do jogador (pode criar uma função para chamar)
btnComecarCombateJogador.addEventListener('click', () => {
  if (personagensUsuario.length === 0) {
    alert('Crie pelo menos um personagem antes de iniciar o combate.');
    return;
  }
  iniciarCombate();
});

btnComecarCombateMestre.addEventListener('click', () => {
  if (personagensMesa.length === 0) {
    alert('Adicione personagens (NPCs) antes de iniciar o combate.');
    return;
  }
  iniciarCombate();
});

// Função para iniciar combate
function iniciarCombate() {
  emCombate = true;
  telaPersonagens.classList.add('escondido');
  telaCombate.classList.remove('escondido');
  turnoAtualIndex = 0;
  rodadaAtual = 1;
  contadorRodadas.textContent = rodadaAtual;

  // Ordem dos turnos pode ser definida aqui - por enquanto ordem do array
  personagensMesa = personagensMesa.sort((a,b) => b.ordemIniciativa - a.ordemIniciativa);

  atualizarOrdemTurnos();
  historicoTurnos.innerHTML = '';
  mostrarTurnoAtual();
}

// Atualizar visual da ordem dos turnos
function atualizarOrdemTurnos() {
  ordemTurnos.innerHTML = '';
  personagensMesa.forEach((p, i) => {
    const div = document.createElement('div');
    div.textContent = `${i+1}. ${p.nome} - HP: ${p.hp} - Sanidade: ${p.sanidade}`;
    if(i === turnoAtualIndex) {
      div.style.fontWeight = 'bold';
      div.style.color = 'yellow';
    }
    ordemTurnos.appendChild(div);
  });
}

// Mostrar informações do turno atual
function mostrarTurnoAtual() {
  const personagem = personagensMesa[turnoAtualIndex];
  vezJogador.classList.toggle('escondido', personagem.proprietario !== usuario.nick);
}

// Avançar para o próximo turno
window.proximoTurno = function() {
  if(!emCombate) return;

  const personagemAtual = personagensMesa[turnoAtualIndex];
  historicoTurnos.innerHTML += `<li>Turno de ${personagemAtual.nome} finalizado.</li>`;

  turnoAtualIndex++;
  if (turnoAtualIndex >= personagensMesa.length) {
    turnoAtualIndex = 0;
    rodadaAtual++;
    contadorRodadas.textContent = rodadaAtual;
    historicoTurnos.innerHTML += `<li>=== Rodada ${rodadaAtual} ===</li>`;
  }

  atualizarOrdemTurnos();
  mostrarTurnoAtual();
}

// Jogador termina sua vez (botão)
window.terminarMinhaVez = function() {
  proximoTurno();
}

// Terminar combate
window.terminarCombate = function() {
  if (!emCombate) return;

  emCombate = false;
  telaCombate.classList.add('escondido');
  telaPersonagens.classList.remove('escondido');
  // Atualiza listas etc se precisar
};

// Sair da mesa (voltar à tela inicial)
window.sairDaMesa = function() {
  if(confirm('Deseja sair da mesa?')) {
    usuario = null;
    personagensUsuario = [];
    personagensMesa = [];
    telaPersonagens.classList.add('escondido');
    telaCombate.classList.add('escondido');
    telaInicial.classList.remove('escondido');
    inputNickInicial.value = '';
    controleJogador.classList.add('escondido');
    controleMestre.classList.add('escondido');
  }
};

// Criação manual de personagem jogador (exemplo simples - você pode melhorar a UI)
document.getElementById('input-nome-personagem').addEventListener('change', async () => {
  const nome = document.getElementById('input-nome-personagem').value.trim();
  const hp = document.getElementById('input-hp').value;
  const sanidade = document.getElementById('input-sanidade').value;
  const extraLabel = document.getElementById('input-extra-label').value;
  const extraValue = document.getElementById('input-extra-value').value;

  if (nome) {
    await criarPersonagemUsuario(nome, hp, sanidade, extraLabel, extraValue);
    document.getElementById('input-nome-personagem').value = '';
    document.getElementById('input-hp').value = '';
    document.getElementById('input-sanidade').value = '';
    document.getElementById('input-extra-label').value = '';
    document.getElementById('input-extra-value').value = '';
  }
});
