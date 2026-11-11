# Matriz de rastreabilidade

Liga cada regra documentada [DOC] ao lugar onde ela está escrita, aos cenários que a verificam e ao arquivo de teste. Fontes: Swagger do ServeRest 3.2.2 (abra `npm run api:doc` e acesse http://localhost:3000) e README do front.

## Regras documentadas

| ID | Regra [DOC] | Onde está | Cenários | Arquivo de teste | Situação |
| --- | --- | --- | --- | --- | --- |
| RN-01 | Login com credenciais válidas retorna um token | Swagger › `POST /login` › resposta 200 | CT-LOG-01 | `cypress-tests/cypress/e2e/api/login.cy.js` | ✅ |
| RN-02 | Credenciais inválidas retornam 401 | Swagger › `POST /login` › resposta 401 | CT-LOG-02, CT-LOG-03 | `login.cy.js` | ✅ |
| RN-03 | Cadastrar produto exige token válido | Swagger › `POST /produtos` › cadeado e resposta 401 | CT-AUT-01 | `autorizacao.cy.js` | ✅ |
| RN-04 | Cadastrar produto é exclusivo de administradores (403) | Swagger › `POST /produtos` › resposta 403 | CT-AUT-01 | `autorizacao.cy.js` | ✅ |
| RN-05 | Token de usuário que não existe mais é inválido | Swagger › `POST /produtos` › resposta 401 (exemplo da mensagem) | CT-AUT-01, CT-AUT-03 | `autorizacao.cy.js` | ✅ |
| RN-06 | Token expira (600 s por padrão) | Swagger › `POST /login` › descrição | CT-AUT-04 | — (manual) | 🖐 |
| RN-07 | E-mail de usuário é único | Swagger › `POST /usuarios` › descrição | CT-USR-02 | `usuarios.cy.js` | ✅ |
| RN-08 | Não é permitido excluir usuário com carrinho | Swagger › `DELETE /usuarios/{_id}` › descrição | CT-USR-04 | `usuarios.cy.js` | ✅ |
| RN-09 | Excluir registro inexistente informa "Nenhum registro excluído" | Swagger › `DELETE /usuarios/{_id}` › resposta 200 | CT-USR-05 | `usuarios.cy.js` | ✅ |
| RN-10 | PUT em ID inexistente cria um registro | Swagger › `PUT /usuarios/{_id}` › descrição | CT-USR-06 | `usuarios.cy.js` | ✅ |
| RN-11 | Nome de produto é único | Swagger › `POST /produtos` e `PUT /produtos/{_id}` › descrição | CT-PRD-02, CT-PRD-08 | `produtos.cy.js` | ✅ |
| RN-12 | Preço é inteiro (modelo do corpo); ≥ 1 está descrito no filtro de busca | Swagger › modelo do corpo de `POST /produtos` e filtro `preco` de `GET /produtos` | CT-PRD-03 | `produtos.cy.js` | ✅ |
| RN-13 | Quantidade é inteira (modelo do corpo); ≥ 0 está descrito no filtro de busca | Swagger › modelo do corpo de `POST /produtos` e filtro `quantidade` de `GET /produtos` | CT-PRD-04 | `produtos.cy.js` | ✅ |
| RN-14 | Não é permitido excluir produto que está em carrinho | Swagger › `DELETE /produtos/{_id}` › descrição | CT-PRD-07 | `produtos.cy.js` | ✅ |
| RN-15 | Cada usuário pode ter só 1 carrinho | Swagger › `POST /carrinhos` › descrição | CT-CAR-02 | `carrinhos.cy.js` | ✅ |
| RN-16 | Não é permitido produto duplicado no carrinho | Swagger › `POST /carrinhos` › resposta 400 (exemplo da mensagem) | CT-CAR-06 | `carrinhos.cy.js` | ✅ / 🐞 BUG-01 |
| RN-17 | Criar carrinho reduz o estoque | Swagger › `POST /carrinhos` › descrição | CT-CAR-01 | `carrinhos.cy.js` | ✅ |
| RN-18 | Cancelar a compra devolve o estoque | Swagger › `DELETE /carrinhos/cancelar-compra` › descrição | CT-CAR-03 | `carrinhos.cy.js` | ✅ |
| RN-19 | Concluir a compra mantém a baixa no estoque | Swagger › `DELETE /carrinhos/concluir-compra` › descrição (por contraste com o cancelar) | CT-CAR-04 | `carrinhos.cy.js` | ✅ |
| RN-20 | Concluir ou cancelar sem carrinho informa que não há carrinho | Swagger › `concluir-compra` e `cancelar-compra` › resposta 200 | CT-CAR-07 | `carrinhos.cy.js` | ✅ |
| RN-21 | Login de administrador no front leva à home de administrador | README do front (a confirmar na Parte 5) | CT-LOG-05 | — (Parte 5) | ⏳ |

## Cenários baseados em comportamento observado [OBS]

Não vêm de uma regra escrita, mas de comportamento observado na exploração e aceito como referência:

| Cenário | Comportamento | Arquivo de teste |
| --- | --- | --- |
| CT-LOG-04, CT-USR-03, CT-PRD-05, CT-CAR-08 | Campos obrigatórios e mensagens de validação por campo (o Swagger não marca nenhum campo como obrigatório) | `login.cy.js`, `usuarios.cy.js`, `produtos.cy.js`, `carrinhos.cy.js` |
| CT-AUT-02 | Token invalidado após troca de senha | `autorizacao.cy.js` |
| CT-CAR-05 | Recusa de quantidade acima do estoque | `carrinhos.cy.js` |
| CT-PRD-06 | Nome em branco é recusado; o mesmo deveria valer para nome só com espaços (🐞 BUG-02) | `produtos.cy.js` |

## Cobertura

| Medida | Resultado |
| --- | --- |
| Regras [DOC] com pelo menos um cenário | 21 de 21 (100%) |
| Regras [DOC] verificadas por teste automatizado | 19 de 21 (RN-06 é manual; RN-21 é E2E, planejado) |
| Cenários P1 automatizados | 15 de 18 (os 3 restantes são E2E) |
| Regras com defeito aberto | 1 [DOC] (RN-16, BUG-01) e 1 comportamento observado (CT-PRD-06, BUG-02) |

## Endpoints × métodos exercitados

| Endpoint | GET | POST | PUT | DELETE |
| --- | --- | --- | --- | --- |
| `/login` | — | ✅ | — | — |
| `/usuarios` | ✅ | ✅ | ✅ | ✅ |
| `/produtos` | ✅ | ✅ | ✅ | ✅ |
| `/carrinhos` | ✅ | ✅ | — | — |
| `/carrinhos/concluir-compra` | — | — | — | ✅ |
| `/carrinhos/cancelar-compra` | — | — | — | ✅ |

O "—" indica que o método não existe para o endpoint.