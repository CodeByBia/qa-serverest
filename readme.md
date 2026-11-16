# QA ServeRest

[![Cypress](https://github.com/CodeByBia/qa-serverest/actions/workflows/cypress.yml/badge.svg)](https://github.com/CodeByBia/qa-serverest/actions/workflows/cypress.yml)

Portfólio de QA: estratégia, cenários e automação de testes da API do ServeRest, com CI no GitHub Actions.

## Destaques

- **Estratégia baseada em risco** e **36 cenários** desenhados com técnicas de teste (valor limite, particionamento de equivalência, tabela de decisão e transição de estados).
- **56 testes de API em Cypress**, com validação de contrato (JSON Schema), e **9 em Robot Framework**.
- **2 defeitos reais** encontrados e documentados; um deles permite vender mais do que o estoque.
- **CI no GitHub Actions:** lint e smoke de API em cada pull request, com a `main` protegida, e regressão diária.

## Sistema sob teste

[ServeRest](https://github.com/ServeRest/ServeRest) **3.2.2**: uma API REST de e-commerce feita para estudo de testes (login, usuários, produtos e carrinhos). A versão é fixa no `package.json`.

## Arquitetura dos testes

Os testes rodam contra a **API local**, que sobe na própria máquina ou dentro do job de CI:

- **versão fixa** (3.2.2), igual na máquina e no CI;
- **dados isolados**: cada teste cria os próprios dados, com valores únicos;
- **sem depender de internet** nem do ambiente público, que é compartilhado e tem limite de requisições.

Assim, quando um teste falha, o problema está no sistema ou no teste, e não no ambiente.

## Tecnologias

| Ferramenta | Papel no projeto |
| --- | --- |
| [Cypress](https://www.cypress.io/) 16 | Suíte principal de testes de API |
| [Robot Framework](https://robotframework.org/) 7 + RequestsLibrary | Suíte complementar, para comparar as ferramentas e cobrir os headers de segurança |
| AJV | Validação de contrato com JSON Schema |
| `@cypress/grep` | Seleção de testes por tag (`@smoke`, `@bug-aberto`) |
| Mochawesome | Relatório HTML dos testes Cypress |
| ESLint + `eslint-plugin-cypress` | Lint do código de teste |
| GitHub Actions | Pipeline de CI |

## Estrutura

```
qa-serverest/
├── cypress-tests/          # Suíte principal (Cypress)
│   ├── cypress/e2e/api/    # Testes de API, um arquivo por recurso
│   ├── cypress/fixtures/   # JSON Schemas das respostas
│   └── cypress/support/    # Comandos customizados e gerador de dados
├── robot-tests/            # Suíte complementar (Robot Framework)
│   ├── resources/          # Keywords reutilizáveis
│   └── tests/              # Casos de teste
├── docs/                   # Estratégia, cenários, matriz, achados e defeitos
└── .github/workflows/      # Pipeline do Cypress
```

## Como executar

**Pré-requisitos:** Node.js 22 (versão no `.nvmrc`) e Python 3.11 ou mais novo.

### Cypress

```bash
cd cypress-tests
npm ci
```

| Comando | O que faz |
| --- | --- |
| `npm run test:api` | Sobe a API, roda a regressão e desliga a API |
| `npm run test:api:smoke` | O mesmo, só com os 6 testes de smoke |
| `npm run test:api:bugs` | O mesmo, só com os testes dos defeitos conhecidos (eles falham de propósito) |
| `npm run lint` | Verifica o código dos testes |

Para rodar vários comandos com a mesma API, suba a API num terminal (`npm run api:start`) e use os scripts `cy:` em outro (`npm run cy:api`, `npm run cy:api:smoke`, `npm run cy:api:bugs`). Para abrir a documentação Swagger da API: `npm run api:doc` e acesse http://localhost:3000.

### Robot Framework

Com a API no ar (`npm run api:start` em `cypress-tests`):

```bash
cd robot-tests
python -m venv .venv
.venv\Scripts\Activate.ps1   # Windows (PowerShell); no Linux ou macOS: source .venv/bin/activate
pip install -r requirements.txt
robot --outputdir results tests/
```

Só o smoke: `robot --include smoke --outputdir results tests/`.

## Relatórios

| Suíte | Onde |
| --- | --- |
| Cypress: regressão e smoke | `cypress-tests/cypress/reports/api/index.html` |
| Cypress: defeitos conhecidos | `cypress-tests/cypress/reports/api-bugs/index.html` |
| Robot | `robot-tests/results/log.html` |

No CI, os mesmos relatórios ficam disponíveis como **artifacts** de cada execução, na aba Actions.

## CI/CD

| Evento | O que roda | Bloqueia? |
| --- | --- | --- |
| Pull request | Lint dos testes e smoke de API (6 testes) | **Sim**: a `main` exige os dois verdes |
| Push na `main` | Regressão de API e defeitos conhecidos | A regressão sim; os defeitos conhecidos não |
| Todo dia às 8h (Brasília) | Regressão de API e defeitos conhecidos | Avisa se falhar |
| Manual | Regressão de API e defeitos conhecidos | — |

**Defeitos conhecidos** têm a tag `@bug-aberto`: o teste afirma o comportamento correto, fica fora da regressão e roda num passo separado, que não bloqueia o pipeline. Assim é possível acompanhar se o defeito continua igual ou foi corrigido.

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [Estratégia de testes](docs/estrategia-de-testes.md) | Escopo, riscos, priorização, abordagem e critérios de qualidade |
| [Achados da exploração](docs/exploratorio.md) | O que foi observado no sistema, separando requisito, observação e hipótese |
| [Cenários de teste](docs/cenarios-de-teste.md) | Os 36 cenários, com técnica, prioridade e situação de automação |
| [Matriz de rastreabilidade](docs/matriz-de-rastreabilidade.md) | Regra de negócio → cenário → arquivo de teste |
| [Defeitos](docs/bugs.md) | 2 defeitos reais e 3 divergências de documentação, com evidências |

## Defeitos encontrados

| ID | Defeito | Severidade |
| --- | --- | --- |
| BUG-01 | O carrinho aceita o mesmo produto em posições separadas e não valida o estoque somado: é possível pedir mais do que existe | Alta |
| BUG-02 | Produto com nome só de espaços é aceito e gravado com nome vazio | Média |

## Cypress × Robot Framework

| | Cypress | Robot Framework |
| --- | --- | --- |
| Papel | Suíte principal: 56 testes | Complementar: 9 testes |
| Estilo | Código JavaScript | Keywords com nomes de negócio |
| Dados por caso | Lista + `forEach` | `Test Template` |
| Preparação e limpeza | `before` e comandos customizados | `Suite Setup` e `Test Teardown` |
| Relatório | Mochawesome (plugin) | `log.html` nativo |

## Limitações e próximos passos

- **Testes de interface (E2E):** os cenários estão desenhados, mas ficaram fora desta versão; o foco foi a API, onde estão os maiores riscos.
- **Robot fora do CI:** a suíte Robot é complementar e roda localmente.
- **Token expirado (CT-AUT-04):** verificado manualmente, porque exige subir a API com um timeout curto.
- **Dados locais persistem** entre execuções (divergência DOC-02); nenhum teste depende de banco vazio.
- **Triagem automática das falhas do pipeline:** classificar cada falha como defeito, ambiente, teste quebrado ou mudança de contrato, por regras e, nos casos ambíguos, com IA.