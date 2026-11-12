# Estratégia de testes

Estratégia de testes do ServeRest 3.2.2. Prioriza as regras de negócio da API, onde estão os riscos de maior impacto, e usará o E2E apenas para os fluxos críticos de interface.

## 1. Objetivo dos testes

Verificar se a API do ServeRest 3.2.2 cumpre as regras documentadas de autenticação, autorização, cadastro e estoque, e se o front permite login e gestão de produtos. Também registrar lacunas de especificação e defeitos de forma reproduzível.

## 2. Escopo

- **API:** `/login`, `/usuarios`, `/produtos`, `/carrinhos` (incluindo `concluir-compra` e `cancelar-compra`).
- **Aspectos:** status HTTP, mensagens, estrutura das respostas (schema), autenticação, autorização (admin × cliente), validação de entrada, regras de estoque e integridade entre recursos.
- **Front:** login (sucesso e falha) e cadastro e listagem de produtos pelo administrador.

## 3. Fora do escopo

| Item | Justificativa |
| --- | --- |
| Carrinho pelo front | Funcionalidade marcada como incompleta no README do front [DOC] |
| Upload de imagem de produto | Campo opcional, sem regra documentada |
| Teste de carga | O README proíbe no ambiente público; fora do foco |
| Segurança avançada (pentest) | Fora da competência proposta; as observações de segurança são apenas registradas |
| Compatibilidade entre navegadores no Cypress | Coberta de forma demonstrativa no Playwright |
| Paginação | Não existe na API [OBS] |

## 4. Riscos do sistema

| ID | Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- | --- |
| R1 | Venda acima do estoque ou estoque inconsistente | Alto | Alta (confirmado no BUG-01) | Cenários de estoque, duplicidade e cancelamento |
| R2 | Usuário sem permissão gerenciar produtos | Alto | Baixa | Tabela de decisão de autorização (sem token, token inválido, cliente, admin) |
| R3 | Token continuar válido após troca de senha ou exclusão | Alto | Baixa [OBS: invalida corretamente] | Testes de transição de estado do token |
| R4 | Dados inválidos aceitos e gravados | Médio | Média (confirmado no BUG-02) | Equivalência, valor limite e campos em branco |
| R5 | Exclusão quebrar a integridade (produto em carrinho, usuário com carrinho) | Médio | Baixa | Cenários de exclusão com dependência |
| R6 | Mudança no contrato da resposta | Médio | Baixa | Validação de JSON Schema |
| R7 | Ambiente público instável ou alterado por terceiros | Médio (para a suíte) | Média | E2E separado do PR, dados únicos, sem depender da massa pré-cadastrada |
| R8 | Exposição de dados sensíveis (senha em texto claro) | Alto num produto real | Confirmado [OBS] | Registrado como observação de segurança, sem expectativa de correção |

## 5. Funcionalidades críticas

1. **Login e autorização:** todas as operações de escrita de produtos e carrinhos dependem deles.
2. **Carrinho e estoque:** envolvem dinheiro e disponibilidade; um erro gera venda indevida.
3. **Cadastro de produtos (admin):** origem dos dados do catálogo.
4. **Cadastro de usuários:** porta de entrada, com regras simples.

## 6. Priorização

Critério: **risco = impacto × probabilidade**, com desempate pela frequência de uso. Ordem resultante: autorização → estoque e carrinho → validação de produtos → usuários → front.

Prioridades nos cenários: **P1** (bloqueia a entrega), **P2** (importante) e **P3** (desejável).

## 7. Critérios de entrada e saída

- **Entrada:** API local na versão 3.2.2 respondendo em `/usuarios`; documentação Swagger lida; cenários P1 revisados.
- **Saída:** 100% dos cenários P1 executados; nenhum P1 falhando sem defeito registrado; defeitos com evidência; pipeline verde no smoke; riscos residuais descritos.

## 8. Ambientes

| Ambiente | Usado por | Limitações |
| --- | --- | --- |
| API local 3.2.2 (`http://localhost:3000`) | Testes de API (Cypress, Playwright, Robot) e CI | Os dados persistem entre reinícios (DOC-02) |
| API pública (`https://serverest.dev`) | Preparação de dados dos testes E2E | Compartilhada; dados apagados diariamente; limite de 300 requisições a cada 30 s por IP |
| Front público (`https://front.serverest.dev`) | Testes E2E | Carrinho incompleto [DOC]; a URL da API é fixa no código do front |

**Regra:** testes de API usam só a API local; testes E2E usam só o front e a API públicos. O front público nunca enxerga dados criados na API local, porque a URL da API é fixa no código dele [OBS].

## 9. Estratégia de cobertura

A [matriz de rastreabilidade](matriz-de-rastreabilidade.md) liga cada regra [DOC] a seus cenários e ao arquivo de teste. Mede-se:

- regras documentadas cobertas por ao menos um cenário;
- cenários P1 automatizados;
- endpoints × métodos exercitados.

Não se usa cobertura de código, porque o sistema é de terceiros.

## 10. Limitações conhecidas

- Não há especificação de produto além do Swagger: várias expectativas são [HIP] (ver [achados](exploratorio.md)).
- O front público não aponta para a API local, então E2E e API usam dados diferentes.
- O token expirado exige subir a API com `--timeout` curto, por isso fica fora da suíte principal.
- Localmente, os dados se acumulam entre execuções (DOC-02); nenhum teste depende de banco vazio.

## 11. Estratégia de execução

| Quando | O quê | Onde |
| --- | --- | --- |
| Cada pull request | Smoke de API (6 testes P1) | CI, API local |
| Push na `main` | Regressão de API + defeitos conhecidos (não bloqueia) | CI, API local |
| Diariamente às 8h (Brasília) | Regressão de API | CI |
| Antes de cada nova rodada de cenários | Sessão exploratória de 30 a 45 min, com charter | Local |

## 12. Abordagem

- **Níveis:** API (integração do sistema, a maior parte) e E2E (sistema completo, poucos fluxos). Sem testes unitários: não temos o código como produto próprio.
- **Tipos:** funcional, negativo, contrato (schema), autorização, smoke, regressão e exploratório.
- **Técnicas:** particionamento de equivalência (tipos e formatos), valor limite (preço e quantidade), tabela de decisão (autorização) e transição de estados (token e carrinho).
- **Por quê:** o ServeRest tem validação de entrada rica e regras de estado claras, onde essas técnicas encontram defeitos com poucos casos. As duas técnicas encontraram os dois defeitos: valor limite e equivalência levaram ao BUG-01 e ao BUG-02.

## 13. Estratégia de automação

Automatizar o que é **repetitivo, estável e de alto risco**: regras de negócio da API, autorização, schemas e fluxos críticos de tela.

Manter manual o que é **exploratório, pontual ou caro de automatizar**: investigação de defeitos novos, usabilidade e mensagens do front, e o token expirado.

Critério de decisão: frequência de execução, risco, estabilidade do comportamento e custo de manutenção.

**Defeitos conhecidos** recebem a tag `@bug-aberto`: o teste afirma o comportamento correto, sai da regressão bloqueante e roda num passo separado que não bloqueia o pipeline.

**Situação atual:** 55 testes de API automatizados com Cypress (53 na regressão e 2 defeitos conhecidos) e 4 com Robot Framework, que repetem cenários do Cypress para comparar as ferramentas no mesmo caso. 15 dos 18 cenários P1 estão automatizados; os 3 restantes são de E2E, em andamento.


## 14. Critérios de qualidade e riscos residuais

Recomendar a entrega quando: nenhum P1 aberto, P2 abertos com contorno conhecido e smoke estável em 3 execuções seguidas.

**Recomendação atual: não recomendar**, por causa do BUG-01 (estoque), de severidade alta.

**Riscos residuais aceitos:** exposição de senha e rotas de usuários sem autenticação. São decisões de projeto de uma API de estudo, mas seriam bloqueantes num produto real.