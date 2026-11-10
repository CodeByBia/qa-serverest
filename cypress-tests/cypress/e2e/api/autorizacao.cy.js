import { nomeUnico } from '../../support/dados'

const MSG_TOKEN = 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'

describe('Autorização', () => {
  let tokenAdmin
  let tokenCliente
  let tokenUsuarioExcluido

  before(() => {
    cy.criarUsuario({ administrador: 'true' })
      .then((admin) => cy.login(admin))
      .then((token) => { tokenAdmin = token })

    cy.criarUsuario({ administrador: 'false' })
      .then((cliente) => cy.login(cliente))
      .then((token) => { tokenCliente = token })

    // Token válido de um usuário que é apagado logo depois do login
    cy.criarUsuario({ administrador: 'true' }).then((usuario) => {
      cy.login(usuario).then((token) => { tokenUsuarioExcluido = token })
      cy.request('DELETE', `/usuarios/${usuario._id}`)
    })
  })

  describe('POST /produtos: tabela de decisão (CT-AUT-01)', () => {
    const casos = [
      { caso: 'sem header Authorization', header: () => undefined, status: 401, mensagem: MSG_TOKEN },
      { caso: 'token sem o prefixo Bearer', header: () => tokenAdmin.replace('Bearer ', ''), status: 401, mensagem: MSG_TOKEN },
      { caso: 'token malformado', header: () => 'Bearer abc.def.ghi', status: 401, mensagem: MSG_TOKEN },
      { caso: 'token de usuário excluído', header: () => tokenUsuarioExcluido, status: 401, mensagem: MSG_TOKEN },
      { caso: 'token de cliente', header: () => tokenCliente, status: 403, mensagem: 'Rota exclusiva para administradores', tags: '@smoke' },
      { caso: 'token de administrador', header: () => tokenAdmin, status: 201, mensagem: 'Cadastro realizado com sucesso', tags: '@smoke' }
    ]

    casos.forEach(({ caso, header, status, mensagem, tags }) => {
      it(`CT-AUT-01 ${caso} retorna ${status}`, { tags }, () => {
        const token = header()
        cy.request({
          method: 'POST',
          url: '/produtos',
          headers: token ? { Authorization: token } : {},
          body: { nome: nomeUnico(), preco: 100, descricao: 'Produto de teste', quantidade: 5 },
          failOnStatusCode: false
        }).then((resposta) => {
          expect(resposta.status).to.eq(status)
          expect(resposta.body.message).to.eq(mensagem)
        })
      })
    })
  })

  describe('Estado do token', () => {
    it('CT-AUT-02 token deixa de valer após a troca de senha', () => {
      cy.criarProduto(tokenAdmin).then((produto) => {
        cy.criarUsuario({ administrador: 'false' }).then((cliente) => {
          cy.login(cliente).then((tokenAntigo) => {
            cy.request('PUT', `/usuarios/${cliente._id}`, {
              nome: cliente.nome,
              email: cliente.email,
              password: 'nova-senha',
              administrador: cliente.administrador
            }).its('body.message').should('eq', 'Registro alterado com sucesso')

            cy.request({
              method: 'POST',
              url: '/carrinhos',
              headers: { Authorization: tokenAntigo },
              body: { produtos: [{ idProduto: produto._id, quantidade: 1 }] },
              failOnStatusCode: false
            }).then((resposta) => {
              expect(resposta.status).to.eq(401)
              expect(resposta.body.message).to.eq(MSG_TOKEN)
            })
          })
        })
      })
    })

    it('CT-AUT-03 token deixa de valer após a exclusão do usuário', () => {
      cy.criarUsuario({ administrador: 'true' }).then((admin) => {
        cy.login(admin).then((token) => {
          cy.request('DELETE', `/usuarios/${admin._id}`)
            .its('body.message').should('eq', 'Registro excluído com sucesso')

          cy.request({
            method: 'POST',
            url: '/produtos',
            headers: { Authorization: token },
            body: { nome: nomeUnico(), preco: 100, descricao: 'Produto de teste', quantidade: 5 },
            failOnStatusCode: false
          }).then((resposta) => {
            expect(resposta.status).to.eq(401)
            expect(resposta.body.message).to.eq(MSG_TOKEN)
          })
        })
      })
    })
  })
})