# Guia de publicação — passo a passo

Este guia leva o questionário do computador até um link público, com as respostas
chegando numa planilha Google. Feito para quem nunca mexeu com GitHub: nenhum passo
exige instalar programa (o caminho 2, opcional, usa o Git que já está na máquina).

Tempo estimado: **25 a 35 minutos** na primeira vez. Depois, publicar uma alteração
leva 2 minutos.

---

## O que vai existir no final

| Peça | Onde fica | Custo |
|---|---|---|
| A página do questionário | GitHub Pages (link público) | R$ 0 |
| O recebimento das respostas | Google Apps Script | R$ 0 |
| As respostas | planilha Google da professora | R$ 0 |

Fluxo: aluno abre o link → escreve o nome na tela inicial → faz os exercícios →
clica em «Enviar respuestas a la profesora» → a planilha ganha uma linha com nome,
acertos e todas as respostas.

## O que já está pronto neste repositório

- `index.html` — a página: tela inicial com o nome, explicação, exercícios e envio.
- `apps-script/` — os quatro arquivos que vão para o Google Apps Script.
- `ferramentas/` — gerador do gabarito, testes e um servidor local para testar.
- `GUIA.md` — este guia.

---

# Parte 1 — Deixar o repositório público e ativar o Pages

> **Por que público?** O GitHub Pages gratuito só publica site de repositório público
> ([documentação](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)).
> O repositório hoje está **privado**, então o Pages nem aparece como opção. O conteúdo
> não tem dado sensível: as respostas dos exercícios já ficam visíveis na página de
> qualquer forma, e nenhuma resposta de aluno é gravada no repositório.

- [ ] Abra `https://github.com/Gfm13/exercicios-encontacto2`
- [ ] Aba **Settings** → menu lateral **General** → role até **Danger Zone**
- [ ] **Change visibility** → **Change to public** → digite o nome do repositório para confirmar

Depois de público:

- [ ] Ainda em **Settings** → menu lateral **Pages**
- [ ] Em *Build and deployment* → *Source*: **Deploy from a branch**
- [ ] *Branch*: **main** e pasta **/(root)** → **Save**
- [ ] Espere 1 a 2 minutos e recarregue a página de Pages: aparece o link
      `https://gfm13.github.io/exercicios-encontacto2/`

> Se o link der erro 404, espere mais um pouco: o primeiro build demora. Em
> **Actions** dá para ver o build "pages build and deployment" rodando.

Neste ponto a página já abre no link — só ainda não envia nada (falta a Parte 3).

---

# Parte 2 — Criar a planilha e o Apps Script

- [ ] Abra `https://sheets.new` (cria uma planilha em branco na conta Google **da professora**)
- [ ] Dê um nome, por exemplo **Respostas — En Contacto 2**
- [ ] Menu **Extensões → Apps Script**

Abre o editor de código, com um arquivo `Code.gs` contendo `function myFunction() {}`.

- [ ] Apague todo o conteúdo de `Code.gs` e cole o arquivo `apps-script/Codigo.gs` deste repositório
- [ ] Clique no **+** ao lado de "Arquivos" → **Script** → nome `Correcao` → cole `apps-script/Correcao.gs`
- [ ] Repita: **+** → **Script** → `Validacao` → cole `apps-script/Validacao.gs`
- [ ] Repita: **+** → **Script** → `Gabarito` → cole `apps-script/Gabarito.gs`
- [ ] Salve com **Ctrl+S**

> Os nomes dos arquivos no editor são sem `.gs` (é assim mesmo).
> `Gabarito.gs` é gerado automaticamente e é longo — cole inteiro, sem editar.
> As abas "Envios" e "Respostas" da planilha são criadas sozinhas no primeiro envio.

## Publicar o script como "app da web"

- [ ] **Implantar** (botão azul, canto superior direito) → **Nova implantação**
- [ ] Na engrenagem ⚙️ ao lado de "Selecionar tipo", escolha **App da Web**
- [ ] Preencha:
  - *Descrição*: `Questionário En Contacto 2`
  - *Executar como*: **Eu**
  - *Quem tem acesso*: **Qualquer pessoa**
- [ ] **Implantar** → **Autorizar acesso** → escolha a conta da professora
- [ ] Se aparecer "O Google não verificou este app": **Avançado** → **Acessar… (não seguro)** → **Permitir**
- [ ] Copie a **URL do app da web**, que termina em `/exec`

> "Qualquer pessoa" é necessário porque o aluno não faz login. O script continua
> rodando com a conta da professora: ninguém ganha acesso à planilha por isso.

## Teste sem a página (recomendado)

Este teste grava um envio fictício com todas as respostas certas — serve para saber se
planilha, gabarito e correção estão funcionando antes de envolver a turma.

- [ ] No editor do Apps Script, olhe a **barra de ferramentas** (acima do código): há um
      seletor de funções que normalmente mostra `doGet` ou `myFunction`
- [ ] Clique nele e escolha **`testarGravacao`**
- [ ] Clique em **▷ Executar** (ao lado daquele seletor, não no azul "Implantar")
- [ ] Na primeira vez o Google pede autorização: **Revisar permissões** → escolha a conta
      → **Avançado** → **Acessar… (não seguro)** → **Permitir**
- [ ] Abra o **Registro de execução** (parte de baixo da tela): deve aparecer
      `{"ok":true,"acertos":64,"total":64,...}`
- [ ] Volte na planilha: deve existir uma linha `TESTE — apagar` nas abas **Envios** e
      **Respostas**
- [ ] Apague essas linhas de teste

> Se as abas já existiam de um teste antigo e o cabeçalho ainda tem a coluna *Turma*,
> apague as abas **Envios** e **Respostas** inteiras: elas são recriadas com o cabeçalho
> certo no próximo envio.

Se isso funcionou, o lado do Google está pronto.

---

# Parte 3 — Conectar a página ao Apps Script

O `index.html` já aponta para a implantação criada em 15/11/2026:

```js
const ENVIO_URL = "https://script.google.com/macros/s/AKfy.../exec";
```

Se você **recriar** o App da Web (nova implantação gera outra URL), é só trocar essa
linha pela URL nova, mantendo as aspas. Duas formas de salvar:

**Pelo site do GitHub (sem instalar nada)**
- [ ] Abra o `index.html` no repositório → ícone de **lápis** (Edit)
- [ ] Edite a linha, **Commit changes** → *Commit directly to the main branch*

**Pelo computador**
- [ ] Edite o arquivo aqui nesta pasta e siga a Parte 6

Depois do commit, o Pages republica sozinho em ~1 minuto.

## Teste de ponta a ponta

- [ ] Abra o link do Pages no celular ou no computador
- [ ] Escreva seu nome na tela "Antes de empezar" e clique **Comenzar**
- [ ] Responda algumas questões (não precisa responder tudo)
- [ ] Pressione **Enviar respuestas a la profesora**
- [ ] A página deve mostrar "Recibido…"; a planilha deve ganhar a linha em **Envios**
- [ ] Apague a linha de teste
- [ ] Recarregue a página: ela deve oferecer **Continuar** com o mesmo nome

---

# Parte 4 — O dia da aula

- [ ] Compartilhe o link `https://gfm13.github.io/exercicios-encontacto2/`
      (no Google Classroom, no grupo da turma, ou como QR code)
- [ ] Peça que cada aluno escreva o **nome completo** na primeira tela e clique **Comenzar**

## A tela de entrada e o cache

A página abre numa tela **"Antes de empezar"** que pede só o nome; o conteúdo aparece
depois do **Comenzar**. O nome e as respostas ficam guardados no navegador do aluno:

- se ele recarregar a página ou cair a internet, volta onde estava;
- se ele sair e voltar no mesmo aparelho, a tela oferece **Continuar**;
- no botão **Cambiar** (barra do topo) ele pode corrigir o nome. Se digitar outro nome
  e já houver respostas guardadas, a página pergunta se é para começar de zero — útil
  quando dois alunos usam o mesmo computador.

O que **não** fica guardado é o envio: só vai para a planilha quando o aluno clica em
**Enviar respuestas a la profesora**. Ele pode enviar mais de uma vez (novas tentativas
viram novas linhas; a última é a mais recente).

Sobre o link: a página tem `<meta name="robots" content="noindex">`, então não aparece
no Google. Quem tem o link, entra — o que é esperado para uma atividade.

## Como ler os resultados

Duas abas na planilha:

- **Envios** — uma linha por envio: data/hora, nome, acertos, "quase" (acertou só
  errando o acento), total, %, duração e versão. É a visão de nota.
- **Respostas** — uma linha por resposta: nome, exercício, número da questão, a
  pergunta, o que o aluno escreveu, a resposta certa e o status (`ok`, `casi`, `erro`,
  `vazio`). É a visão de diagnóstico: mostra exatamente o que a turma errou.

Atalhos úteis:

- Filtrar por aluno: selecione o cabeçalho de **Envios** e use
  **Dados → Criar filtro**; depois filtre a coluna Nome.
- Contar quantos envios chegaram: `=COUNTA(Envios!C2:C)`
- Média de acertos: `=AVERAGE(Envios!D2:D)`
- Se o aluno enviar duas vezes, cada envio vira uma linha — a última data é a
  tentativa mais recente (a aba **Envios** é ordenada pela ordem de chegada).

---

# Parte 5 — Se algo der errado

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Página diz "El envío todavía no está configurado" | `ENVIO_URL` ainda vazio | Parte 3 |
| Página diz "No se pudo enviar" | URL errada, ou implantação sem acesso "Qualquer pessoa" | Confira a URL (`/exec`), e em **Implantar → Gerenciar implantações** veja se o acesso é "Qualquer pessoa" |
| Não aparece linha na planilha, mas a página agradeceu | envio caiu no modo "sem confirmação" (CORS) | Abra a URL `/exec` no navegador: deve mostrar `{"ok":true,...}`. Se mostrar erro, o deploy está com problema. Confira também **Execuções** no editor |
| Erro "Planilha não encontrada" | o script não está vinculado à planilha | O script precisa ser criado por **Extensões → Apps Script** dentro da planilha |
| Link do Pages dá 404 | build ainda rodando, ou repositório privado | Espere 2 min; confira **Actions** e a visibilidade do repositório |
| Alterei o código do script e nada mudou | o App da Web usa uma versão fixa | **Implantar → Gerenciar implantações → ✏️ → Versão: Nova versão → Implantar** |
| Planilha mostra erro `#NOME?` nas fórmulas | aspas/formatação | Use `;` como separador (planilha em português) e o nome exato da aba |

---

# Parte 6 — Publicar alterações depois (caminho com Git)

Só é necessário quando quiser mudar a página. No PowerShell, dentro da pasta
`exercicios-encontacto2`:

```powershell
git add -A
git commit -m "ajuste no questionário"
git push
```

Se `git` não for reconhecido, use o caminho completo:

```powershell
& "C:\Program Files\Git\cmd\git.exe" add -A
& "C:\Program Files\Git\cmd\git.exe" commit -m "ajuste no questionário"
& "C:\Program Files\Git\cmd\git.exe" push
```

O repositório está configurado com SSH (`git@github.com:Gfm13/...`). Se o `push`
pedir senha/chave, o mais simples é publicar pelo site (upload de arquivos em
**Add file → Upload files**) ou trocar o remoto para HTTPS.

---

# Parte 7 — Manutenção: mudar os exercícios

O `index.html` é a fonte da verdade: as questões e as respostas certas ficam no
array `S`. Ao mudar qualquer exercício, o gabarito do Apps Script precisa ser
regerado (senão a nota vem errada):

1. Edite o array `S` no `index.html` (mantendo o formato `{pergunta|resposta}`).
2. Rode na pasta do repositório:

   ```powershell
   node ferramentas/gerar-gabarito.mjs
   ```

   (o `node` também tem caminho completo, se precisar:
   `C:\Users\gfm\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe`)

3. Abra `apps-script/Gabarito.gs`, copie o conteúdo e cole no arquivo `Gabarito`
   do Apps Script (substituindo tudo).
4. No Apps Script: **Implantar → Gerenciar implantações → ✏️ → Nova versão → Implantar**.
5. Publique o `index.html` (Parte 6 ou upload no site).

Antes de publicar, vale rodar os testes:

```powershell
node ferramentas/testar.mjs
```

Eles avisam se o gabarito ficou desatualizado em relação à página, se alguma
resposta ficou vazia ou se a página e o servidor passaram a discordar.

---

# Parte 8 — Privacidade (LGPD)

- A página pede apenas o **nome** — nada além disso. Não peça CPF, nascimento,
  telefone ou endereço.
- O texto na página já avisa que as respostas vão para a professora.
- Os dados ficam no Google (fora do Brasil) e o link do Pages é público;
  se a escola tiver política própria de dados, vale conferir antes.
- Combine com a turma o prazo e apague as linhas da planilha ao fim do período.
- A nota é recalculada no servidor a partir do que o aluno enviou; o gabarito não
  depende do que o navegador informa.
