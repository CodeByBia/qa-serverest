*** Settings ***
Documentation     Keywords de negócio reutilizáveis para a API do ServeRest.
Library           RequestsLibrary
Library           String
Library           Collections

*** Variables ***
${BASE_URL}       http://localhost:3000

*** Keywords ***
Criar sessao na API
    Create Session    serverest    ${BASE_URL}    disable_warnings=1

Gerar email unico
    ${sufixo}=    Generate Random String    8    [LOWER]
    RETURN    robot.${sufixo}@qa.com

Cadastrar usuario
    [Arguments]    ${administrador}=true
    ${email}=    Gerar email unico
    ${body}=    Create Dictionary    nome=Usuario Robot    email=${email}    password=senha123    administrador=${administrador}
    ${resp}=    POST On Session    serverest    /usuarios    json=${body}    expected_status=201
    Set Test Variable    ${EMAIL}    ${email}
    Set Test Variable    ${ID_USUARIO}    ${resp.json()}[_id]

Autenticar
    ${body}=    Create Dictionary    email=${EMAIL}    password=senha123
    ${resp}=    POST On Session    serverest    /login    json=${body}    expected_status=200
    Set Test Variable    ${TOKEN}    ${resp.json()}[authorization]

Dado que existe um administrador autenticado
    Cadastrar usuario    administrador=true
    Autenticar

Dado que existe um cliente autenticado
    Cadastrar usuario    administrador=false
    Autenticar

Quando cadastro um produto
    [Arguments]    ${token}=${TOKEN}    ${preco}=100
    ${nome}=    Generate Random String    10
    ${body}=    Create Dictionary    nome=Produto ${nome}    preco=${preco}    descricao=Teste Robot    quantidade=5
    ${headers}=    Create Dictionary    Authorization=${token}
    ${resp}=    POST On Session    serverest    /produtos    json=${body}    headers=${headers}    expected_status=any
    Set Test Variable    ${RESPOSTA}    ${resp}

Entao o status deve ser
    [Arguments]    ${status}
    Status Should Be    ${status}    ${RESPOSTA}

E a mensagem deve ser
    [Arguments]    ${chave}    ${mensagem}
    Should Be Equal    ${RESPOSTA.json()}[${chave}]    ${mensagem}

Quando consulto a lista de usuarios
    ${resp}=    GET On Session    serverest    /usuarios    expected_status=200
    Set Test Variable    ${RESPOSTA}    ${resp}

Entao os headers de seguranca documentados devem estar presentes
    ${headers}=    Set Variable    ${RESPOSTA.headers}
    Should Be Equal    ${headers}[Strict-Transport-Security]    max-age=15552000; includeSubDomains
    Should Be Equal    ${headers}[X-Content-Type-Options]    nosniff
    Should Be Equal    ${headers}[X-DNS-Prefetch-Control]    off
    Should Be Equal    ${headers}[X-Download-Options]    noopen
    Should Be Equal    ${headers}[X-Frame-Options]    SAMEORIGIN
    Should Be Equal    ${headers}[X-XSS-Protection]    1; mode=block

E o header X-Powered-By nao deve existir
    Should Not Contain    ${RESPOSTA.headers}    X-Powered-By

Excluir dados criados
    IF    ${RESPOSTA.status_code} == 201
        ${headers}=    Create Dictionary    Authorization=${TOKEN}
        DELETE On Session    serverest    /produtos/${RESPOSTA.json()}[_id]    headers=${headers}    expected_status=200
    END
    DELETE On Session    serverest    /usuarios/${ID_USUARIO}    expected_status=200