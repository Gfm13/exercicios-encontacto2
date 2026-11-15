# exercicios-encontacto2

Questionário de espanhol (**En Contacto 2** — pretérito indefinido) publicado no
GitHub Pages, com as respostas dos alunos chegando numa planilha Google.

**Link da atividade:** https://gfm13.github.io/exercicios-encontacto2/
*(depois da Parte 1 do [GUIA.md](GUIA.md))*

## Como funciona

```
aluno → index.html (GitHub Pages)
          │  botão "Enviar respuestas a la profesora"
          ▼
        Apps Script (Google) ──► planilha: abas "Envios" e "Respostas"
```

A página abre numa tela inicial que pede só o nome; o conteúdo vem depois. Ela corrige
na hora (verde / amarelo = só o acento / vermelho) e guarda nome e respostas no
navegador. «Ver soluciones» abre um painel com as frases corrigidas **sem apagar** o que
já foi escrito (e cada pista revela só a sua resposta). O envio é opcional e manual: só
quando o aluno clica é que nome e respostas vão para a planilha. A nota é recalculada no
servidor a partir do gabarito, que fica no Apps Script, e há um limite de 300 envios por
dia para proteger a URL pública.

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html` | Página do questionário (explicação + 7 exercícios + envio) |
| `apps-script/Codigo.gs` | Recebe o POST, grava nas abas e responde a nota |
| `apps-script/Correcao.gs` | Compara respostas com o gabarito (funções puras) |
| `apps-script/Validacao.gs` | Valida o nome e o formato do envio |
| `apps-script/Gabarito.gs` | **Gerado** a partir do `index.html` — não editar à mão |
| `apps-script/appsscript.json` | Manifesto (fuso de São Paulo, app da web público) |
| `ferramentas/gerar-gabarito.mjs` | Regenera `Gabarito.gs` a partir do `index.html` |
| `ferramentas/testar.mjs` | Testes de coerência entre página, gabarito e correção |
| `ferramentas/servidor-fake.mjs` | Servidor local para testar o envio sem publicar |
| `GUIA.md` | Passo a passo de publicação e manutenção |

## Testar no computador

```powershell
node ferramentas/gerar-gabarito.mjs   # só quando os exercícios mudarem
node ferramentas/testar.mjs           # confere página + gabarito + correção

node ferramentas/servidor-fake.mjs    # e abra o link que aparecer no terminal
```

O servidor local serve a página e recebe o envio em `?endpoint=/envio`, imprimindo
no terminal o que chegou e a nota calculada — sem tocar em nenhuma conta do Google.

## Mudar os exercícios

Edite o array `S` no `index.html`, rode `node ferramentas/gerar-gabarito.mjs`,
atualize o `Gabarito.gs` no Apps Script (nova versão da implantação) e publique.
Detalhes na Parte 7 do [GUIA.md](GUIA.md).

## Privacidade

A página pede apenas o nome, e avisa a finalidade. A nota é recalculada no
servidor; o gabarito não vem do navegador. Nada de dado de aluno é versionado no
repositório.
