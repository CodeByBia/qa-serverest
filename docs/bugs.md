# Defeitos

Defeitos e divergências encontrados no ServeRest 3.2.2. Os testes que os reproduzem têm a tag `@bug-aberto`: afirmam o comportamento correto, ficam fora da regressão bloqueante e rodam num passo separado do CI.

## Severidade × prioridade

- **Severidade** é técnica: o tamanho do estrago que o defeito causa. Quem avalia é QA.
- **Prioridade** é de negócio: a urgência da correção. Quem decide é o PO, com o time.

Escalas: severidade **Crítica, Alta, Média, Baixa**; prioridade **P1, P2, P3**. Status: **Novo → Confirmado → Em correção → Pronto para reteste → Fechado** (ou Rejeitado).

## Resumo

| ID | Título | Severidade / Prioridade | Status | Teste |
| --- | --- | --- | --- | --- |
| BUG-01 | Carrinho aceita produto duplicado separado e não valida o estoque somado | Alta / P1 | Confirmado | CT-CAR-06 `[A, B, A]` |
| BUG-02 | Produto com nome só de espaços é aceito e gravado com nome vazio | Média / P2 | Confirmado | CT-PRD-06 |
| DOC-01 | Swagger diz que `quantidadeTotal` aceita 0, mas a API recusa | Baixa / P3 | Confirmado | — (exploração) |
| DOC-02 | README diz que reiniciar a API local limpa os dados, mas eles persistem | Baixa / P3 | Confirmado | — (exploração) |
| DOC-03 | Swagger documenta o campo `idCarrinho`, mas a API devolve `idCarrinhos` | Baixa / P3 | Confirmado | CT-PRD-07 (usa o nome real, `idCarrinhos`) |

---

## BUG-01 — Carrinho aceita produto duplicado quando os itens não estão lado a lado e não valida o estoque somado

| Campo | Valor |
| --- | --- |
| Ambiente e versão | ServeRest 3.2.2 via npm local · Node 22 · Windows 11 e Ubuntu 24.04 (CI) |
| Severidade / Prioridade | Alta / P1 (sugerida) |
| Frequência | Sempre (reproduzido em todas as execuções, local e no CI) |
| Status | Confirmado |
| Cenários e regras | CT-CAR-06, CT-CAR-05 · RN-16 |
| Teste automatizado | `cypress-tests/cypress/e2e/api/carrinhos.cy.js` → "CT-CAR-06 recusa produto duplicado em posições separadas [A, B, A] (BUG-01)" |

**Pré-condições:** administrador logado; produto A com estoque 3 e preço 10; produto B com estoque 10 e preço 100; cliente sem carrinho.

**Passos para reprodução:**
1. `POST /carrinhos` com `produtos: [{A, 2}, {B, 1}, {A, 2}]`.
2. `GET /produtos/{A}`.

**Resultado esperado:** 400 "Não é permitido possuir produto duplicado", como já ocorre quando os itens repetidos estão lado a lado: com `[{A, 1}, {A, 1}]` a API retorna esse 400 [DOC: duplicidade proibida no Swagger].

**Resultado obtido:** 201. O carrinho registra 4 unidades de A, mas o estoque de A só cai de 3 para 1. A quantidade pedida (4) excede o estoque (3).

**Evidências:**
- Saída do teste: `AssertionError: expected 201 to equal 400`
- Relatório: ![BUG-01](reports/api-bugs/screenshots)
- Execução no CI: <https://github.com/CodeByBia/qa-serverest/actions>

**Causa provável [HIP]:** a detecção de duplicados parece comparar só itens vizinhos, e a baixa de estoque é calculada para cada item repetido a partir do mesmo valor original.

**Impacto para o negócio:** pedido maior que o estoque e divergência entre carrinho e estoque, ou seja, risco de vender o que não existe.

---

## BUG-02 — Produto com nome só de espaços é aceito e gravado com nome vazio

| Campo | Valor |
| --- | --- |
| Ambiente e versão | ServeRest 3.2.2 via npm local · Node 22 · Windows 11 e Ubuntu 24.04 (CI) |
| Severidade / Prioridade | Média / P2 (sugerida) |
| Frequência | Sempre |
| Status | Confirmado |
| Cenários e regras | CT-PRD-06 · comportamento observado (o Swagger não marca o nome como obrigatório) |
| Teste automatizado | `cypress-tests/cypress/e2e/api/produtos.cy.js` → "CT-PRD-06 recusa nome só com espaços (BUG-02)" |

**Pré-condições:** administrador logado.

**Passos para reprodução:**
1. `POST /produtos` com `nome: "    "` (só espaços) e os demais campos válidos.
2. `GET /produtos/{id}` com o `_id` devolvido.

**Resultado esperado:** 400 "nome não pode ficar em branco", a mesma resposta dada para `nome: ""` [OBS]. A própria API já trata o nome em branco como inválido; um nome só de espaços também está em branco. O Swagger não marca o nome como obrigatório, então o esperado vem da regra que a própria API aplica, e não da documentação.

**Resultado obtido:** 201; o GET mostra `"nome": ""`. Um segundo cadastro só de espaços recebe "Já existe produto com esse nome", confirmando que o nome vazio ficou gravado.

**Evidências:**
- Saída do teste: `AssertionError: expected 201 to equal 400`
- Relatório: ![BUG-02](reports/api-bugs/screenshots)
- Execução no CI: <link da execução>

**Outras ocorrências:** o mesmo acontece com a `descricao` do produto e com o `nome` de usuário só de espaços [OBS].

**Impacto para o negócio:** produto sem nome no catálogo.

---

## DOC-01 — Swagger diz que `quantidadeTotal` aceita 0, mas a API recusa

**Severidade / Prioridade:** Baixa / P3 · **Status:** Confirmado

`GET /carrinhos?quantidadeTotal=0` retorna 400 "quantidadeTotal deve ser um número positivo", enquanto o Swagger descreve o filtro como inteiro maior ou igual a 0.

**Esperado:** documentação e implementação iguais (decidir qual das duas corrigir).

---

## DOC-02 — README diz que reiniciar a API local limpa os dados, mas eles persistem

**Severidade / Prioridade:** Baixa / P3 · **Status:** Confirmado

Ao reiniciar o `serverest` instalado via npm, os usuários criados continuam lá. Os dados ficam em arquivos dentro de `node_modules/serverest/src/data`.

**Impacto para quem testa:** execuções locais não começam do zero.

**Mitigação adotada:** os testes criam os próprios dados com valores únicos e não dependem de banco vazio. Para zerar os dados, `npm ci`. No CI, cada execução começa do zero.

---

## DOC-03 — Swagger documenta o campo `idCarrinho`, mas a API devolve `idCarrinhos`

**Severidade / Prioridade:** Baixa / P3 · **Status:** Confirmado

Ao tentar excluir um produto que está num carrinho (`DELETE /produtos/{id}`), a API responde 400 com a lista de carrinhos que usam o produto. O modelo da resposta no Swagger chama esse campo de `idCarrinho`; a API devolve `idCarrinhos`.

**Impacto:** quem integrar com a API seguindo o Swagger vai procurar um campo que não existe.

**Esperado:** documentação e implementação com o mesmo nome de campo.

---

## Exemplo fictício (apenas ilustrativo)

> **EXEMPLO — não é um defeito real do ServeRest.**
>
> **BUG-EX — Botão Cadastrar continua habilitado após o envio e gera produto duplicado com clique duplo.** Ambiente fictício v0.0.0. Severidade Média / P2. Frequência 3/5. Passos: abrir Cadastrar Produtos, preencher, clicar duas vezes rapidamente. Esperado: um único cadastro. Obtido: dois pedidos enviados. Evidência: vídeo e aba Network. Impacto: catálogo com itens duplicados.