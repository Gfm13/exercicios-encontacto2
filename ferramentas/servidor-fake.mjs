/**
 * Servidor local para testar o envio sem publicar nada.
 *
 *   node ferramentas/servidor-fake.mjs
 *
 * Depois abra no navegador o endereço que aparecer no terminal (a página já
 * vem com ?endpoint=/envio). Cada envio é impresso aqui e devolvido com a nota,
 * igual ao Apps Script faria.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = Number(process.env.PORTA || 8787);

function carregarAppsScript() {
  const fonte = ['Gabarito.gs', 'Correcao.gs', 'Validacao.gs']
    .map((nome) => fs.readFileSync(path.join(RAIZ, 'apps-script', nome), 'utf8'))
    .join('\n');
  return new Function(fonte + '\nreturn { corrigir, GABARITO, validarEnvio };')();
}

const { corrigir, GABARITO, validarEnvio } = carregarAppsScript();

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let bruto = '';
    req.on('data', (pedaco) => {
      bruto += pedaco;
      if (bruto.length > 1e6) reject(new Error('corpo grande demais'));
    });
    req.on('end', () => resolve(bruto));
    req.on('error', reject);
  });
}

function json(res, status, obj) {
  const corpo = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Content-Length': Buffer.byteLength(corpo)
  });
  res.end(corpo);
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && url.pathname === '/envio') {
    try {
      const bruto = await lerCorpo(req);
      let dados;
      try {
        dados = JSON.parse(bruto);
      } catch (e) {
        // envio por formulário (fallback do iframe): payload em campo
        const params = new URLSearchParams(bruto);
        dados = JSON.parse(params.get('payload') || '{}');
      }

      const limpo = validarEnvio(dados);
      const nota = corrigir(limpo.respostas);
      const respondidas = Object.values(limpo.respostas).filter((v) => String(v).trim()).length;

      console.log('\n--- envio recebido ---');
      console.log('nome: ' + limpo.nome);
      console.log('respondidas: ' + respondidas + '/' + nota.total);
      console.log('acertos: ' + nota.acertos + ' | quase: ' + nota.casi + ' | duração: ' + dados.duracaoSeg + 's');
      if (typeof dados.acertosLocal === 'number' && dados.acertosLocal !== nota.acertos) {
        console.log('atenção: a página calculou ' + dados.acertosLocal + ' acertos, o servidor calculou ' + nota.acertos);
      }
      const erros = nota.detalhes.filter((d) => d.status !== 'ok').slice(0, 5);
      if (erros.length) {
        console.log('primeiras divergências:');
        erros.forEach((d) => console.log('  ' + d.id + ' -> aluno: "' + d.aluno + '" | certo: "' + d.resposta + '" (' + d.status + ')'));
      }

      return json(res, 200, { ok: true, id: 'teste-' + Date.now(), acertos: nota.acertos, casi: nota.casi, total: nota.total });
    } catch (erro) {
      const mensagem = String(erro && erro.message ? erro.message : erro);
      console.log('envio recusado: ' + mensagem);
      return json(res, 200, { ok: false, erro: mensagem });
    }
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = fs.readFileSync(path.join(RAIZ, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('não encontrado');
});

servidor.listen(PORTA, () => {
  console.log('Servidor de teste em: http://localhost:' + PORTA + '/?endpoint=/envio');
  console.log('Gabarito carregado: ' + GABARITO.length + ' respostas.');
  console.log('Ctrl+C para parar.');
});
