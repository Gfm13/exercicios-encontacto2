/**
 * Testes do questionário: conferem se página, gabarito gerado e correção
 * continuam coerentes entre si.
 *
 *   node ferramentas/testar.mjs
 *
 * Não precisa de internet, navegador nem das contas do Google.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerExercicios, montarItens, gerarGabaritoGs } from './gerar-gabarito.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (...p) => fs.readFileSync(path.join(RAIZ, ...p), 'utf8');

let falhas = 0;
function checar(condicao, descricao, detalhe) {
  if (condicao) {
    console.log('  ok   ' + descricao);
  } else {
    falhas++;
    console.error('  FALHOU  ' + descricao + (detalhe ? ' — ' + detalhe : ''));
  }
}

/** Executa o <script> da página com um DOM mínimo, só para inspecionar o HTML gerado. */
function executarPagina(html) {
  const secoes = [];
  const porId = new Map();

  function elemento(tag) {
    return {
      tagName: String(tag).toUpperCase(),
      id: '', className: '', innerHTML: '', textContent: '', value: '', disabled: false,
      dataset: {}, style: {}, children: [],
      name: '', action: '', method: '', target: '', type: '',
      appendChild(filho) {
        this.children.push(filho);
        if (this.id === 'ex') secoes.push(filho.innerHTML);
        return filho;
      },
      remove() {},
      addEventListener() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      classList: { add() {}, remove() {} },
      focus() {},
      submit() {}
    };
  }

  const documento = {
    getElementById(id) {
      if (!porId.has(id)) {
        const el = elemento('div');
        el.id = id;
        porId.set(id, el);
      }
      return porId.get(id);
    },
    createElement: elemento,
    querySelectorAll() { return []; },
    body: elemento('body')
  };

  const armazem = new Map();
  const localStorage = {
    getItem: (k) => (armazem.has(k) ? armazem.get(k) : null),
    setItem: (k, v) => armazem.set(k, String(v))
  };

  const script = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!script) throw new Error('Nenhum <script> encontrado no index.html');

  const fabrica = new Function(
    'document', 'localStorage', 'location', 'confirm', 'fetch',
    script[1] + '\nreturn { norm, strip, comecar, abrirPortada, abrirConteudo };'
  );
  const api = fabrica(documento, localStorage, { search: '' }, () => true, () => Promise.reject(new Error('sem rede')));

  return { secoes, api, documento };
}

/** Carrega os arquivos .gs como JavaScript comum (são funções puras). */
function carregarAppsScript() {
  const fonte = ['Gabarito.gs', 'Correcao.gs', 'Validacao.gs']
    .map((nome) => ler('apps-script', nome))
    .join('\n');
  return new Function(fonte + '\nreturn { GABARITO, corrigir, normalizar, semAcento, validarEnvio };')();
}

console.log('\n1. Exercícios e gabarito gerado');
const html = ler('index.html');
const S = lerExercicios(html);
const itens = montarItens(S);
const totalEspacos = S.flatMap((s) => s.q).join('\n').match(/\{[^}]+\}/g).length;

checar(itens.length === totalEspacos, 'uma resposta por espaço dos exercícios', itens.length + ' itens x ' + totalEspacos + ' espaços');
checar(S.length === 7, 'sete exercícios', String(S.length));
checar(new Set(itens.map((i) => i.id)).size === itens.length, 'identificadores das respostas são únicos');
checar(itens.every((i) => i.resposta && !/[{}]/.test(i.resposta)), 'toda resposta está preenchida e sem chaves');
checar(itens.every((i) => /^\d+\.\d+(_\d+)?$/.test(i.id)), 'formato dos identificadores (ex.: 3.5, 7.1_2)');

const gabaritoNoDisco = ler('apps-script', 'Gabarito.gs');
checar(gabaritoNoDisco === gerarGabaritoGs(itens), 'Gabarito.gs está atualizado (senão rode o gerador)');

console.log('\n2. Página (HTML gerado pelo script)');
const { secoes, api } = executarPagina(html);
const marcação = secoes.join('');
const campos = [...marcação.matchAll(/data-qid="([^"]+)" data-a="([^"]+)"/g)].map((m) => ({ id: m[1], resposta: m[2] }));

checar(secoes.length === 7, 'sete blocos de exercício montados', String(secoes.length));
checar(campos.length === itens.length, 'mesma quantidade de campos no HTML e no gabarito', campos.length + ' x ' + itens.length);
checar((marcação.match(/<select /g) || []).length === 7, 'sete campos de seleção (exercício 6)');

const porId = new Map(campos.map((c) => [c.id, c.resposta]));
const divergentes = itens.filter((i) => porId.get(i.id) !== i.resposta);
checar(divergentes.length === 0, 'cada campo tem a resposta do gabarito', divergentes.slice(0, 3).map((i) => i.id).join(', '));

console.log('\n3. Normalização igual na página e no servidor');
const gs = carregarAppsScript();
const amostras = ['  Hablé ', 'HABLE', 'hablé', 'Me levanté', 'me  levante', '¿Verdad?', 'FUE', 'dormí'];
const diferencasNorm = amostras.filter((s) => api.norm(s) !== gs.normalizar(s));
const diferencasAcento = amostras.filter((s) => api.strip(s) !== gs.semAcento(s));
checar(diferencasNorm.length === 0, 'norm() da página == normalizar() do servidor', diferencasNorm.join(' | '));
checar(diferencasAcento.length === 0, 'strip() da página == semAcento() do servidor', diferencasAcento.join(' | '));

console.log('\n4. Correção no servidor');
const todasCertas = Object.fromEntries(gs.GABARITO.map((i) => [i.id, i.resposta]));
const notaCheia = gs.corrigir(todasCertas);
checar(notaCheia.acertos === gs.GABARITO.length && notaCheia.casi === 0, 'gabarito completo dá nota cheia', JSON.stringify({ a: notaCheia.acertos, t: notaCheia.total }));

const semAcentoAlguns = { ...todasCertas };
semAcentoAlguns['1.1'] = 'hable';
semAcentoAlguns['4.1'] = 'durmio';
semAcentoAlguns['5.2'] = 'llegue';
const notaAcento = gs.corrigir(semAcentoAlguns);
checar(notaAcento.casi === 3 && notaAcento.acertos === gs.GABARITO.length - 3, 'sem acento conta como "quase", não como erro', JSON.stringify({ a: notaAcento.acertos, c: notaAcento.casi }));

const comMaiusculas = { ...todasCertas, '3.2': 'HIZO', '1.1': '  Hablé  ' };
const notaMaiusculas = gs.corrigir(comMaiusculas);
checar(notaMaiusculas.acertos === gs.GABARITO.length, 'maiúsculas e espaços extras não atrapalham', JSON.stringify({ a: notaMaiusculas.acertos }));

const comErro = { ...todasCertas, '2.1': 'voy', '5.1': 'busco' };
const notaErro = gs.corrigir(comErro);
checar(notaErro.acertos === gs.GABARITO.length - 2 && notaErro.casi === 0, 'resposta errada derruba o acerto', JSON.stringify({ a: notaErro.acertos, c: notaErro.casi }));
checar(gs.corrigir({}).acertos === 0 && gs.corrigir({}).detalhes.every((d) => d.status === 'vazio'), 'envio em branco fica todo "vazio"');
checar(notaCheia.detalhes.length === gs.GABARITO.length, 'detalhes cobrem todas as respostas');
checar(notaCheia.detalhes.every((d) => d.ex && d.pergunta && d.resposta), 'cada detalhe traz exercício, pergunta e resposta certa');

console.log('\n5. Validação do envio');
const lancar = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
checar(!!lancar(() => gs.validarEnvio(null)), 'envio vazio é recusado');
checar(!!lancar(() => gs.validarEnvio({ respostas: {} })), 'envio sem nome é recusado');
checar(!!lancar(() => gs.validarEnvio({ nome: 'Ana' })), 'envio sem respostas é recusado');

const limpo = gs.validarEnvio({ nome: '  Ana Souza  ', respostas: { '1.1': 'hablé' } });
checar(limpo.nome === 'Ana Souza', 'nome é aparado', JSON.stringify(limpo.nome));
checar(limpo.turma === undefined, 'turma não é exigida nem devolvida');

const muitas = {};
for (let i = 0; i < 301; i++) muitas['x' + i] = 'a';
checar(!!lancar(() => gs.validarEnvio({ nome: 'Ana', respostas: muitas })), 'envio com respostas demais é recusado');

console.log('\n6. Configuração da página');
checar(/const ENVIO_URL = "https:\/\/script\.google\.com\/macros\/s\/[^"]+\/exec";/.test(html), 'ENVIO_URL aponta para uma implantação /exec');
checar(/id="nome"/.test(html) && /id="portada"/.test(html), 'tela de entrada com o campo de nome');
checar(/id="conteudo" hidden/.test(html), 'conteúdo começa escondido até o aluno se identificar');
checar(/id="comecar"/.test(html) && /id="continuar"/.test(html), 'botões «Comenzar» e «Continuar» existem');
checar(/id="mostra-nome"/.test(html), 'barra do aluno mostra o nome');
checar(/id="enviar"/.test(html), 'botão de envio existe');
checar(/envioId/.test(html), 'envio leva um identificador (evita linha duplicada em retry)');
checar(html.includes('Comprobar') && html.includes('Ver soluciones') && html.includes('Borrar todo'), 'botões originais preservados');

console.log('\n7. Sintaxe dos arquivos do Apps Script');
['Codigo.gs', 'Correcao.gs', 'Validacao.gs', 'Gabarito.gs'].forEach((nome) => {
  const erro = lancar(() => new Function(ler('apps-script', nome)));
  checar(!erro, nome + ' compila', erro || '');
});
const manifesto = lancar(() => JSON.parse(ler('apps-script', 'appsscript.json')));
checar(!manifesto, 'appsscript.json é JSON válido', manifesto || '');

console.log('\n8. Fluxo da tela de entrada');
const pagina = executarPagina(html);
const no = (id) => pagina.documento.getElementById(id);

checar(no('portada').hidden === false && no('conteudo').hidden === true, 'abre na tela de entrada, com o conteúdo escondido');

no('nome').value = '  Ana Souza  ';
pagina.api.comecar();
checar(no('portada').hidden === true && no('conteudo').hidden === false, 'Comenzar libera o conteúdo');
checar(no('mostra-nome').textContent === 'Ana Souza', 'a barra mostra o nome sem espaços sobrando', JSON.stringify(no('mostra-nome').textContent));

const voltar = executarPagina(html);
const noVoltar = (id) => voltar.documento.getElementById(id);
noVoltar('nome').value = 'A';
voltar.api.comecar();
checar(noVoltar('portada').hidden === false && /nombre/i.test(noVoltar('portada-msg').textContent), 'nome curto mantém a entrada e avisa');

noVoltar('nome').value = 'Bruno';
voltar.api.abrirPortada(true);
checar(noVoltar('portada-msg').textContent === '', 'trocar de nome limpa o aviso anterior');

console.log('');
if (falhas) {
  console.error(falhas + ' verificação(ões) falharam.');
  process.exit(1);
}
console.log('Tudo certo: ' + itens.length + ' respostas, página e gabarito coerentes.');
