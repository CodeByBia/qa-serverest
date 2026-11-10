import Ajv from 'ajv'
import schemaCadastro from '../../fixtures/schemas/cadastro.json'
import schemaUsuario from '../../fixtures/schemas/usuario.json'
import { emailUnico } from '../../support/dados'

const ajv = new Ajv({ allErrors: true })

const usuarioValido = (dados = {}) =>
  ({ nome: 'QA Cypress', email: emailUnico(), password: 'senha123', administrador: 'true', ...dados })

const cadastrar = (body) =>
  cy.request({ method: 'POST', url: '/usuarios', body, failOnStatusCode: false })

describe('Usuários', () => {
  describe('POST /usuarios', () => {
    it('CT-USR-01 cadastra usuário válido e a consulta devolve os mesmos dados', { tags: '@smoke' }, () => {
      const usuario = usuarioValido()

      cadastrar(usuario).then((resposta) => {
        expect(resposta.status).to.eq(201)
        expect(resposta.body.message).to.eq('Cadastro realizado com sucesso')
        expect(ajv.validate(schemaCadastro, resposta.body), JSON.stringify(ajv.errors)).to.be.true

        cy.request(`/usuarios/${resposta.body._id}`).then((consulta) => {
          expect(consulta.status).to.eq(200)
          expect(ajv.validate(schemaUsuario, consulta.body), JSON.stringify(ajv.errors)).to.be.true
          expect(consulta.body).to.deep.eq({ ...usuario, _id: resposta.body._id })
        })
      })
    })

    it('CT-USR-02 recusa e-mail já cadastrado', () => {
      cy.criarUsuario().then((existente) => {
        cadastrar(usuarioValido({ email: existente.email })).then((resposta) => {
          expect(resposta.status).to.eq(400)
          expect(resposta.body.message).to.eq('Este email já está sendo usado')
        })
      })
    })

    // CT-USR-03: particionamento de equivalência (ausente, nulo, vazio, tipo errado, campo extra)
    const corposInvalidos = [
      {
        caso: 'corpo vazio',
        body: {},
        erros: {
          nome: 'nome é obrigatório',
          email: 'email é obrigatório',
          password: 'password é obrigatório',
          administrador: 'administrador é obrigatório'
        }
      },
      { caso: 'nome nulo', body: usuarioValido({ nome: null }), erros: { nome: 'nome deve ser uma string' } },
      { caso: 'nome em branco', body: usuarioValido({ nome: '' }), erros: { nome: 'nome não pode ficar em branco' } },
      { caso: 'senha numérica', body: usuarioValido({ password: 123 }), erros: { password: 'password deve ser uma string' } },
      {
        caso: 'administrador booleano',
        body: usuarioValido({ administrador: true }),
        erros: { administrador: "administrador deve ser 'true' ou 'false'" }
      },
      { caso: 'campo extra', body: usuarioValido({ extra: 1 }), erros: { extra: 'extra não é permitido' } }
    ]

    corposInvalidos.forEach(({ caso, body, erros }) => {
      it(`CT-USR-03 recusa ${caso}`, () => {
        cadastrar(body).then((resposta) => {
          expect(resposta.status).to.eq(400)
          expect(resposta.body).to.deep.eq(erros)
        })
      })
    })
  })

  describe('DELETE /usuarios/{id}', () => {
    it('CT-USR-04 recusa excluir usuário com carrinho', () => {
      cy.criarUsuario({ administrador: 'true' })
        .then((admin) => cy.login(admin))
        .then((tokenAdmin) => cy.criarProduto(tokenAdmin))
        .then((produto) => {
          cy.criarUsuario({ administrador: 'false' }).then((cliente) => {
            cy.login(cliente).then((tokenCliente) => {
              cy.request({
                method: 'POST',
                url: '/carrinhos',
                headers: { Authorization: tokenCliente },
                body: { produtos: [{ idProduto: produto._id, quantidade: 1 }] }
              }).then(({ body: carrinho }) => {
                cy.request({ method: 'DELETE', url: `/usuarios/${cliente._id}`, failOnStatusCode: false })
                  .then((resposta) => {
                    expect(resposta.status).to.eq(400)
                    expect(resposta.body.message).to.eq('Não é permitido excluir usuário com carrinho cadastrado')
                    expect(resposta.body.idCarrinho).to.eq(carrinho._id)
                  })
              })
            })
          })
        })
    })

    it('CT-USR-05 excluir ID inexistente informa que nada foi excluído', () => {
      cy.request('DELETE', '/usuarios/AAAAAAAAAAAAAAAA').then((resposta) => {
        expect(resposta.status).to.eq(200)
        expect(resposta.body.message).to.eq('Nenhum registro excluído')
      })
    })
  })

  describe('PUT /usuarios/{id}', () => {
    it('CT-USR-06 PUT com ID inexistente cria um novo usuário com outro ID', () => {
      const idInexistente = 'BBBBBBBBBBBBBBBB'

      cy.request('PUT', `/usuarios/${idInexistente}`, usuarioValido()).then((resposta) => {
        expect(resposta.status).to.eq(201)
        expect(resposta.body.message).to.eq('Cadastro realizado com sucesso')
        // [OBS] o ID enviado na URL é ignorado e a API gera outro
        expect(resposta.body._id).not.to.eq(idInexistente)
      })
    })
  })
})