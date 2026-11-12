# Cenários de teste

35 cenários, escolhidos por técnica e risco Cada resultado esperado vem de uma regra [DOC] ou de um comportamento [OBS] aceito como referência. Os que dependem de decisão de produto estão marcados [HIP] e não são automatizados como "passou/falhou" até a definição.

**Coluna Tipo:** técnica · nível · ferramenta (Cy = Cypress, Rb = Robot, Pw = Playwright, Man = manual).

**Coluna Situação:** ✅ automatizado · ⏳ planejado · 🖐 manual · 🐞 automatizado, falha por defeito conhecido.

## 1. Login

| ID | Objetivo | Dados | Resultado esperado | Prior. | Tipo | Situação |
| --- | --- | --- | --- | --- | --- | --- |
| CT-LOG-01 | Login válido retorna token | E-mail e senha corretos | 200, "Login realizado com sucesso", `authorization` no formato `Bearer <jwt>` (schema) [DOC] | P1 | Positivo · API · Cy, Pw | ✅ |
| CT-LOG-02 | Senha incorreta | Senha errada | 401 "Email e/ou senha inválidos" [DOC] | P1 | Negativo · API · Cy | ✅ |
| CT-LOG-03 | E-mail não cadastrado | E-mail inexistente | 401, mesma mensagem do CT-LOG-02 (não revela qual campo errou) [OBS] | P2 | Negativo · API · Cy | ✅ |
| CT-LOG-04 | Campos ausentes, vazios e formato errado | `{}`, `""`, e-mail sem @ | 400 com mensagem por campo [OBS] | P2 | Equivalência · API · Cy | ✅ |
| CT-LOG-05 | Login pelo front com admin | Admin criado na API **pública** | Redireciona para a home de administrador [DOC: README do front] | P1 | Positivo · E2E · Cy, Pw | ⏳ |
| CT-LOG-06 | Login inválido pelo front | Senha errada | Alerta "Email e/ou senha inválidos" visível | P1 | Negativo · E2E · Cy, Pw | ⏳ |

## 2. Autorização e token

Tabela de decisão para `POST /produtos`:

| Header Authorization | Usuário existe? | Admin? | Resultado esperado |
| --- | --- | --- | --- |
| Ausente | — | — | 401 |
| Sem prefixo `Bearer` | — | — | 401 [OBS] |
| `Bearer` + token malformado | — | — | 401 |
| `Bearer` + token válido | Não (excluído) | — | 401 [DOC] |
| `Bearer` + token válido | Sim | Não | 403 "Rota exclusiva para administradores" [DOC] |
| `Bearer` + token válido | Sim | Sim | 201 |

| ID | Objetivo | Dados | Resultado esperado | Prior. | Tipo | Situação |
| --- | --- | --- | --- | --- | --- | --- |
| CT-AUT-01 | Cobrir as 6 regras da tabela acima | Um header por linha | Status da tabela | P1 | Tabela de decisão · API · Cy (Rb: 2 linhas) | ✅ |
| CT-AUT-02 | Token invalidado após troca de senha | Nova senha | 401 ao usar o token antigo [OBS] | P1 | Estados · API · Cy | ✅ |
| CT-AUT-03 | Token invalidado após exclusão do usuário | — | 401 ao usar o token [OBS] | P2 | Estados · API · Cy | ✅ |
| CT-AUT-04 | Token expirado | API com `--timeout 5`; esperar 6 s | 401 [DOC] | P2 | Estados · API · Man | 🖐 |

## 3. Usuários

| ID | Objetivo | Dados | Resultado esperado | Prior. | Tipo | Situação |
| --- | --- | --- | --- | --- | --- | --- |
| CT-USR-01 | Cadastro válido | E-mail único | 201 + `_id` com 16 caracteres; GET devolve os mesmos dados (schema) | P1 | Positivo · API · Cy | ✅ |
| CT-USR-02 | E-mail duplicado | Mesmo e-mail | 400 "Este email já está sendo usado" [DOC] | P1 | Negativo · API · Cy | ✅ |
| CT-USR-03 | Ausente, nulo, vazio, tipo errado, campo extra | `{}`, `nome: null`, `""`, `password: 123`, `administrador: true`, `extra` | 400 com a mensagem do campo [OBS] | P2 | Equivalência · API · Cy | ✅ |
| CT-USR-04 | Excluir usuário com carrinho | Usuário com carrinho | 400 "Não é permitido excluir usuário com carrinho cadastrado" + `idCarrinho` [DOC] | P2 | Integridade · API · Cy | ✅ |
| CT-USR-05 | Excluir ID inexistente | ID válido não cadastrado | 200 "Nenhum registro excluído" [DOC] | P3 | Negativo · API · Cy | ✅ |
| CT-USR-06 | PUT com ID inexistente cria registro | ID de 16 caracteres inexistente | 201 com novo `_id` [DOC]; o ID enviado é ignorado [OBS] | P3 | Positivo · API · Cy | ✅ |
| CT-USR-07 | E-mail com caixa diferente | `A@QA.COM` com `a@qa.com` existente | [HIP] Hoje cadastra (201). Aguarda definição | P3 | Exploratório · API · Man | 🖐 |

## 4. Produtos

| ID | Objetivo | Dados | Resultado esperado | Prior. | Tipo | Situação |
| --- | --- | --- | --- | --- | --- | --- |
| CT-PRD-01 | Cadastro válido e consulta | Nome único | 201; GET devolve os dados gravados (schema) | P1 | Positivo · API · Cy, Rb, Pw | ✅ |
| CT-PRD-02 | Nome duplicado, inclusive com espaços nas pontas | Mesmo nome; `"  Nome  "` | 400 "Já existe produto com esse nome" [DOC] | P1 | Negativo · API · Cy | ✅ |
| CT-PRD-03 | Limites de preço | -1, 0, 1, 2, 10.5, 9007199254740992 | -1, 0, 10.5 e o último: 400; 1 e 2: 201 [DOC + OBS] | P1 | Valor limite · API · Cy (Rb: 0) | ✅ |
| CT-PRD-04 | Limites de quantidade | -1, 0, 1, 1.5 | -1 e 1.5: 400; 0 e 1: 201 [DOC] | P2 | Valor limite · API · Cy | ✅ |
| CT-PRD-05 | Campos ausentes, vazios e tipo errado | `{}`, `descricao: ""`, `preco: "dez"` | 400 por campo [OBS] | P2 | Equivalência · API · Cy | ✅ |
| CT-PRD-06 | Nome só com espaços | `"    "` | 400 "nome não pode ficar em branco". **Hoje falha: BUG-02** | P2 | Negativo · API · Cy | 🐞 |
| CT-PRD-07 | Excluir produto que está em carrinho | Produto em carrinho | 400 "Não é permitido excluir produto que faz parte de carrinho" [DOC] | P2 | Integridade · API · Cy | ✅ |
| CT-PRD-08 | Editar para nome já usado por outro produto | 2 produtos | 400 "Já existe produto com esse nome" [DOC] | P2 | Negativo · API · Cy | ✅ |
| CT-PRD-09 | Cadastrar produto pelo front | Admin criado na API pública, logado | Redireciona para a lista e o produto aparece | P1 | Positivo · E2E · Cy, Pw | ⏳ |
| CT-PRD-10 | Validação visível no front | Formulário vazio | Mensagens de campo obrigatório exibidas [HIP: textos a confirmar] | P2 | Negativo · E2E · Cy | ⏳ |

## 5. Carrinhos e estoque

Estados do carrinho por usuário: **sem carrinho → com carrinho → (concluir: sem carrinho, estoque mantém a baixa) ou (cancelar: sem carrinho, estoque devolvido)** [DOC].

| ID | Objetivo | Dados | Resultado esperado | Prior. | Tipo | Situação |
| --- | --- | --- | --- | --- | --- | --- |
| CT-CAR-01 | Criar carrinho baixa o estoque | Estoque 3, quantidade 2 | 201; estoque 1; `precoTotal` = preço × 2 [DOC] | P1 | Estados · API · Cy | ✅ |
| CT-CAR-02 | Segundo carrinho do mesmo usuário | — | 400 "Não é permitido ter mais de 1 carrinho" [DOC] | P1 | Estados · API · Cy | ✅ |
| CT-CAR-03 | Cancelar compra devolve o estoque | — | 200; estoque volta ao original [DOC] | P1 | Estados · API · Cy | ✅ |
| CT-CAR-04 | Concluir compra mantém a baixa | — | 200; estoque continua reduzido [DOC] | P1 | Estados · API · Cy | ✅ |
| CT-CAR-05 | Quantidade acima do estoque | Estoque 3, quantidade 4 | 400 "Produto não possui quantidade suficiente"; estoque inalterado [OBS] | P1 | Valor limite · API · Cy | ✅ |
| CT-CAR-06 | Produto duplicado, em qualquer posição | [A, A] e [A, B, A] | 400 "Não é permitido possuir produto duplicado" nos dois [DOC]. **[A, B, A] hoje falha: BUG-01** | P1 | Equivalência · API · Cy | ✅ [A, A] · 🐞 [A, B, A] |
| CT-CAR-07 | Concluir ou cancelar sem carrinho | Usuário sem carrinho | 200 "Não foi encontrado carrinho para esse usuário" [DOC] | P3 | Estados · API · Cy | ✅ |
| CT-CAR-08 | Lista vazia, quantidade 0 ou produto inexistente | `[]`, `quantidade: 0`, ID inexistente | 400 com mensagem específica [OBS] | P2 | Equivalência · API · Cy | ✅ |

## Resumo
| Situação | Cenários |
| --- | --- |
| ✅ Automatizado | 28 (um deles, o CT-CAR-06, também tem a variação [A, B, A] em 🐞) |
| 🐞 Automatizado, falha por defeito conhecido | 1 (CT-PRD-06) |
| ⏳ Planejado (E2E) | 4 |
| 🖐 Manual | 2 (CT-AUT-04 e CT-USR-07) |
| **Total** | **35** |
| **Casos de teste automatizados** | **59**: 55 no Cypress (53 na regressão + 2 defeitos conhecidos) e 4 no Robot |


| Arquivo | Cenários | Casos de teste |
| --- | --- | --- |
| `cypress-tests/cypress/e2e/api/login.cy.js` | CT-LOG-01 a 04 | 6 |
| `cypress-tests/cypress/e2e/api/autorizacao.cy.js` | CT-AUT-01 a 03 | 8 |
| `cypress-tests/cypress/e2e/api/produtos.cy.js` | CT-PRD-01 a 08 | 19 (1 é defeito conhecido) |
| `cypress-tests/cypress/e2e/api/carrinhos.cy.js` | CT-CAR-01 a 08 | 11 (1 é defeito conhecido) |
| `cypress-tests/cypress/e2e/api/usuarios.cy.js` | CT-USR-01 a 06 | 11 |
| `robot-tests/tests/produtos.robot` | CT-PRD-01, CT-AUT-01 (2 linhas), CT-PRD-03 | 4 (repetem o Cypress de propósito) |
| **Total** | **29 cenários** | **59** |

O Robot repete 4 cenários do Cypress (CT-PRD-01, duas linhas do CT-AUT-01 e o preço zero do CT-PRD-03)