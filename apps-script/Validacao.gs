/**
 * Validação do envio — funções puras, compartilhadas entre o Apps Script
 * (Codigo.gs) e o servidor de teste (ferramentas/servidor-fake.mjs), para que o
 * teste local aceite e recuse exatamente o que a produção aceita e recusa.
 */

var LIMITES_ENVIO = { NOME: 80, RESPOSTAS: 300 };

function textoLimpo(valor, maximo) {
  return String(valor == null ? '' : valor).trim().slice(0, maximo);
}

/**
 * Lança Error com mensagem em português quando o envio não serve.
 * Devolve { nome, respostas } já aparado.
 */
function validarEnvio(d) {
  if (!d || typeof d !== 'object') throw new Error('Envio vazio.');

  var nome = textoLimpo(d.nome, LIMITES_ENVIO.NOME);

  if (nome.length < 2) throw new Error('Informe o nome do aluno.');
  if (!d.respostas || typeof d.respostas !== 'object' || Array.isArray(d.respostas)) {
    throw new Error('Respostas ausentes.');
  }
  if (Object.keys(d.respostas).length > LIMITES_ENVIO.RESPOSTAS) {
    throw new Error('Respostas demais para um envio.');
  }

  return { nome: nome, respostas: d.respostas };
}
