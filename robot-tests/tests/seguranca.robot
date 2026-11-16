*** Settings ***
Documentation     Headers de segurança documentados no README do ServeRest (seção "Segurança").
...               Cenário que só o Robot cobre: a segunda ferramenta também acrescenta cobertura.
Resource          ../resources/serverest.resource
Suite Setup       Criar sessao na API

*** Test Cases ***
CT-SEG-01 Headers de seguranca documentados estao presentes
    [Tags]    seguranca    regressao
    Quando consulto a lista de usuarios
    Entao os headers de seguranca documentados devem estar presentes
    E o header X-Powered-By nao deve existir