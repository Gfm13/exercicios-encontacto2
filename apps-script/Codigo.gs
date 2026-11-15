/**
 * Questionário de espanhol (En Contacto 2) — recebimento das respostas.
 *
 * Instalação (detalhada no GUIA.md, parte 2):
 *   1. Abra a planilha que vai guardar as respostas.
 *   2. Extensões > Apps Script.
 *   3. Crie/cole os arquivos: Codigo.gs (este), Correcao.gs, Validacao.gs e Gabarito.gs.
 *   4. Implantar > Nova implantação > tipo "App da Web"
 *        - Executar como: eu
 *        - Quem tem acesso: qualquer pessoa
 *   5. Copie a URL que termina em /exec e cole em ENVIO_URL no index.html.
 *
 * O script precisa estar vinculado à planilha (Extensões > Apps Script a partir
 * dela). As abas "Envios" e "Respostas" são criadas automaticamente no primeiro
 * envio, com cabeçalho.
 */

var CFG = {
  ABA_ENVIOS: 'Envios',
  ABA_RESPOSTAS: 'Respostas',
  EMAIL_AVISO: ''             // opcional: 'professora@escola.com' para receber um e-mail por envio
};

var CABECALHOS = {
  envios: ['Data/hora', 'ID do envio', 'Nome', 'Turma', 'Acertos', 'Quase (só acento)', 'Total', '%', 'Duração (s)', 'Versão', 'Enviado em (ISO)'],
  respostas: ['Data/hora', 'ID do envio', 'Nome', 'Turma', 'Exercício', 'Nº', 'Pergunta', 'Resposta do aluno', 'Resposta correta', 'Status']
};

/* Abrir a URL no navegador serve para conferir se a implantação está no ar. */
function doGet() {
  return resposta_({ ok: true, mensagem: 'Questionário ativo.', respostasNoGabarito: GABARITO.length });
}

function doPost(e) {
  try {
    var dados = lerDados_(e);
    validar_(dados);

    var trava = LockService.getScriptLock();
    if (!trava.tryLock(20000)) {
      throw new Error('Muitos envios ao mesmo tempo. Tente novamente em alguns segundos.');
    }
    try {
      var resultado = registrar_(dados);
      return resposta_({
        ok: true,
        id: resultado.id,
        acertos: resultado.acertos,
        casi: resultado.casi,
        total: resultado.total
      });
    } finally {
      trava.releaseLock();
    }
  } catch (erro) {
    return resposta_({ ok: false, erro: String(erro && erro.message ? erro.message : erro) });
  }
}

/** Aceita JSON no corpo, JSON em campo "payload" (envio por formulário) ou campos soltos. */
function lerDados_(e) {
  var bruto = e && e.postData && e.postData.contents ? String(e.postData.contents) : '';
  if (bruto) {
    try { return JSON.parse(bruto); } catch (x) { /* segue para as alternativas */ }
  }
  if (e && e.parameter && e.parameter.payload) {
    try { return JSON.parse(e.parameter.payload); } catch (x) { /* segue */ }
  }
  if (e && e.parameter) return e.parameter;
  throw new Error('Nenhum dado recebido.');
}

function validar_(d) {
  var limpo = validarEnvio(d);
  d.nome = limpo.nome;
  d.turma = limpo.turma;
  d.respostas = limpo.respostas;
  return d;
}

function registrar_(d) {
  var nota = corrigir(d.respostas);
  var id = Utilities.getUuid();
  var agora = new Date();
  var abas = garantirAbas_();
  var pct = nota.total ? Math.round((nota.acertos / nota.total) * 100) : '';
  var duracao = Number(d.duracaoSeg);

  abas.envios.appendRow([
    agora,
    id,
    d.nome,
    d.turma,
    nota.acertos,
    nota.casi,
    nota.total,
    pct,
    isFinite(duracao) && duracao >= 0 ? duracao : '',
    textoLimpo(d.versao, 60),
    textoLimpo(d.enviadoEm, 40)
  ]);

  if (nota.detalhes.length) {
    var linhas = nota.detalhes.map(function (item) {
      return [agora, id, d.nome, d.turma, item.ex, item.id, item.pergunta, item.aluno, item.resposta, item.status];
    });
    abas.respostas
      .getRange(abas.respostas.getLastRow() + 1, 1, linhas.length, CABECALHOS.respostas.length)
      .setValues(linhas);
  }

  avisarEmail_(d, nota, agora);
  return { id: id, acertos: nota.acertos, casi: nota.casi, total: nota.total };
}

function garantirAbas_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Planilha não encontrada: crie o script a partir de Extensões > Apps Script na planilha.');
  return {
    envios: aba_(ss, CFG.ABA_ENVIOS, CABECALHOS.envios),
    respostas: aba_(ss, CFG.ABA_RESPOSTAS, CABECALHOS.respostas)
  };
}

function aba_(ss, nome, cabecalho) {
  var aba = ss.getSheetByName(nome);
  if (!aba) aba = ss.insertSheet(nome);
  if (aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]).setFontWeight('bold');
    aba.setFrozenRows(1);
  }
  return aba;
}

function avisarEmail_(d, nota, quando) {
  if (!CFG.EMAIL_AVISO) return;
  try {
    MailApp.sendEmail({
      to: CFG.EMAIL_AVISO,
      subject: 'Questionário de espanhol — ' + d.nome + ' (' + d.turma + ')',
      body: d.nome + ' (' + d.turma + ') enviou em ' + quando + '.\n' +
            'Acertos: ' + nota.acertos + ' / ' + nota.total + ' (quase: ' + nota.casi + ').'
    });
  } catch (erro) {
    // e-mail é aviso, não pode derrubar o envio
  }
}

function resposta_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Teste rápido: grava um envio fictício com todas as respostas certas.
 * Use no editor do Apps Script (Executar) e depois apague as linhas "TESTE".
 */
function testarGravacao() {
  var respostas = {};
  GABARITO.forEach(function (item) { respostas[item.id] = item.resposta; });
  var retorno = doPost({
    postData: {
      contents: JSON.stringify({
        nome: 'TESTE — apagar', turma: 'TESTE', versao: 'teste', duracaoSeg: 1,
        respostas: respostas, enviadoEm: new Date().toISOString()
      })
    }
  });
  Logger.log(retorno.getContent());
}
