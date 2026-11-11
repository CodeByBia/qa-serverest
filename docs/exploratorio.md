# Achados da exploração

Registro dos testes exploratórios no ServeRest. Cada afirmação sobre o sistema usa uma marcação:

| Marcação | Significado |
| --- | --- |
| **[DOC]** | Requisito escrito na documentação oficial (Swagger ou README) |
| **[OBS]** | Comportamento observado executando a API |
| **[HIP]** | Hipótese ou lacuna: falta especificação e o comportamento esperado precisa ser esclarecido |


## Resumo

A exploração confirmou a maior parte das regras documentadas, encontrou **2 defeitos funcionais** (BUG-01 e BUG-02) e **3 divergências de documentação** (DOC-01, DOC-02 e DOC-03), e levantou **lacunas** que precisam de decisão de produto. Os defeitos e divergências estão detalhados em [bugs.md](bugs.md).

## Achados

| Tema | O que a documentação diz | O que foi observado | Classificação |
| --- | --- | --- | --- |
| E-mail duplicado | Não é permitido [DOC] | 400 "Este email já está sendo usado" | Conforme |
| Recurso inexistente | Swagger documenta 400 [DOC] | 400 "Usuário/Produto/Carrinho não encontrado" | Conforme (não é 404) |
| ID com formato inválido | Não documentado | `GET` exige 16 caracteres alfanuméricos (400); `DELETE` e `PUT` de usuários aceitam qualquer texto | [HIP] inconsistência de validação |
| PUT com ID inexistente | Cria novo registro [DOC] | 201 com um **novo** `_id`, diferente do informado | Conforme, mas o ID enviado é ignorado |
| Campos extras no corpo | Não documentado | 400 "<campo> não é permitido" | [OBS] |
| JSON malformado | Não documentado | 400 com orientação para usar aspas | [OBS] |
| Preço | Modelo do corpo: inteiro [DOC]. O limite ≥ 1 só está escrito no filtro de busca de `GET /produtos` [DOC parcial] | 0, negativo e decimal: 400; `"10"` (texto) é aceito e gravado como número | Conforme; a conversão é [HIP] |
| Quantidade de produto | Modelo do corpo: inteiro [DOC]. O limite ≥ 0 só está escrito no filtro de busca de `GET /produtos` [DOC parcial] | 0 aceito; -1 e 1,5 recusados | Conforme |
| Nome de produto só com espaços | Não documentado: o Swagger não marca nenhum campo como obrigatório | `""` é recusado com "nome não pode ficar em branco" [OBS]; `"    "` é aceito (201) e gravado como `""` | **Defeito BUG-02** (inconsistência da própria validação) |
| Nome de usuário só com espaços | Não documentado | 201 | Ocorrência do BUG-02 |
| Nome de produto com caixa diferente | Nome duplicado proibido [DOC] | "Mouse" e "mouse" coexistem; espaços nas pontas são ignorados | [HIP] precisa de definição |
| E-mail com caixa diferente | Não documentado | Cadastro aceito como outro usuário; o login diferencia maiúsculas | [HIP] precisa de definição |
| Senha só com espaço | Não documentado | Aceita | [HIP] sem política de senha |
| Carrinho com produto duplicado | Proibido [DOC] | Bloqueado só quando os itens repetidos estão **lado a lado** | **Defeito BUG-01** |
| Estoque insuficiente | Implícito na redução de estoque [DOC] | Recusado item a item, mas a soma de itens repetidos não é validada | Parte do BUG-01 |
| Preço alterado após o carrinho | Não documentado | O carrinho mantém o preço unitário da criação | [HIP] provavelmente intencional |
| Token após troca de senha ou exclusão | 401 para token inválido [DOC] | O token antigo deixa de valer (401) | Conforme |
| Token após virar administrador | Não documentado | O token antigo passa a ter permissão de admin | [OBS] a permissão é lida a cada requisição |
| Expiração do token | 600 s por padrão [DOC] | Com `--timeout 2`, 401 após 4 s | Conforme |
| Filtro `quantidadeTotal` de carrinhos | Inteiro ≥ 0 [DOC] | `quantidadeTotal=0` retorna 400 | **Divergência DOC-01** |
| Reinício da API local | "No local basta reiniciar" para limpar [DOC] | Os dados persistem (arquivos em `node_modules/serverest/src/data`) | **Divergência DOC-02** |
| Excluir produto que está em carrinho | A resposta de erro traz o campo `idCarrinho` (uma lista) [DOC: modelo da resposta] | A API devolve o campo com outro nome: `idCarrinhos` | **Divergência DOC-03** |
| Headers de segurança | Lista documentada no README [DOC] | Presentes; `X-Powered-By` ausente | Conforme |

## Lacunas para esclarecer

Registradas como **perguntas**, não como defeitos, porque não há regra escrita que diga o comportamento esperado:

1. E-mail e nome de produto deveriam ser únicos **sem diferenciar maiúsculas**?
2. Existe uma **política mínima de senha**?
3. **Textos numéricos** (como `"10"`) devem ser aceitos no preço??
1. O `DELETE` e o `PUT` de usuários deveriam validar o **formato do ID**, como o `GET`?

## Observações de segurança

Não registradas como defeito, porque são coerentes com uma API de estudo. Num produto real, seriam severidade **Crítica**:

- `GET /usuarios` retorna as **senhas em texto claro**, sem autenticação.
- As rotas de usuário **não exigem token**: qualquer pessoa pode excluir um usuário ou promovê-lo a administrador.