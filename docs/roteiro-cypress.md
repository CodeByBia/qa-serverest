# Roteiro de estudo: projeto Cypress

O roteiro tem três partes. Cada etapa explica **para que serve**, **como fazer** (com os comandos e o código) e **como conferir** que deu certo.

- **Parte 1:** Etapas 0 a 6. Monta o esqueleto do projeto e o primeiro teste de API, com relatório e tags.
- **Parte 2:** Etapas 7 a 13. A suíte de API completa: schemas, login, autorização, produtos, carrinhos e usuários.
- **Parte 3:** E2E com Cucumber no front público. Entra neste arquivo quando você terminar a Parte 2.

> **Como usar:** faça uma etapa por vez. Digite o código em vez de copiar e colar, porque é digitando que você percebe o que cada linha faz. Quando travar, me mande o erro completo ou peça "me explica a linha X".

---

## Antes de tudo: onde rodar os comandos

Todos os comandos deste roteiro são para o **terminal do VS Code** (menu **Terminal → New Terminal**), que no Windows abre o PowerShell.

O terminal sempre "está" em uma pasta. Para saber qual, olhe o texto antes do cursor, por exemplo `PS C:\qa-serverest>`. Para trocar de pasta, use `cd`:

```powershell
cd C:\qa-serverest\cypress-tests
```

Em cada etapa eu digo em qual pasta o comando deve rodar. **Rodar na pasta errada é a causa mais comum de erro**, então confira o caminho antes de apertar Enter.

### Erro "a execução de scripts foi desabilitada neste sistema"

Se `npx` ou `npm` derem esse erro no PowerShell, o motivo é a **política de execução** do Windows. Por padrão, ela impede o PowerShell de rodar arquivos `.ps1`, e o `npx` e o `npm` são instalados com um `npx.ps1` e um `npm.ps1`.

**Solução definitiva (recomendada):** rode **uma vez** este comando no PowerShell. Não precisa abrir como administrador.

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

- `-Scope CurrentUser`: vale só para o seu usuário do Windows e não muda nada para os outros usuários.
- `RemoteSigned`: scripts criados no seu computador rodam livremente. Scripts **baixados da internet** só rodam se tiverem assinatura digital. É a configuração que a própria Microsoft recomenda para quem desenvolve.

Depois, **feche o terminal e abra outro**.

**Alternativa sem mudar nada:** acrescente `.cmd` ao nome do comando, por exemplo `npx.cmd serverest --timeout 600` ou `npm.cmd run test:api`. Funciona, mas você teria que lembrar disso em todo comando.

---

## Etapa 0 — Preparação

### 0.1 Criar o `.nvmrc`

**Para que serve:** é um arquivo de uma linha que diz qual versão do Node.js o projeto usa. Quem clonar o repositório e o GitHub Actions (na Etapa 5 do plano) vão ler esse arquivo para instalar a mesma versão que você. Isso evita o clássico "na minha máquina funciona".

**Como fazer:**
1. No VS Code, clique com o botão direito na pasta raiz `QA-SERVEREST` → **New File**.
2. Dê o nome `.nvmrc`, com o ponto no começo.
3. Escreva só `22` dentro, salve com `Ctrl+S` e feche.

**Como conferir:** na pasta `C:\qa-serverest`, rode:
```powershell
Get-Content .nvmrc
```
Deve aparecer `22`.

### 0.2 Conhecer a API com as próprias mãos

**Para que serve:** antes de automatizar, você precisa **ver** como a API responde. Você vai escrever asserções do tipo "a mensagem deve ser *Login realizado com sucesso*", e precisa saber de onde esse texto vem. Testador que nunca usou o sistema na mão escreve testes que verificam pouco.

**Como fazer:**

1. Suba a API. Na pasta `C:\qa-serverest\cypress-tests`:
   ```powershell
   npx serverest --timeout 600
   ```
   - `npx` executa um programa instalado no `node_modules` do projeto. Ele usa a versão 3.2.2 que está no `package.json`, e não baixa outra.
   - `--timeout 600` faz o token de login valer 600 segundos (10 minutos).
   - O terminal fica "preso" enquanto a API roda. Isso é normal: ela está esperando requisições. **Não feche esse terminal.**
   - Se aparecer "Failed to get financial contributor", pode ignorar (o plano explica na seção 9).

2. Abra **http://localhost:3000** no navegador. Essa é a documentação Swagger da API.

3. Faça este roteiro de exploração no Swagger. Em cada rota, clique nela → **Try it out** → edite o corpo → **Execute** → leia o *Response body* e o *Code*:

   | # | Rota | O que enviar | O que observar |
   | --- | --- | --- | --- |
   | 1 | `POST /usuarios` | um e-mail inventado, `"administrador": "true"` | o status 201 e o `_id` que volta |
   | 2 | `POST /usuarios` | **o mesmo e-mail** de novo | o 400 e a mensagem de e-mail duplicado |
   | 3 | `POST /login` | o e-mail e a senha do passo 1 | o campo `authorization`, que começa com `Bearer ` |
   | 4 | `POST /login` | senha errada | o 401 e a mensagem |
   | 5 | `POST /produtos` | sem token | o 401 |
   | 6 | `POST /produtos` | com token: clique no cadeado **Authorize** no topo e cole o valor de `authorization` inteiro, com o `Bearer ` | o 201 |

4. Anote o que viu: status, mensagens e qualquer coisa estranha. Essas anotações viram o `docs/achados-exploratorios.md` (Etapa 1 do plano).

5. Para desligar a API, clique no terminal dela e aperte `Ctrl+C`.

### 0.3 Commit

**Para que serve:** cada etapa termina com um commit, um "ponto de salvamento". Se algo quebrar depois, você volta para cá. E o histórico mostra ao avaliador como você trabalhou.

Na pasta `C:\qa-serverest`:
```powershell
git add .nvmrc
git commit -m "chore: adiciona .nvmrc com Node 22"
```
- `git add` escolhe **quais arquivos** vão no commit.
- `git commit -m "..."` grava o commit com a mensagem.
- O prefixo `chore:` indica uma tarefa de manutenção. Nos testes você vai usar `test:`.

---

## Etapa 1 — Estrutura de pastas

**Para que serve:** deixar o projeto organizado como na seção 3 do plano. A separação `api/` × `front/` é importante porque os dois tipos de teste usam **ambientes diferentes** (API local × site público) e **configurações diferentes**. Pastas separadas permitem dizer ao Cypress "rode só o que está em `api/`".

**Como fazer** (pasta `C:\qa-serverest\cypress-tests`):

```powershell
Remove-Item cypress\fixtures\example.json
mkdir cypress\e2e\api
mkdir cypress\e2e\front\steps
mkdir cypress\fixtures\dados
mkdir cypress\fixtures\schemas
```

- `Remove-Item` apaga o arquivo de exemplo que o Cypress criou e que você não vai usar.
- `mkdir` cria pastas. No PowerShell ele cria as intermediárias sozinho (`front` e depois `steps`).

**O que cada pasta vai guardar:**

| Pasta | Conteúdo |
| --- | --- |
| `e2e/api/` | Testes de API (`login.cy.js`, `produtos.cy.js`...) |
| `e2e/front/` | Testes de tela em Gherkin (`.feature`) |
| `e2e/front/steps/` | O código que executa cada frase do Gherkin |
| `fixtures/dados/` | Massas de teste, como listas de valores inválidos |
| `fixtures/schemas/` | Os "moldes" das respostas, para testar contrato |
| `support/` | Código compartilhado entre os testes (já existe) |

**Como conferir:** no VS Code, expanda `cypress-tests/cypress` e confira se as pastas aparecem.

> O Git **não versiona pastas vazias**. Elas só vão aparecer no `git status` quando tiverem um arquivo dentro, e por isso esta etapa não tem commit próprio.

---

## Etapa 2 — Configuração do Cypress para API

**Para que serve:** o arquivo de configuração diz ao Cypress **onde está o sistema** testado, **quais arquivos são testes** e **quais plugins usar**. O plano usa duas configurações: uma para API, criada agora, e outra para E2E, na Parte 3. Elas são separadas porque testam ambientes diferentes e porque os plugins do Cucumber e do relatório Mochawesome entram em conflito se ficarem juntos (seção 8.1).

**Como fazer:**

1. Na pasta `cypress-tests`, crie o arquivo `cypress.api.config.js` com este conteúdo:

```js
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports/api',
    charts: true,
    inlineAssets: true
  },
  video: false,
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/api/**/*.cy.js',
    supportFile: 'cypress/support/api.js',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on)
      const { plugin: cypressGrepPlugin } = require('@cypress/grep/plugin')
      cypressGrepPlugin(config)
      return config
    }
  }
})
```

2. **Apague o `cypress.config.js`** antigo. Ele é o padrão que o Cypress gerou e não vai ser usado.
   ```powershell
   Remove-Item cypress.config.js
   ```

**Linha por linha:**

| Trecho | O que faz | Por quê |
| --- | --- | --- |
| `require('cypress')` | Carrega o Cypress | Para usar o `defineConfig` |
| `defineConfig({...})` | Declara a configuração | Dá autocompletar no VS Code |
| `reporter: 'cypress-mochawesome-reporter'` | Troca o relatório padrão por um HTML bonito | O avaliador abre um HTML, não lê terminal |
| `reportDir: 'cypress/reports/api'` | Pasta onde o relatório é salvo | Separa do relatório do E2E |
| `charts: true` | Gráfico de passou/falhou no relatório | Visual |
| `inlineAssets: true` | Junta CSS e JS dentro do HTML | O relatório vira **um arquivo só**, fácil de baixar do CI |
| `video: false` | Não grava vídeo | Teste de API não tem tela; vídeo só gastaria tempo |
| `baseUrl` | Endereço base da API | Permite escrever `cy.request('/login')` em vez de `'http://localhost:3000/login'`. Para trocar o alvo, muda-se só aqui |
| `specPattern` | Quais arquivos são testes | `**` é "qualquer subpasta" e `*.cy.js` é "qualquer arquivo terminado em .cy.js". Aqui, só os testes de API |
| `supportFile` | Arquivo carregado **antes** de cada spec | Onde ficam os comandos e plugins do navegador (Etapa 3) |
| `setupNodeEvents` | Função que roda no Node, fora do navegador | Os plugins se registram aqui |
| `require('.../plugin')(on)` | Liga o plugin do relatório | Exigido pelo README do pacote |
| `cypressGrepPlugin(config)` | Liga o plugin de tags | Permite rodar só `@smoke`, por exemplo |
| `return config` | Devolve a configuração | Obrigatório quando um plugin mexe nela |

> **`.cy.js`** é a convenção do Cypress para "arquivo de teste". **Spec** é o nome que o Cypress dá a cada arquivo de teste.

---

## Etapa 3 — Arquivos de suporte

**Para que serve:** quase todo teste precisa **criar um usuário** e **fazer login** antes de testar o que interessa. Em vez de repetir esse código em 50 testes, você escreve uma vez como **comando customizado** (`cy.criarUsuario()`, `cy.login()`). Se a API mudar, você corrige em um lugar só.

O plano limita a **3 comandos**: só o que se repete em quase toda spec vira comando. O resto fica explícito no próprio teste, para quem lê entender o que é testado sem caçar código em outro arquivo.

### 3.1 `cypress/support/dados.js` — gerador de dados únicos

**Para que serve:** a API não aceita dois usuários com o mesmo e-mail nem dois produtos com o mesmo nome. Se o teste usasse sempre `teste@qa.com`, funcionaria na primeira execução e falharia na segunda com "Este email já está sendo usado". Os dados da API local **não somem** quando você a reinicia (é a divergência DOC-02 do plano). Por isso cada execução precisa gerar valores novos.

Crie o arquivo:

```js
let contador = 0

export const sufixoUnico = () => `${Date.now()}${++contador}`
export const emailUnico = () => `qa.${sufixoUnico()}@teste.com`
export const nomeUnico = () => `Produto QA ${sufixoUnico()}`
```

**Linha por linha:**
- `let contador = 0`: uma variável que conta quantos valores já foram gerados.
- `Date.now()`: número de milissegundos desde 1970, por exemplo `1762610000123`. Muda a cada milissegundo.
- `++contador`: soma 1 e usa o novo valor. **Por que precisa dele junto com o `Date.now()`?** Dois valores gerados no **mesmo milissegundo** sairiam iguais. O contador garante a diferença.
- `` `...${}...` ``: *template string*, que monta um texto com valores dentro.
- `export`: deixa a função disponível para outros arquivos com `import`.

Resultado: `qa.17626100001231@teste.com`, `Produto QA 17626100001242`.

> O plano não usa a biblioteca Faker de propósito: os dados ficam legíveis no relatório e é uma dependência a menos.

### 3.2 `cypress/support/commands.js` — comandos customizados

O arquivo atual só tem comentários de exemplo. **Apague tudo** e escreva:

```js
import { emailUnico, nomeUnico } from './dados'

// Na config de API, a URL é o baseUrl. No E2E (Parte 3), vem de expose.
const api = (caminho) => `${Cypress.expose('API_URL') ?? Cypress.config('baseUrl')}${caminho}`

Cypress.Commands.add('criarUsuario', (dados = {}) => {
  const usuario = {
    nome: 'QA Cypress',
    email: emailUnico(),
    password: 'senha123',
    administrador: 'true',
    ...dados
  }
  return cy.request('POST', api('/usuarios'), usuario)
    .then(({ body }) => ({ ...usuario, _id: body._id }))
})

Cypress.Commands.add('login', ({ email, password }) =>
  cy.request('POST', api('/login'), { email, password }).its('body.authorization'))
```

**O que cada parte faz:**

- **`import { ... } from './dados'`**: traz as funções da Etapa 3.1.

- **A função `api(caminho)`**: monta a URL completa. `Cypress.expose('API_URL')` lê uma configuração pública que só vai existir no E2E. `??` significa "se o da esquerda não existir, use o da direita", então nos testes de API ela usa o `baseUrl`. **Por que isso existe?** O mesmo comando vai servir para a API local (testes de API) e para a pública (E2E). No Cypress 16, `expose` substitui o antigo `Cypress.env()`, que está obsoleto.

- **`Cypress.Commands.add('criarUsuario', ...)`**: registra o comando. Depois disso, qualquer teste pode chamar `cy.criarUsuario()`.

- **`(dados = {})`**: o comando aceita dados opcionais. Se você não passar nada, `dados` vira `{}`.

- **`...dados`** (*spread*): copia os campos de `dados` por cima dos padrões. Então:
  - `cy.criarUsuario()` cria um **admin** com tudo padrão;
  - `cy.criarUsuario({ administrador: 'false' })` cria um **cliente**, mudando só esse campo.

- **`administrador: 'true'`** entre aspas: a API exige o **texto** `"true"`, não o booleano `true`. Você vai ver isso na exploração.

- **`cy.request('POST', url, corpo)`**: faz a requisição HTTP, como o "Execute" do Swagger.

- **`.then(({ body }) => ...)`**: **quando a resposta chegar**, pega o `body` e devolve o usuário com o `_id` gerado pela API. **Por que devolver a senha também?** Para o teste conseguir fazer login depois, já que a API não devolve a senha no cadastro.

- **`login`**: faz `POST /login` e, com `.its('body.authorization')`, devolve **só o token** (`"Bearer eyJ..."`). O teste já recebe o valor pronto para usar no header.

> O terceiro comando, `criarProduto`, entra na Parte 2, quando você for testar produtos. Não escreva código antes de precisar dele.

### 3.3 `cypress/support/api.js` — o support da configuração de API

**Para que serve:** é o arquivo que a Etapa 2 apontou em `supportFile`. Ele roda **antes de cada spec** e liga o que precisa funcionar dentro do navegador do Cypress.

Crie o arquivo:

```js
import 'cypress-mochawesome-reporter/register'
import { register as registerCypressGrep } from '@cypress/grep'
import './commands'

registerCypressGrep()
```

- **Linha 1:** liga a parte do relatório que roda no navegador. O plugin tem duas metades: uma no Node (Etapa 2) e esta.
- **Linhas 2 e 5:** liga o filtro de tags. O README do `@cypress/grep` diz que essa chamada é **obrigatória**. Sem ela, as tags são ignoradas.
- **Linha 3:** carrega os comandos da Etapa 3.2.

> O `support/e2e.js` continua do jeito que está (só com `import './commands'`). Ele é da configuração de E2E, na Parte 3.

---

## Etapa 4 — Scripts no `package.json`

**Para que serve:** scripts são **atalhos** para comandos longos. Em vez de digitar `cypress run --config-file cypress.api.config.js --expose grepTags=-@bug-aberto`, você digita `npm run cy:api`. Eles também documentam o projeto: quem abre o `package.json` vê como rodar tudo. E o CI vai usar exatamente esses nomes.

**Como fazer:** abra `cypress-tests/package.json` e **troque** o bloco `"scripts"` atual por:

```json
"scripts": {
  "api:start": "serverest --nodoc --timeout 600",
  "cy:api": "cypress run --config-file cypress.api.config.js --expose grepTags=-@bug-aberto",
  "cy:api:smoke": "cypress run --config-file cypress.api.config.js --expose grepTags=@smoke,grepFilterSpecs=true",
  "cy:api:bugs": "cypress run --config-file cypress.api.config.js --expose grepTags=@bug-aberto,grepFilterSpecs=true --reporter-options reportDir=cypress/reports/api-bugs",
  "cy:open:api": "cypress open --config-file cypress.api.config.js",
  "test:api": "start-server-and-test api:start http://localhost:3000/usuarios cy:api",
  "test:api:smoke": "start-server-and-test api:start http://localhost:3000/usuarios cy:api:smoke"
},
```

> Cuidado com as vírgulas: **todas** as linhas têm vírgula no fim, **menos a última** de dentro do bloco. Um JSON com vírgula sobrando ou faltando quebra o `npm`.

**O que cada script faz:**

| Script | O que faz | Quando usar |
| --- | --- | --- |
| `api:start` | Sobe a API. `--nodoc` desliga o Swagger, que o teste não usa | Usado pelos `test:*` |
| `cy:api` | Roda todos os testes de API **menos** os `@bug-aberto` (o `-` na frente significa "exceto") | A regressão normal |
| `cy:api:smoke` | Roda **só** os `@smoke`. `grepFilterSpecs` nem abre arquivos sem a tag, o que deixa mais rápido | O teste rápido de PR |
| `cy:api:bugs` | Roda **só** os testes de defeitos conhecidos, com o relatório em outra pasta | Ver os bugs abertos sem misturar com a regressão |
| `cy:open:api` | Abre a **interface visual** do Cypress | Enquanto escreve testes (veja a Etapa 5) |
| `test:api` | Sobe a API, roda `cy:api` e desliga a API | **O comando do dia a dia** |
| `test:api:smoke` | O mesmo, com o smoke | Conferência rápida |

**Como o `start-server-and-test` funciona:** ele recebe 3 coisas: **qual script sobe o servidor** (`api:start`), **qual endereço esperar responder** (`/usuarios`) e **qual script rodar depois** (`cy:api`). Quando os testes terminam, ele desliga a API sozinho.

> O `cy:open:api` não está no plano. Acrescentei porque ajuda muito enquanto você aprende.

---

## Etapa 5 — O primeiro teste: CT-LOG-01

**Para que serve:** esta é a etapa mais importante da Parte 1. Até aqui você escreveu configuração **sem testar nada**. Um único teste simples passando prova que a configuração, os comandos, os plugins e o relatório funcionam juntos. Se você escrevesse 50 testes antes de rodar, um erro de configuração quebraria os 50, e seria difícil achar a causa.

O cenário é o **CT-LOG-01** do plano (seção 6.1): *login válido retorna 200, a mensagem de sucesso e um token no formato `Bearer <jwt>`*.

### 5.1 Escrever o teste

Crie `cypress/e2e/api/login.cy.js`:

```js
describe('POST /login', () => {
  it('CT-LOG-01 login válido retorna token Bearer', () => {
    cy.criarUsuario().then((usuario) => {
      cy.request('POST', '/login', {
        email: usuario.email,
        password: usuario.password
      }).then((resposta) => {
        expect(resposta.status).to.eq(200)
        expect(resposta.body.message).to.eq('Login realizado com sucesso')
        expect(resposta.body.authorization).to.match(/^Bearer /)
      })
    })
  })
})
```

**Linha por linha:**

- **`describe('POST /login', ...)`**: agrupa testes relacionados. Aparece como título no relatório.
- **`it('CT-LOG-01 ...', ...)`**: **um teste**. Começar o nome pelo ID do cenário liga o teste ao documento de cenários, e é isso que a matriz de rastreabilidade vai usar.
- **`cy.criarUsuario().then((usuario) => { ... })`**: cria o usuário e, **quando terminar**, entrega o resultado em `usuario`.
- **`cy.request('POST', '/login', {...})`**: como o `baseUrl` é `http://localhost:3000`, basta escrever `/login`.
- **`expect(...).to.eq(...)`**: uma **asserção**, ou seja, uma verificação. Se não for igual, o teste falha.
- **`.to.match(/^Bearer /)`**: compara com uma *expressão regular*. `^` significa "no começo", então a linha quer dizer "o texto começa com `Bearer `".

### ⚠️ O conceito mais importante do Cypress: por que tanto `.then`?

Você poderia pensar em escrever assim:

```js
const usuario = cy.criarUsuario()   // ❌ NÃO FUNCIONA
cy.request('POST', '/login', { email: usuario.email, ... })
```

**Não funciona** porque os comandos `cy.*` **não executam na hora**. Eles entram numa **fila**, e o Cypress executa um de cada vez, esperando cada um terminar. Na linha acima, `usuario` não é o usuário: é uma referência à fila.

O `.then(...)` diz: "**quando** este comando terminar, me dê o resultado e execute isto". É assim que você passa o resultado de um passo para o próximo.

Se esse conceito não ficar claro, me peça para explicar com outro exemplo. Ele aparece em **todos** os testes do projeto.

### 5.2 Rodar o teste

Na pasta `cypress-tests`:

```powershell
npm run test:api
```

**O que você vai ver, em ordem:**
1. O `start-server-and-test` sobe a API e espera `/usuarios` responder.
2. O Cypress roda em modo *headless* (sem abrir janela) e mostra no terminal:
   ```
     POST /login
       ✓ CT-LOG-01 login válido retorna token Bearer
     1 passing
   ```
3. Uma tabela final com o resumo e a API sendo desligada.

**Abra o relatório:** no Explorador de Arquivos, vá em `cypress-tests\cypress\reports\api\` e dê dois cliques em `index.html`.

### 5.3 A prova real: faça o teste falhar

**Para que serve:** um teste que **nunca falhou** pode estar passando por engano. Por exemplo, a asserção pode nem estar sendo executada. Faça ele falhar de propósito para ter certeza de que ele detecta erro.

1. Troque `.to.eq(200)` por `.to.eq(201)`.
2. Rode `npm run test:api` de novo.
3. Leia a mensagem: `expected 200 to equal 201`. Ela diz **o que veio** (200) e **o que você esperava** (201).
4. Veja o teste vermelho no relatório.
5. **Volte para 200.**

### 5.4 Modo visual (para o dia a dia)

**Para que serve:** no `cypress run` você só vê o resultado final. No `cypress open` você vê cada requisição, clica nela e inspeciona o corpo enviado e recebido. Ajuda muito a entender por que um teste falhou.

Ele **não sobe a API sozinho**, então use **dois terminais** (no VS Code, o botão `+` do terminal abre outro):

- **Terminal 1** (`cypress-tests`):
  ```powershell
  npm run api:start
  ```
- **Terminal 2** (`cypress-tests`):
  ```powershell
  npm run cy:open:api
  ```

Na janela do Cypress: **E2E Testing** → escolha o **Electron** → clique em `login.cy.js`. O teste roda na hora e roda de novo **sempre que você salvar o arquivo**. Clique em cada linha `request` no painel da esquerda e abra o **Console** do navegador (`F12`) para ver os detalhes.

### 5.5 Erros comuns nesta etapa

| Erro | Causa provável | Como resolver |
| --- | --- | --- |
| `ECONNREFUSED 127.0.0.1:3000` | A API não está no ar | Use `npm run test:api`, que sobe a API. No modo visual, confira se o Terminal 1 está rodando |
| `Missing script: "test:api"` | Terminal na pasta errada, ou erro no JSON | Confira se está em `cypress-tests` e revise as vírgulas do `package.json` |
| `Your configFile is invalid` | Erro de digitação no `cypress.api.config.js` | Leia a linha que o erro aponta |
| `No spec files were found` | O arquivo não está em `e2e/api/` ou não termina em `.cy.js` | Confira o nome e a pasta |
| `cy.criarUsuario is not a function` | O `commands.js` não foi carregado | Confira o `import './commands'` no `api.js` e o `supportFile` na config |
| `400` no cadastro de usuário | Corpo com campo errado | Compare com o que funcionou no Swagger (Etapa 0.2) |
| Porta 3000 em uso | Uma API ficou ligada de antes | Feche o terminal antigo ou aperte `Ctrl+C` nele |

### 5.6 Commit

Na pasta `C:\qa-serverest`:
```powershell
git status
```
**Confira a lista antes de commitar.** Não pode aparecer `node_modules` nem `cypress/reports`, porque o `.gitignore` deve escondê-los. Depois:

```powershell
git add cypress-tests
git commit -m "test(cypress): configura suíte de API e adiciona CT-LOG-01"
```

---

## Etapa 6 — Tags e smoke

**Para que serve:** nem todo teste precisa rodar sempre.
- **Smoke** é um conjunto pequeno de testes críticos que roda em segundos. O plano usa no pull request: se o login quebrou, não adianta rodar o resto.
- **`@bug-aberto`** marca testes de defeitos conhecidos, que **devem falhar** até o defeito ser corrigido. Eles saem da regressão para não deixar o pipeline sempre vermelho, mas continuam rodando separados (seção 8.1).

As tags permitem essa seleção **sem duplicar arquivos**.

### 6.1 Marcar o CT-LOG-01 como smoke

No `login.cy.js`, acrescente o objeto `{ tags: '@smoke' }` entre o nome e a função:

```js
it('CT-LOG-01 login válido retorna token Bearer', { tags: '@smoke' }, () => {
```

### 6.2 Criar um segundo teste, sem tag

Para provar que o filtro funciona, você precisa de um teste que **não** deveria rodar no smoke. Acrescente o **CT-LOG-02** (senha incorreta) dentro do mesmo `describe`:

```js
it('CT-LOG-02 senha incorreta retorna 401', () => {
  cy.criarUsuario().then((usuario) => {
    cy.request({
      method: 'POST',
      url: '/login',
      body: { email: usuario.email, password: 'senha-errada' },
      failOnStatusCode: false
    }).then((resposta) => {
      expect(resposta.status).to.eq(401)
      expect(resposta.body.message).to.eq('Email e/ou senha inválidos')
    })
  })
})
```

**O que é novo aqui:**
- **`cy.request({...})` com um objeto:** é a forma longa do comando, necessária quando você precisa de opções extras.
- **`failOnStatusCode: false`:** **muito importante.** Por padrão, o Cypress **falha o teste sozinho** se a resposta for 4xx ou 5xx. Num teste negativo, o 401 **é o resultado esperado**. Essa opção diz: "não falhe por causa do status, deixa que eu verifico". Você vai usar isso em **todos** os testes negativos.

### 6.3 Conferir o filtro

```powershell
npm run test:api:smoke
```
**Deve rodar só o CT-LOG-01.** O CT-LOG-02 não aparece.

```powershell
npm run test:api
```
**Devem rodar os dois.**

Se o smoke rodar os dois, me mostre a saída. O plano lista esse comportamento do `grepFilterSpecs` como um risco a conferir (seção 14.2).

### 6.4 Commit

```powershell
git add cypress-tests
git commit -m "test(cypress): adiciona CT-LOG-02 e tag de smoke"
```

---

## Checklist da Parte 1

- [ ] `.nvmrc` criado e commitado
- [ ] API explorada pelo Swagger, com anotações
- [ ] Pastas criadas conforme a seção 3
- [ ] `cypress.api.config.js` criado e `cypress.config.js` apagado
- [ ] `dados.js`, `commands.js` e `api.js` escritos, e você sabe explicar cada um
- [ ] Scripts no `package.json`
- [ ] CT-LOG-01 passando, falhou de propósito uma vez e o relatório abre
- [ ] Modo visual testado
- [ ] Smoke roda só o teste marcado
- [ ] Commits feitos

**Para checar se aprendeu:** tente responder sem olhar.
1. Por que o teste usa um e-mail diferente a cada execução?
2. Por que não dá para fazer `const usuario = cy.criarUsuario()`?
3. Para que serve o `failOnStatusCode: false`?
4. O que acontece se você esquecer o `registerCypressGrep()`?

Quando terminar, peça "revise meus arquivos da Parte 1" e siga para a Parte 2.

---

# Parte 2 — Suíte de API completa

Na Parte 1 você montou o esqueleto e escreveu 2 testes. Agora vem o trabalho principal do portfólio: cobrir as regras de negócio da API com os cenários da seção 6 do plano.

A ordem segue a **priorização por risco** do plano (seção 4.6). A primeira etapa é a de schemas, porque todas as outras usam.

| Etapa | Spec | Cenários |
| --- | --- | --- |
| 7 | (schemas) | contrato das respostas |
| 8 | `login.cy.js` | CT-LOG-03 e 04 |
| 9 | `autorizacao.cy.js` | CT-AUT-01 a 03 |
| 10 | `produtos.cy.js` | CT-PRD-01 a 08 |
| 11 | `carrinhos.cy.js` | CT-CAR-01 a 08 |
| 12 | `usuarios.cy.js` | CT-USR-01 a 06 |
| 13 | — | estabilidade e testes de defeito |

## Como esta parte funciona

Na Parte 1 eu mostrei todo o código. Aqui vou **diminuindo a ajuda aos poucos**, porque é assim que você aprende a escrever sozinha:

- **Conceito novo:** eu explico e mostro um exemplo completo.
- **"Sua vez":** eu dou a tabela de casos, as mensagens exatas da API e uma dica. O código é com você.
- **Travou?** Peça "me dá uma dica da Etapa X" (pista sem a solução) ou "me mostra a solução da Etapa X" (eu mostro e explico).

> **De onde vêm as mensagens:** todas as respostas das tabelas abaixo foram conferidas na API local 3.2.2 em 08/11/2026. Mesmo assim, se o seu teste mostrar outra coisa, confie no que a API devolve e me avise.

## Antes de começar: commite a Parte 1

Você terminou a Parte 1 mas ainda não fez os commits. Corrigi o `.gitignore`: as regras antigas não ignoravam `cypress-tests/cypress/reports/` nem `cypress-tests/cypress/screenshots/`, então os relatórios iriam para o GitHub. Agora estão ignorados.

Na pasta `C:\qa-serverest`:

```powershell
git status
```

**Confira** que **não** aparecem as pastas `reports` nem `screenshots`. Depois:

```powershell
git add .gitignore .nvmrc docs cypress-tests
git commit -m "test(cypress): configura suíte de API com CT-LOG-01 e CT-LOG-02"
```

> **`git add` de um arquivo apagado:** você apagou o `cypress.config.js`. O `git add cypress-tests` também registra essa remoção, então ela vai no mesmo commit.

---

## Etapa 7 — Schemas: testar o contrato da resposta

### Para que serve

Até agora seus testes verificam **valores**: "o status é 200", "a mensagem é tal". Mas e se a API passasse a devolver `authorization` como número, ou parasse de devolver o `_id`? Nenhum `expect` atual pegaria isso.

O **schema** (JSON Schema) é um "molde" que descreve a **estrutura** da resposta: quais campos existem, de que tipo são e quais são obrigatórios. Ao validar a resposta contra o molde, você testa o **contrato**, a promessa da API sobre o formato dos dados. Isso protege o **risco R6** do plano: mudança de contrato.

| Asserções (`expect`) | Schema |
| --- | --- |
| Verificam **valores** específicos | Verificam a **estrutura** inteira |
| "a mensagem é *Login realizado com sucesso*" | "existe um campo `message` do tipo texto" |
| Uma linha por campo | Um arquivo reutilizável em vários testes |

Os dois se completam: o schema garante o formato e o `expect` garante o conteúdo.

### Como é um schema

Esta é a resposta do login:

```json
{
  "message": "Login realizado com sucesso",
  "authorization": "Bearer eyJhbGciOi..."
}
```

E este é o schema dela. Crie o arquivo `cypress/fixtures/schemas/login.json`:

```json
{
  "type": "object",
  "required": ["message", "authorization"],
  "properties": {
    "message": { "type": "string" },
    "authorization": { "type": "string", "pattern": "^Bearer [\\w-]+\\.[\\w-]+\\.[\\w-]+$" }
  },
  "additionalProperties": false
}
```

**Linha por linha:**
- **`"type": "object"`:** a resposta é um objeto, ou seja, um `{ }`.
- **`"required"`:** campos que **têm que** existir. Se faltar um, a validação falha.
- **`"properties"`:** o tipo de cada campo.
- **`"pattern"`:** uma expressão regular que o texto tem que seguir. Aqui é o formato de um JWT: `Bearer` e três blocos separados por pontos. A barra aparece dobrada (`\\w`) porque dentro de um JSON a `\` precisa ser escrita como `\\`.
- **`"additionalProperties": false`:** **nenhum campo além dos listados** é permitido. Se a API passar a devolver um campo novo, o teste avisa. Use quando a resposta for pequena e estável.

### Como validar no teste

O **AJV** é a biblioteca que compara um objeto com um schema. Ele já está instalado (`ajv` no `package.json`).

No topo do `login.cy.js`, **antes** do `describe`, acrescente:

```js
import Ajv from 'ajv'
import schemaLogin from '../../fixtures/schemas/login.json'

const ajv = new Ajv({ allErrors: true })
```

E dentro do CT-LOG-01, junto das outras asserções:

```js
expect(ajv.validate(schemaLogin, resposta.body), JSON.stringify(ajv.errors)).to.be.true
```

**O que acontece aqui:**
- **`import ... from '../../fixtures/schemas/login.json'`:** carrega o arquivo JSON como objeto. O caminho é **relativo ao arquivo de teste**: `../..` sobe duas pastas, de `e2e/api/` até `cypress/`.
- **`new Ajv({ allErrors: true })`:** cria o validador. `allErrors` faz ele listar **todos** os problemas, e não só o primeiro.
- **`ajv.validate(schema, dados)`:** devolve `true` se os dados seguem o molde e `false` se não seguem.
- **`JSON.stringify(ajv.errors)`:** o segundo argumento do `expect` é a **mensagem mostrada quando falha**. Sem ele, você veria só `expected false to be true` e não saberia o que está errado. Com ele, você vê algo como `"must have required property 'authorization'"`.

### Faça falhar de propósito

Troque `"authorization"` por `"token"` no `required` do schema, rode e leia a mensagem de erro. Depois volte ao original.

### Sua vez: os outros schemas

O plano prevê 5 schemas. Escreva os outros 4 a partir destas respostas reais:

| Arquivo | Resposta de exemplo | Usado em |
| --- | --- | --- |
| `cadastro.json` | `{"message":"Cadastro realizado com sucesso","_id":"be99s0mdSAKHBY00"}` | POST de usuário, produto e carrinho |
| `usuario.json` | `{"nome":"Q","email":"a@t.com","password":"s","administrador":"true","_id":"t6BFBLUUUlBByhwu"}` | GET /usuarios/{id} |
| `produto.json` | `{"nome":"P1","preco":10,"descricao":"d","quantidade":3,"_id":"be99s0mdSAKHBY00"}` | GET /produtos/{id} |
| `carrinho.json` | `{"produtos":[{"idProduto":"be99...","quantidade":2,"precoUnitario":10}],"precoTotal":20,"quantidadeTotal":2,"idUsuario":"Jome...","_id":"HQkz..."}` | GET /carrinhos/{id} |

**Dicas:**
- `_id` sempre tem **16 caracteres** letras ou números. Use `"pattern": "^[A-Za-z0-9]{16}$"`.
- `preco` e `quantidade` são números **inteiros**: use `"type": "integer"`, que é mais rigoroso que `"number"`.
- `administrador` é **texto**, não booleano. Dá para usar `"enum": ["true", "false"]`, que significa "só aceita um destes valores".
- No `carrinho.json`, `produtos` é uma **lista de objetos**. Isso se escreve com `"type": "array"` e `"items": { ...schema de cada item... }`.

Cada schema só vai ser usado de verdade nas etapas seguintes, quando você testar aquele recurso.

> **Se o `import` do JSON ou do AJV der erro** ao rodar, me mande a mensagem. O plano ainda não executou essa combinação, e esse é um dos pontos que a Etapa 4 dele manda validar.

### Commit

```powershell
git add cypress-tests
git commit -m "test(cypress): adiciona JSON Schemas e valida contrato do login"
```

---

## Etapa 8 — Login completo (CT-LOG-03 e 04)

### Conceito novo: testes dirigidos por dados

O CT-LOG-04 testa **várias entradas inválidas** que seguem o mesmo roteiro: envia, espera 400, confere a mensagem. Escrever um `it` para cada uma seria repetir o mesmo código várias vezes.

A técnica é colocar **os dados numa lista** e gerar um teste para cada item com `forEach`. Isso se chama **teste dirigido por dados** (*data-driven*), e é a forma natural de implementar **particionamento de equivalência**: cada item da lista representa uma classe de entrada inválida.

```js
const entradasInvalidas = [
  { caso: 'corpo vazio', body: {}, campo: 'email', mensagem: 'email é obrigatório' },
  { caso: 'e-mail em branco', body: { email: '', password: 'x' }, campo: 'email', mensagem: 'email não pode ficar em branco' }
]

entradasInvalidas.forEach(({ caso, body, campo, mensagem }) => {
  it(`CT-LOG-04 recusa ${caso}`, () => {
    cy.request({ method: 'POST', url: '/login', body, failOnStatusCode: false })
      .then(({ status, body: resposta }) => {
        expect(status).to.eq(400)
        expect(resposta[campo]).to.eq(mensagem)
      })
  })
})
```

**O que é novo:**
- **`forEach`:** percorre a lista e, para cada item, executa a função. Cada execução cria um `it`, então o relatório mostra um teste por caso, cada um com seu nome.
- **`({ caso, body, campo, mensagem })`:** *desestruturação*. Tira os campos do objeto e cria variáveis com os mesmos nomes.
- **`` `CT-LOG-04 recusa ${caso}` ``:** o nome do teste muda a cada caso. Se um falhar, você sabe **qual**.
- **`body: resposta`:** renomeia na desestruturação. A resposta também tem um campo `body`, e como já existe uma variável `body` (o corpo enviado), damos outro nome ao recebido.
- **`resposta[campo]`:** lê o campo cujo nome está na variável. A API devolve o erro **dentro do campo que falhou**, por exemplo `{"email": "email é obrigatório"}`.

**Por que essa forma é melhor:** para acrescentar um caso, você acrescenta **uma linha na lista**, sem escrever outro teste. E quem lê a lista entende de cara quais entradas foram testadas.

### Sua vez

| Cenário | Envio | Status | Resposta esperada |
| --- | --- | --- | --- |
| CT-LOG-03 | e-mail que **não existe**, com qualquer senha | 401 | `message`: `Email e/ou senha inválidos` |
| CT-LOG-04 | `{}` | 400 | `email`: `email é obrigatório` (e `password`: `password é obrigatório`) |
| CT-LOG-04 | `{ email: '', password: '' }` | 400 | `email`: `email não pode ficar em branco` |
| CT-LOG-04 | `{ email: 'abc', password: 'x' }` | 400 | `email`: `email deve ser um email válido` |

**Dicas:**
- No CT-LOG-03, use `emailUnico()` para gerar um e-mail que com certeza não existe. Vai precisar de `import { emailUnico } from '../../support/dados'` no topo.
- **Por que o CT-LOG-03 importa?** A mensagem é **a mesma** do CT-LOG-02 (senha errada). Isso é uma boa prática de segurança: a API não revela se o e-mail existe. Um atacante não consegue descobrir quais e-mails estão cadastrados. Na entrevista, isso mostra que você pensa além do "passou/falhou".

### Commit

```powershell
git commit -am "test(cypress): completa cenários de login"
```

> **`-am`** é um atalho para `git add` de **arquivos já versionados** + commit. Ele **não** inclui arquivos novos: quando criar um arquivo, use `git add` antes.

---

## Etapa 9 — Autorização (CT-AUT-01 a 03)

Esta é a etapa de **maior prioridade** do plano: se a autorização falhar, qualquer pessoa cadastra produtos ou mexe em carrinhos alheios.

### Conceito novo 1: preparar dados uma vez com `before`

Vários testes precisam de um token de admin e um de cliente. Criar usuários novos em cada teste é lento. O `before` roda **uma vez**, antes de todos os testes do `describe`:

```js
describe('Autorização em POST /produtos', () => {
  let tokenAdmin
  let tokenCliente

  before(() => {
    cy.criarUsuario({ administrador: 'true' })
      .then((admin) => cy.login(admin))
      .then((token) => { tokenAdmin = token })

    cy.criarUsuario({ administrador: 'false' })
      .then((cliente) => cy.login(cliente))
      .then((token) => { tokenCliente = token })
  })

  // os testes usam tokenAdmin e tokenCliente
})
```

**O que é novo:**
- **`let tokenAdmin`:** declarada **fora** dos testes, para que todos dentro do `describe` enxerguem a variável.
- **`.then((admin) => cy.login(admin))`:** quando o `.then` **devolve** um comando `cy`, o próximo `.then` recebe o resultado **dele**. Por isso dá para encadear em linha reta: criar → logar → guardar, sem `.then` dentro de `.then`.
- **`cy.login(admin)`:** o comando recebe o objeto inteiro e usa só `email` e `password`.

**Cuidado:** use `before` só para dados que **os testes não alteram**. Se um teste mudar a senha desse usuário, os seguintes quebram. Os testes de estado (CT-AUT-02 e 03) criam o **próprio** usuário.

### Conceito novo 2: a tabela de decisão vira uma lista

A tabela de decisão do plano (seção 6.2) combina condições (tem header? tem `Bearer`? o usuário existe? é admin?) e define o resultado de cada combinação. Ela vira uma lista de casos, como no CT-LOG-04. Há um detalhe novo, porém:

```js
const casos = [
  { caso: 'sem header', header: () => undefined, status: 401 },
  { caso: 'token de cliente', header: () => tokenCliente, status: 403 },
  { caso: 'token de admin', header: () => tokenAdmin, status: 201 }
]
```

**Por que `header` é uma função (`() => tokenAdmin`) e não só `tokenAdmin`?**

A lista é montada quando o arquivo é **lido**. Nesse momento o `before` **ainda não rodou** e `tokenAdmin` é `undefined`. Se você escrevesse `header: tokenAdmin`, a lista guardaria `undefined` para sempre. Com a função, o valor só é lido **quando o teste chama `header()`**, e aí o `before` já terminou. É o mesmo assunto da fila do Cypress, visto por outro ângulo.

Dentro do teste:

```js
casos.forEach(({ caso, header, status }) => {
  it(`CT-AUT-01 ${caso} retorna ${status}`, () => {
    const token = header()
    cy.request({
      method: 'POST',
      url: '/produtos',
      headers: token ? { Authorization: token } : {},
      body: { nome: nomeUnico(), preco: 100, descricao: 'Teste', quantidade: 5 },
      failOnStatusCode: false
    }).its('status').should('eq', status)
  })
})
```

- **`token ? { Authorization: token } : {}`:** *operador ternário*, um "se/senão" em uma linha. Se houver token, manda o header. Se não houver, manda nenhum header. É assim que se testa "sem header".
- **`.its('status').should('eq', status)`:** forma curta de pegar um campo e verificar. Equivale ao `.then` com `expect`.

### Sua vez: as 6 linhas da tabela

| Caso | Header `Authorization` | Status | Mensagem |
| --- | --- | --- | --- |
| Sem header | (não envia) | 401 | `Token de acesso ausente, inválido, expirado ou usuário do token não existe mais` |
| Sem prefixo `Bearer` | o token do admin **sem** o `Bearer ` | 401 | (a mesma) |
| Token malformado | `Bearer abc.def.ghi` | 401 | (a mesma) |
| Usuário do token foi excluído | token válido de um admin **já apagado** | 401 | (a mesma) |
| Cliente | token de cliente | 403 | `Rota exclusiva para administradores` |
| Admin | token de admin | 201 | `Cadastro realizado com sucesso` |

**Dicas:**
- **Sem `Bearer`:** `tokenAdmin.replace('Bearer ', '')` remove o prefixo. Lembre que isso também precisa estar dentro de uma função.
- **Usuário excluído:** é a linha mais difícil. Você precisa, no `before`, criar um **terceiro** admin, fazer login, guardar o token **e depois** apagar o usuário com `DELETE /usuarios/{id}` (essa rota não exige token). Pense na ordem dos `.then`. Se travar, peça uma dica.
- Para conferir a mensagem e não só o status, troque o `.its(...)` por um `.then` com dois `expect`. Coloque a mensagem esperada como mais um campo na lista de casos.

### Sua vez: CT-AUT-02 e 03 (transição de estados)

Esses cenários testam o **estado do token**: um token que era válido deixa de valer depois de um evento. Cada um cria o próprio usuário.

| Cenário | Passos | Esperado |
| --- | --- | --- |
| CT-AUT-02 | 1. Cria um **cliente** e faz login (guarda o token). 2. `PUT /usuarios/{id}` com os mesmos dados e **outra senha**. 3. `POST /carrinhos` com o token **antigo** | 401 |
| CT-AUT-03 | 1. Cria um **admin** e faz login. 2. `DELETE /usuarios/{id}`. 3. `POST /produtos` com o token | 401 |

**Dicas:**
- O `PUT` exige o corpo **completo** (`nome`, `email`, `password`, `administrador`), não só a senha. A resposta é 200 `Registro alterado com sucesso`.
- No CT-AUT-02, o `POST /carrinhos` precisa de um produto existente no corpo, senão a API pode recusar por outro motivo. Use um produto criado com o token do admin do `before`. É aqui que entra o comando `criarProduto` (Etapa 10.1), então você pode fazer a 10.1 antes.
- **Por que esses testes importam (risco R3):** se o token continuasse valendo depois da troca de senha, quem roubasse um token manteria o acesso mesmo após a vítima mudar a senha.

### Tags

Coloque `@smoke` no caso **cliente → 403** e no **admin → 201**. São os dois que dizem "a autorização básica funciona".

### Commit

```powershell
git add cypress-tests
git commit -m "test(cypress): adiciona tabela de decisão de autorização e testes de estado do token"
```

---

## Etapa 10 — Produtos (CT-PRD-01 a 08)

### 10.1 O terceiro comando: `criarProduto`

Os testes de produtos e de carrinhos precisam de produtos prontos. Acrescente no `commands.js`, depois do `login`:

```js
Cypress.Commands.add('criarProduto', (token, dados = {}) => {
  const produto = {
    nome: nomeUnico(),
    preco: 100,
    descricao: 'Produto de teste',
    quantidade: 5,
    ...dados
  }
  return cy.request({
    method: 'POST',
    url: api('/produtos'),
    body: produto,
    headers: { Authorization: token }
  }).then(({ body }) => ({ ...produto, _id: body._id }))
})
```

É o mesmo padrão do `criarUsuario`: valores padrão, `...dados` para sobrescrever e devolve o produto com o `_id`. A diferença é que esta rota **exige token de admin**, que entra como primeiro argumento. Exemplo: `cy.criarProduto(tokenAdmin, { quantidade: 3 })`.

### 10.2 Conceito novo: análise de valor limite

**Defeitos se escondem nas fronteiras.** Se a regra é "preço inteiro maior ou igual a 1", o programador pode ter escrito `> 1` em vez de `>= 1`. Testar com 500 nunca encontraria esse erro. Testar com **0, 1 e 2** encontra.

A técnica: para cada fronteira, teste **o valor no limite**, **logo abaixo** e **logo acima**.

```
         inválido │ válido
    ... -1    0   │  1    2   ...
                  ▲
             a fronteira
```

Para o preço também existem fronteiras de **tipo** (10.5 não é inteiro) e de **tamanho máximo** (o maior inteiro seguro do JavaScript).

### Sua vez: os cenários de produtos

Crie `cypress/e2e/api/produtos.cy.js`. Use um `before` com o token de admin, como na Etapa 9.

**Uma função auxiliar ajuda muito.** O plano sugere estas duas, dentro do `describe` (seção 8.5):

```js
const produtoValido = (dados = {}) =>
  ({ nome: nomeUnico(), preco: 100, descricao: 'Produto de teste', quantidade: 5, ...dados })

const cadastrar = (body, token = tokenAdmin) =>
  cy.request({ method: 'POST', url: '/produtos', body, headers: { Authorization: token }, failOnStatusCode: false })
```

Assim o teste de preço 0 fica em uma linha: `cadastrar(produtoValido({ preco: 0 }))`.

> **Por que `cadastrar` não é um comando como o `criarProduto`?** O `criarProduto` serve para **preparar** dados e falha se algo der errado. O `cadastrar` é o **objeto do teste**: aceita qualquer resposta (`failOnStatusCode: false`), porque o teste quer justamente verificar a resposta. Como só é usado neste arquivo, fica aqui.

| Cenário | Envio | Status | Resposta esperada |
| --- | --- | --- | --- |
| CT-PRD-01 | produto válido, depois `GET /produtos/{id}` | 201, depois 200 | `Cadastro realizado com sucesso`; o GET devolve os mesmos dados. Valide com os schemas `cadastro.json` e `produto.json` |
| CT-PRD-02 | o **mesmo nome** de um produto existente | 400 | `message`: `Já existe produto com esse nome` |
| CT-PRD-02 | o mesmo nome com **espaços nas pontas** (`'  Nome  '`) | 400 | (a mesma) |
| CT-PRD-03 | preço `0` | 400 | `preco`: `preco deve ser um número positivo` |
| CT-PRD-03 | preço `-1` | 400 | `preco`: `preco deve ser um número positivo` |
| CT-PRD-03 | preço `1` e `2` | 201 | — |
| CT-PRD-03 | preço `10.5` | 400 | `preco`: `preco deve ser um inteiro` |
| CT-PRD-03 | preço `9007199254740992` | 400 | `preco`: `preco não pode ser maior que 9007199254740991` |
| CT-PRD-04 | quantidade `-1` | 400 | `quantidade`: `quantidade deve ser maior ou igual a 0` |
| CT-PRD-04 | quantidade `1.5` | 400 | confira a mensagem você mesma |
| CT-PRD-04 | quantidade `0` e `1` | 201 | — |
| CT-PRD-05 | `{}` | 400 | `nome`: `nome é obrigatório` (e o mesmo para os outros 3 campos) |
| CT-PRD-05 | `descricao: ''` | 400 | `descricao`: `descricao não pode ficar em branco` |
| CT-PRD-05 | `preco: 'dez'` | 400 | `preco`: `preco deve ser um número` |
| CT-PRD-06 | `nome: '    '` (só espaços) | **400 esperado** | `nome`: `nome não pode ficar em branco`. **Hoje a API devolve 201: é o BUG-02** |
| CT-PRD-07 | `DELETE /produtos/{id}` de um produto que está num carrinho | 400 | `message`: `Não é permitido excluir produto que faz parte de carrinho` |
| CT-PRD-08 | `PUT /produtos/{id}` usando o nome de **outro** produto | 400 | `message`: `Já existe produto com esse nome` |

**Dicas:**
- **CT-PRD-03 e 04:** use a lista + `forEach` da Etapa 8, como no exemplo da seção 8.5 do plano.
- **CT-PRD-02 com espaços:** primeiro crie o produto com `cy.criarProduto(tokenAdmin)`, depois tente cadastrar `` `  ${produto.nome}  ` ``.
- **CT-PRD-07:** crie um produto, crie um **cliente**, faça login com ele e monte um carrinho com esse produto (`POST /carrinhos` com `{ produtos: [{ idProduto, quantidade: 1 }] }`). Só então tente apagar o produto.
- **CT-PRD-08:** crie **dois** produtos e faça `PUT` no segundo com o nome do primeiro. O `PUT` exige todos os campos.

### 10.3 Conceito novo: teste de defeito aberto (`@bug-aberto`)

O CT-PRD-06 testa um defeito **real e conhecido**, o BUG-02. O que fazer com um teste que **sabemos que vai falhar**?

| Opção | Problema |
| --- | --- |
| Apagar o teste | O defeito some da suíte e ninguém lembra dele |
| `it.skip` (pular) | Fica escondido; ninguém percebe quando o defeito for corrigido |
| Testar o comportamento errado (esperar 201) | O teste "aprova" o defeito, o que é pior que não testar |
| Deixar na regressão | O pipeline fica vermelho para sempre e o time passa a ignorar falhas |
| **Afirmar o correto + tag `@bug-aberto`** ✅ | Sai da regressão (`cy:api` exclui a tag), mas roda separado (`cy:api:bugs`) e aparece no relatório. Quando o defeito for corrigido, o teste passa e avisa |

Na prática, é só a tag:

```js
it('CT-PRD-06 recusa nome só com espaços (BUG-02)', { tags: '@bug-aberto' }, () => {
  // afirme o comportamento CORRETO: 400 e a mensagem
})
```

#### ⚠️ Armadilha: o defeito "suja" o banco local

Como a API **aceita** o nome só de espaços, ela **grava** um produto de nome vazio. Na próxima execução, o teste recebe outro erro, `Já existe produto com esse nome`, e passa a falhar **por outro motivo**. Como os dados locais não são apagados (DOC-02), isso se acumularia.

A solução é **desfazer o que o defeito criou antes de verificar**:

```js
cadastrar(produtoValido({ nome: '    ' })).then(({ status, body }) => {
  if (status === 201) {
    // o defeito aconteceu: apaga o produto para não afetar as próximas execuções
    cy.request({ method: 'DELETE', url: `/produtos/${body._id}`, headers: { Authorization: tokenAdmin } })
  }
  expect(status).to.eq(400)
  expect(body.nome).to.eq('nome não pode ficar em branco')
})
```

**Por que a limpeza vem antes do `expect`?** Quando um `expect` falha, o teste **para ali**. Se a limpeza viesse depois, nunca rodaria. É um detalhe que mostra maturidade. Vale comentar na entrevista.

**Confira:**
- `npm run test:api`: o CT-PRD-06 **não** aparece.
- Com a API no ar, `npm run cy:api:bugs`: aparece **só** ele, **falhando** com `expected 201 to equal 400`. É exatamente o defeito.

### Tags

`@smoke` no CT-PRD-01.

### Commit

```powershell
git add cypress-tests
git commit -m "test(cypress): adiciona cenários de produtos com valor limite e BUG-02"
```

---

## Etapa 11 — Carrinhos e estoque (CT-CAR-01 a 08)

Esta etapa reproduz o **defeito mais forte do portfólio** (BUG-01: pedir mais do que o estoque). Também é onde o cuidado com os dados mais importa.

### Conceito novo: transição de estados

Um carrinho passa por **estados**, e cada ação muda o estado e o estoque:

```
                 POST /carrinhos
                 (estoque diminui)
  ┌────────────┐ ───────────────► ┌──────────────┐
  │ sem        │                  │ com          │
  │ carrinho   │ ◄─────────────── │ carrinho     │
  └────────────┘  concluir-compra └──────────────┘
        ▲         (estoque continua baixo)  │
        └───────────────────────────────────┘
                  cancelar-compra
                  (estoque volta)
```

Testar transições significa verificar **o estado depois de cada ação**: não basta o 200 do cancelamento, é preciso consultar o produto e ver se o estoque **voltou**.

### Regra de ouro desta spec: cada teste cria os próprios dados

Aqui **não** dá para compartilhar usuário e produto no `before`:
- **Usuário:** cada um só pode ter **1 carrinho**. Se dois testes usassem o mesmo cliente, o segundo receberia "Não é permitido ter mais de 1 carrinho".
- **Produto:** os testes verificam o **estoque exato** (3 → 1). Se outro teste mexesse no mesmo produto, os números não bateriam.

Só o **token de admin** pode ficar no `before`, porque ele serve para criar produtos e nenhum teste o altera.

Uma função auxiliar no início do `describe` evita repetição:

```js
const novoCliente = () =>
  cy.criarUsuario({ administrador: 'false' }).then((cliente) => cy.login(cliente))
```

Uso: `novoCliente().then((tokenCliente) => { ... })`.

### Exemplo completo: CT-CAR-01

```js
it('CT-CAR-01 criar carrinho baixa o estoque', { tags: '@smoke' }, () => {
  cy.criarProduto(tokenAdmin, { quantidade: 3, preco: 10 }).then((produto) => {
    novoCliente().then((tokenCliente) => {
      cy.request({
        method: 'POST',
        url: '/carrinhos',
        headers: { Authorization: tokenCliente },
        body: { produtos: [{ idProduto: produto._id, quantidade: 2 }] }
      }).then(({ status, body }) => {
        expect(status).to.eq(201)

        cy.request(`/carrinhos/${body._id}`).its('body.precoTotal').should('eq', 20)
        cy.request(`/produtos/${produto._id}`).its('body.quantidade').should('eq', 1)
      })
    })
  })
})
```

**Leia de fora para dentro:**
1. Cria um produto com **estoque 3** e **preço 10**. Valores pequenos e conhecidos deixam a conta fácil de conferir.
2. Cria um cliente novo e pega o token.
3. Faz um carrinho com 2 unidades → espera 201.
4. **Verifica o efeito:** o carrinho custa 2 × 10 = 20, e o estoque caiu de 3 para 1.

> `cy.request('/carrinhos/...')` só com a URL faz um **GET**, que é o método padrão.

### Sua vez

| Cenário | Preparação | Ação | Esperado |
| --- | --- | --- | --- |
| CT-CAR-02 | cliente **já com** um carrinho | outro `POST /carrinhos` | 400 `Não é permitido ter mais de 1 carrinho` |
| CT-CAR-03 | carrinho com 2 de um produto de estoque 3 | `DELETE /carrinhos/cancelar-compra` → `GET` do produto | 200 `Registro excluído com sucesso. Estoque dos produtos reabastecido`; estoque **volta para 3** |
| CT-CAR-04 | igual ao anterior | `DELETE /carrinhos/concluir-compra` → `GET` do produto | 200 `Registro excluído com sucesso`; estoque **continua 1** |
| CT-CAR-05 | produto com estoque 3 | carrinho com **4** | 400 `Produto não possui quantidade suficiente` |
| CT-CAR-06 | produto A | `[A, A]` (repetido **lado a lado**) | 400 `Não é permitido possuir produto duplicado` |
| CT-CAR-06 | produtos A e B | `[A, B, A]` (repetido **separado**) | **400 esperado**, a mesma mensagem. **Hoje devolve 201: é o BUG-01** → tag `@bug-aberto` |
| CT-CAR-07 | cliente **sem** carrinho | `DELETE` em `concluir-compra` e em `cancelar-compra` | 200 `Não foi encontrado carrinho para esse usuário` nos dois |
| CT-CAR-08 | — | `produtos: []` | 400 `produtos`: `produtos não contém 1 valor obrigatório` |
| CT-CAR-08 | produto existente | `quantidade: 0` | 400 `produtos[0].quantidade`: `produtos[0].quantidade deve ser um número positivo` |
| CT-CAR-08 | — | `idProduto: 'AAAAAAAAAAAAAAAA'` (16 caracteres que não existem) | 400 `message`: `Produto não encontrado` |

**Dicas:**
- As rotas `concluir-compra` e `cancelar-compra` **não recebem ID**. A API descobre o carrinho **pelo token**, então mande o header do cliente.
- **CT-CAR-08 com `quantidade: 0`:** o nome do campo de erro tem colchetes e ponto (`produtos[0].quantidade`). Leia com `body['produtos[0].quantidade']`, porque `body.produtos[0].quantidade` tentaria navegar por dentro do objeto.
- **CT-CAR-06 `[A, B, A]` (BUG-01):** é a mesma armadilha do BUG-02. Se a API aceitar, ela **cria o carrinho e baixa o estoque**. O cliente é novo a cada execução, então não afeta os próximos testes. Mesmo assim, por boa prática, cancele a compra antes do `expect` se o status vier 201.
- **Para aprofundar o BUG-01** (opcional, ótimo para a entrevista): com A de estoque 3, peça `[{A, 2}, {B, 1}, {A, 2}]`. São 4 unidades de A, mais que o estoque. Consulte o produto depois: o estoque cai só para 1. É a prova de que a API "vendeu" o que não tinha.

### Tags

`@smoke` no CT-CAR-01. `@bug-aberto` no caso `[A, B, A]`.

### Commit

```powershell
git add cypress-tests
git commit -m "test(cypress): adiciona cenários de carrinho e estoque com BUG-01"
```

---

## Etapa 12 — Usuários (CT-USR-01 a 06)

A essa altura você já conhece todas as técnicas. Esta etapa é para **praticar sozinha**.

| Cenário | Envio | Status | Esperado |
| --- | --- | --- | --- |
| CT-USR-01 | usuário válido → `GET /usuarios/{id}` | 201 → 200 | `_id` com 16 caracteres; o GET devolve **os mesmos dados** enviados. Valide com `cadastro.json` e `usuario.json` |
| CT-USR-02 | e-mail já cadastrado | 400 | `message`: `Este email já está sendo usado` |
| CT-USR-03 | `{}` | 400 | uma mensagem `... é obrigatório` por campo |
| CT-USR-03 | `administrador: true` (booleano, sem aspas) | 400 | `administrador`: `administrador deve ser 'true' ou 'false'` |
| CT-USR-03 | campo `extra: 1` | 400 | `extra`: `extra não é permitido` |
| CT-USR-03 | `nome: null`, `nome: ''` e `password: 123` | 400 | **descubra as mensagens rodando** e registre o que viu |
| CT-USR-04 | `DELETE /usuarios/{id}` de um usuário **com carrinho** | 400 | `message`: `Não é permitido excluir usuário com carrinho cadastrado`, e a resposta traz `idCarrinho` |
| CT-USR-05 | `DELETE /usuarios/AAAAAAAAAAAAAAAA` (não existe) | 200 | `message`: `Nenhum registro excluído` |
| CT-USR-06 | `PUT /usuarios/BBBBBBBBBBBBBBBB` (não existe) com corpo completo | 201 | `Cadastro realizado com sucesso` e um `_id` **diferente** do enviado |

**Dicas:**
- **CT-USR-01:** "o GET devolve os mesmos dados" é uma verificação de **consistência**, que confirma que o que foi gravado é o que foi enviado. Compare campo a campo, ou use `expect(body).to.include({ nome, email, ... })`, que confere se o objeto **contém** esses valores.
- **CT-USR-03, linha "descubra":** esses casos são \[OBS\] no plano, ou seja, a resposta esperada vem da observação. Rode, veja a mensagem e só então escreva o `expect`. Anote no `achados-exploratorios.md`.
- **CT-USR-06:** no PUT de um ID inexistente, o Swagger diz que um registro é **criado**. O que **você** vai observar é que o ID enviado é **ignorado** e outro é gerado. Teste `expect(body._id).not.to.eq('BBBBBBBBBBBBBBBB')` e registre como achado.
- **CT-USR-07 não é automatizado.** Ele depende de uma decisão de produto (\[HIP\]: o e-mail deveria ignorar maiúsculas?). Fica documentado.

### Tags

`@smoke` no CT-USR-01.

### Commit

```powershell
git add cypress-tests
git commit -m "test(cypress): adiciona cenários de usuários"
```

---

## Etapa 13 — Estabilidade e revisão da suíte

### Para que serve

Uma suíte que **às vezes** falha sem motivo (*flaky*) é pior do que nenhuma: o time aprende a ignorar o vermelho. O critério do plano (seção 13) é: **`npm run test:api` passando 3 vezes seguidas, a partir de `npm ci`**.

### 13.1 Instalação limpa

**Para que serve:** simular o que o GitHub Actions faz. O `npm ci` apaga o `node_modules` e instala **exatamente** o que está no `package-lock.json`. Se alguma coisa só funciona na sua máquina porque você instalou algo à parte, aparece aqui.

Na pasta `cypress-tests`:

```powershell
npm ci
```

> **Efeito colateral útil:** como os dados da API ficam dentro do `node_modules` (DOC-02), o `npm ci` também **zera o banco local**. Você roda num ambiente limpo, como o do CI.

### 13.2 Rodar 3 vezes

```powershell
npm run test:api
npm run test:api
npm run test:api
```

**Esperado:** as três passam, e nenhum `@bug-aberto` aparece.

**Se algum teste falhar só às vezes, não ignore.** Causas comuns:
- dois testes usam o mesmo dado (por exemplo, um usuário compartilhado que um deles altera);
- um teste depende de outro ter rodado antes;
- um valor que deveria ser único não é.

Traga o erro aqui. Investigar *flaky test* é um ótimo assunto de entrevista.

### 13.3 Conferir os testes de defeito

Com a API no ar (Terminal 1: `npm run api:start`), no Terminal 2:

```powershell
npm run cy:api:bugs
```

**Esperado:** rodam **só** os 2 testes `@bug-aberto` (CT-PRD-06 e CT-CAR-06 `[A, B, A]`), os 2 **falhando** com `expected 201 to equal 400`. Abra `cypress/reports/api-bugs/index.html` e confira.

**Por que conferir o motivo da falha?** Um teste de defeito que falha **por outro motivo** (por exemplo, um erro de digitação) parece certo mas não prova nada. O critério do plano é *"testes `@bug-aberto` falhando pelo motivo esperado"*.

### 13.4 Conferir o smoke

```powershell
npm run test:api:smoke
```

**Esperado:** só os testes marcados com `@smoke`: CT-LOG-01, os dois de autorização, CT-PRD-01, CT-CAR-01 e CT-USR-01. São poucos e rápidos.

### 13.5 Revisão final

Antes do commit, releia suas specs e confira:

- [ ] Todo `it` começa com o ID do cenário (CT-XXX-NN)
- [ ] Todo teste negativo tem `failOnStatusCode: false` **e** verifica o status
- [ ] Nenhum teste depende de outro ter rodado antes
- [ ] Nenhum teste usa dados pré-cadastrados (como `fulano@qa.com`)
- [ ] Os testes de defeito afirmam o comportamento **correto**
- [ ] Os nomes dos testes dizem **o que** é verificado, e não **como**

Peça: **"revise minhas specs da Parte 2"**. Eu leio tudo e aponto o que melhorar antes de você seguir.

### Commit

```powershell
git add cypress-tests
git commit -m "test(cypress): estabiliza suíte de API"
```

---

## Checklist da Parte 2

- [ ] 5 schemas escritos e usados nos testes
- [ ] Login: CT-LOG-01 a 04
- [ ] Autorização: as 6 linhas da tabela, mais CT-AUT-02 e 03
- [ ] Produtos: CT-PRD-01 a 08, com BUG-02 em `@bug-aberto`
- [ ] Carrinhos: CT-CAR-01 a 08, com BUG-01 em `@bug-aberto`
- [ ] Usuários: CT-USR-01 a 06
- [ ] `npm run test:api` passando 3 vezes seguidas após `npm ci`
- [ ] `cy:api:bugs` falhando só nos 2 defeitos, pelo motivo certo
- [ ] Smoke rodando só os testes marcados

**Para checar se aprendeu:**
1. Qual a diferença entre validar com schema e validar com `expect`?
2. Na tabela de casos da autorização, por que `header` é uma função?
3. Por que os testes de carrinho não compartilham usuário no `before`?
4. Por que o teste de um defeito aberto não usa `it.skip`?
5. No teste do BUG-02, por que a limpeza vem antes do `expect`?

Depois da Parte 2, pela ordem do plano, vêm o CI (Etapa 5 do plano) e o `bugs.md` (Etapa 6). A Parte 3 deste roteiro (E2E) pode vir antes ou depois deles: me diga qual prefere.

---

## Glossário rápido

| Termo | Significado |
| --- | --- |
| **API** | O "servidor" que recebe requisições e devolve dados em JSON, sem tela |
| **Requisição / resposta** | O pedido que você envia (método, URL, corpo) e o que volta (status, corpo) |
| **Status HTTP** | Número que resume o resultado: 200 ok, 201 criado, 400 dado inválido, 401 não autenticado, 403 sem permissão |
| **Token / JWT** | O "crachá" que o login devolve; vai no header `Authorization` das rotas protegidas |
| **Spec** | Um arquivo de teste do Cypress |
| **Asserção** | Uma verificação (`expect(...)`); se falha, o teste falha |
| **baseUrl** | Endereço base, para escrever só o caminho nas requisições |
| **Plugin** | Pacote que acrescenta funções ao Cypress (relatório, tags, Cucumber) |
| **Headless** | Rodar sem abrir janela, como no CI |
| **Smoke** | Poucos testes críticos e rápidos, que dizem "o básico funciona?" |
| **Regressão** | Rodar todos os testes para garantir que nada que funcionava quebrou |
| **Schema (JSON Schema)** | "Molde" que descreve a estrutura esperada de uma resposta; usado para testar contrato |
| **Teste dirigido por dados** | Uma lista de casos e um `forEach` que gera um teste por caso |
| **Valor limite** | Técnica de testar nas fronteiras de uma regra (limite, logo abaixo, logo acima) |
| **Tabela de decisão** | Técnica que combina condições e define o resultado de cada combinação |
| **Transição de estados** | Técnica que testa como o sistema muda de um estado para outro (ex.: sem carrinho → com carrinho) |
| **Flaky** | Teste instável, que às vezes passa e às vezes falha sem mudança no sistema |
