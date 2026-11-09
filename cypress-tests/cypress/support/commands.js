import { emailUnico, nomeUnico } from './dados'


const api = (caminho) => `${Cypress.expose('API_URL') ?? Cypress.config('baseUrl')}${caminho}`

Cypress.Commands.add('criarUsuario', (dados = {}) => {
  const usuario = {
    nome: 'QA Cypress',
    email: emailUnico(),
    password: 'senha123',
    administrador: 'true',
    ...dados
  }
  return cy.request('POST', api('/usuarios'), usuario)
    .then(({ body }) => ({ ...usuario, _id: body._id }))
})

Cypress.Commands.add('login', ({ email, password }) =>
  cy.request('POST', api('/login'), { email, password }).its('body.authorization'))