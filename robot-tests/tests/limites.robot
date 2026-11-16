*** Settings ***
Documentation     CT-PRD-03: análise de valor limite do preço (regra: inteiro maior ou igual a 1).
...               Estilo dirigido por dados do Robot: uma keyword-modelo e uma linha por caso.
Resource          ../resources/serverest.resource
Suite Setup       Criar sessao na API
Test Teardown     Excluir dados criados
Test Template     Cadastrar produto com preco deve retornar status
Test Tags         limites    regressao

*** Test Cases ***                          PRECO        STATUS
CT-PRD-03 Preco -1 e recusado               ${-1}        400
CT-PRD-03 Preco 0 e recusado                ${0}         400
CT-PRD-03 Preco 1 e aceito                  ${1}         201
CT-PRD-03 Preco 2 e aceito                  ${2}         201
CT-PRD-03 Preco decimal e recusado          ${10.5}      400

*** Keywords ***
Cadastrar produto com preco deve retornar status
    [Arguments]    ${preco}    ${status}
    Dado que existe um administrador autenticado
    Quando cadastro um produto    preco=${preco}
    Entao o status deve ser    ${status}