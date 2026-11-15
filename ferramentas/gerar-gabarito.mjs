/**
 * Gera apps-script/Gabarito.gs a partir do index.html.
 *
 * O index.html é a única fonte da verdade dos exercícios (array S). Este script
 * lê os exercícios, monta os identificadores das respostas (ex.: "3.5") e escreve
 * o gabarito que o Apps Script usa para corrigir.
 *
 * Rode sempre que mudar os exercícios:
 *   node ferramentas/gerar-gabarito.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAMINHO_HTML = path.join(RAIZ, 'index.html');
const CAMINHO_SAIDA = path.join(RAIZ, 'apps-script', 'Gabarito.gs');

/** Lê o array S do index.html. */
export function lerExercicios(html = fs.readFileSync(CAMINHO_HTML, 'utf8')) {
  const inicio = html.indexOf('const S=');
  if (inicio < 0) throw new Error('Array S não encontrado em index.html');

  const fim = html.indexOf('\n];', inicio);
  if (fim < 0) throw new Error('Fim do array S não encontrado em index.html');

  const literal = html.slice(inicio + 'const S='.length, fim + 2);
  const S = new Function('return ' + literal)();
  if (!Array.isArray(S) || !S.length) throw new Error('Array S inválido ou vazio');
  return S;
}

/**
 * Converte as seções em itens de gabarito.
 * Id de cada resposta: "<exercício>.<questão>", com "_2", "_3"... quando uma
 * questão tem mais de um espaço (o texto do exercício 7 tem nove).
 */
export function montarItens(S) {
  const itens = [];

  S.forEach((secao, k) => {
    const textos = secao.story ? [secao.q[0]] : secao.q;

    textos.forEach((texto, i) => {
      const base = (k + 1) + '.' + (i + 1);

      // Versão legível da questão, para a aba "Respostas" da planilha.
      const pergunta = texto.replace(/\{([^}]+)\}/g, (bruto, dentro) => {
        const resposta = dentro.split('|')[0];
        const legivel = resposta[0] === '?' ? resposta.slice(1).split('/').join(' / ') : resposta;
        return '____ (' + legivel + ')';
      });

      let n = 0;
      texto.replace(/\{([^}]+)\}/g, (bruto, dentro) => {
        n++;
        const partes = dentro.split('|');
        const resposta = (partes[1] || '').trim();
        if (!resposta) throw new Error('Resposta vazia em ' + base + ' (texto: ' + texto + ')');
        itens.push({
          id: base + (n > 1 ? '_' + n : ''),
          ex: secao.t,
          pergunta,
          resposta
        });
        return bruto;
      });
    });
  });

  return itens;
}

/** Texto do Gabarito.gs. */
export function gerarGabaritoGs(itens) {
  const linhas = itens.map((item) =>
    '  ' + JSON.stringify({ id: item.id, ex: item.ex, pergunta: item.pergunta, resposta: item.resposta })
  );

  return [
    '// ARQUIVO GERADO — não edite à mão.',
    '// Fonte: index.html (array S). Para regerar: node ferramentas/gerar-gabarito.mjs',
    '// Total de respostas: ' + itens.length,
    '',
    'const GABARITO = [',
    linhas.join(',\n'),
    '];',
    ''
  ].join('\n');
}

function main() {
  const itens = montarItens(lerExercicios());
  fs.writeFileSync(CAMINHO_SAIDA, gerarGabaritoGs(itens), 'utf8');
  console.log('Gabarito gerado: ' + itens.length + ' respostas -> apps-script/Gabarito.gs');
}

const executadoDireto =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (executadoDireto) main();
