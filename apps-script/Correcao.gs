/**
 * Correção das respostas do questionário.
 *
 * Funções puras (sem acesso a planilha), para poderem ser testadas fora do
 * Apps Script: ferramentas/testar.mjs carrega este arquivo e roda os testes.
 *
 * O gabarito fica em Gabarito.gs (arquivo gerado a partir do index.html).
 */

function normalizar(valor) {
  return String(valor == null ? '' : valor).trim().toLowerCase().replace(/\s+/g, ' ');
}

function semAcento(valor) {
  return normalizar(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Compara as respostas enviadas com o GABARITO.
 * - ok   : igual (ignorando maiúsculas/espaços)
 * - casi : igual só sem os acentos (mesmo tratamento "amarelo" da página)
 * - erro : resposta diferente
 * - vazio: deixou em branco
 */
function corrigir(respostas) {
  var enviadas = respostas || {};
  var acertos = 0;
  var casi = 0;
  var detalhes = [];

  for (var i = 0; i < GABARITO.length; i++) {
    var item = GABARITO[i];
    var bruta = enviadas[item.id];
    var aluno = normalizar(bruta);
    var status = 'vazio';

    if (aluno !== '') {
      if (aluno === normalizar(item.resposta)) {
        status = 'ok';
        acertos++;
      } else if (semAcento(aluno) === semAcento(item.resposta)) {
        status = 'casi';
        casi++;
      } else {
        status = 'erro';
      }
    }

    detalhes.push({
      id: item.id,
      ex: item.ex,
      pergunta: item.pergunta,
      resposta: item.resposta,
      aluno: String(bruta == null ? '' : bruta).trim(),
      status: status
    });
  }

  return { acertos: acertos, casi: casi, total: GABARITO.length, detalhes: detalhes };
}
