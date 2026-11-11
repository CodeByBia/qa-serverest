*** Settings ***
Documentation     Cadastro de produtos: autenticação, autorização e validação de preço.
...               Repete cenários do Cypress de propósito, para comparar as ferramentas no mesmo caso.
Resource          ../resources/serverest.resource
Suite Setup       Criar sessao na API
Test Teardown     Excluir dados criados

*** Test Cases ***
CT-PRD-01 Administrador cadastra produto valido
    [Tags]    smoke    produtos
    Dado que existe um administrador autenticado
    Quando cadastro um produto
    Entao o status deve ser    201
    E a mensagem deve ser    message    Cadastro realizado com sucesso

CT-AUT-01 Cliente nao pode cadastrar produto
    [Tags]    smoke    autorizacao
    Dado que existe um cliente autenticado
    Quando cadastro um produto
    Entao o status deve ser    403
    E a mensagem deve ser    message    Rota exclusiva para administradores

CT-AUT-01 Token invalido e recusado
    [Tags]    regressao    autorizacao
    Dado que existe um administrador autenticado
    Quando cadastro um produto    token=Bearer token.invalido.qualquer
    Entao o status deve ser    401

CT-PRD-03 Preco zero e recusado
    [Tags]    regressao    limites
    Dado que existe um administrador autenticado
    Quando cadastro um produto    preco=0
    Entao o status deve ser    400
    E a mensagem deve ser    preco    preco deve ser um número positivo