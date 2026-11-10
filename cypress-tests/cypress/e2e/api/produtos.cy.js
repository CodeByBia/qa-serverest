import Ajv from 'ajv'
import schemaCadastro from '../../fixtures/schemas/cadastro.json'
import schemaProduto from '../../fixtures/schemas/produto.json'
import { nomeUnico } from '../../support/dados'

const ajv = new Ajv({ allErrors: true })

describe('Produtos', () => {
  let tokenAdmin

  before(() => {
    cy.criarUsuario({ administrador: 'true' })
      .then((admin) => cy.login(admin))
      .then((token) => { tokenAdmin = token })
  })

  const produtoValido = (dados = {}) =>
    ({ nome: nomeUnico(), preco: 100, descricao: 'Produto de teste', quantidade: 5, ...dados })

  const cadastrar = (body) =>
    cy.request({
      method: 'POST',
      url: '/produtos',
      body,
      headers: { Authorization: tokenAdmin },
      failOnStatusCode: false
    })

  describe('POST /produtos', () => {
    it('CT-PRD-01 cadastra produto válido e a consulta devolve os mesmos dados', { tags: '@smoke' }, () => {
      const produto = produtoValido()

      cadastrar(produto).then((resposta) => {
        expect(resposta.status).to.eq(201)
        expect(resposta.body.message).to.eq('Cadastro realizado com sucesso')
        expect(ajv.validate(schemaCadastro, resposta.body), JSON.stringify(ajv.errors)).to.be.true

        cy.request(`/produtos/${resposta.body._id}`).then((consulta) => {
          expect(consulta.status).to.eq(200)
          expect(ajv.validate(schemaProduto, consulta.body), JSON.stringify(ajv.errors)).to.be.true
          expect(consulta.body).to.deep.eq({ ...produto, _id: resposta.body._id })
        })
      })
    })
//estudar mais sobre o command e a função
    it('CT-PRD-02 recusa nome já cadastrado', () => {
      cy.criarProduto(tokenAdmin).then((existente) => {
        cadastrar(produtoValido({ nome: existente.nome })).then((resposta) => {
          expect(resposta.status).to.eq(400)
          expect(resposta.body.message).to.eq('Já existe produto com esse nome')
        })
      })
    })

    it('CT-PRD-02 recusa nome já cadastrado com espaços nas pontas', () => {
      cy.criarProduto(tokenAdmin).then((existente) => {
        cadastrar(produtoValido({ nome: `  ${existente.nome}  ` })).then((resposta) => {
          expect(resposta.status).to.eq(400)
          expect(resposta.body.message).to.eq('Já existe produto com esse nome')
        })
      })
    })

    // CT-PRD-03: análise de valor limite. Regra [DOC]: preço inteiro >= 1
    const limitesDePreco = [
      { preco: -1, status: 400, erro: 'preco deve ser um número positivo' },
      { preco: 0, status: 400, erro: 'preco deve ser um número positivo' },
      { preco: 1, status: 201 },
      { preco: 2, status: 201 },
      { preco: 10.5, status: 400, erro: 'preco deve ser um inteiro' },
      { preco: 9007199254740992, status: 400, erro: 'preco não pode ser maior que 9007199254740991' }
    ]

    limitesDePreco.forEach(({ preco, status, erro }) => {
      it(`CT-PRD-03 preço ${preco} retorna ${status}`, () => {
        cadastrar(produtoValido({ preco })).then((resposta) => {
          expect(resposta.status).to.eq(status)
          if (erro) {
            expect(resposta.body.preco).to.eq(erro)
          }
        })
      })
    })

    // CT-PRD-04: análise de valor limite. Regra [DOC]: quantidade inteira >= 0
    const limitesDeQuantidade = [
      { quantidade: -1, status: 400, erro: 'quantidade deve ser maior ou igual a 0' },
      { quantidade: 0, status: 201 },
      { quantidade: 1, status: 201 },
      { quantidade: 1.5, status: 400, erro: 'quantidade deve ser um inteiro' }
    ]

    limitesDeQuantidade.forEach(({ quantidade, status, erro }) => {
      it(`CT-PRD-04 quantidade ${quantidade} retorna ${status}`, () => {
        cadastrar(produtoValido({ quantidade })).then((resposta) => {
          expect(resposta.status).to.eq(status)
          if (erro) {
            expect(resposta.body.quantidade).to.eq(erro)
          }
        })
      })
    })

    // CT-PRD-05: particionamento de equivalência
    const corposInvalidos = [
      {
        caso: 'corpo vazio',
        body: {},
        erros: {
          nome: 'nome é obrigatório',
          preco: 'preco é obrigatório',
          descricao: 'descricao é obrigatório',
          quantidade: 'quantidade é obrigatório'
        }
      },
      {
        caso: 'descrição em branco',
        body: produtoValido({ descricao: '' }),
        erros: { descricao: 'descricao não pode ficar em branco' }
      },
      {
        caso: 'preço como texto',
        body: produtoValido({ preco: 'dez' }),
        erros: { preco: 'preco deve ser um número' }
      }
    ]

    corposInvalidos.forEach(({ caso, body, erros }) => {
      it(`CT-PRD-05 recusa ${caso}`, () => {
        cadastrar(body).then((resposta) => {
          expect(resposta.status).to.eq(400)
          expect(resposta.body).to.deep.eq(erros)
        })
      })
    })

    it('CT-PRD-06 recusa nome só com espaços (BUG-02)', { tags: '@bug-aberto' }, () => {
      cadastrar(produtoValido({ nome: '    ' })).then((resposta) => {
        if (resposta.status === 201) {
          // O defeito aconteceu: apaga o produto para não afetar as próximas execuções
          cy.request({
            method: 'DELETE',
            url: `/produtos/${resposta.body._id}`,
            headers: { Authorization: tokenAdmin }
          })
        }
        
        cy.wrap(resposta).then(() => {
          expect(resposta.status).to.eq(400)
          expect(resposta.body.nome).to.eq('nome não pode ficar em branco')
        })
      })
    })
  })

  describe('DELETE /produtos/{id}', () => {
    it('CT-PRD-07 recusa excluir produto que está em um carrinho', () => {
      cy.criarProduto(tokenAdmin).then((produto) => {
        cy.criarUsuario({ administrador: 'false' })
          .then((cliente) => cy.login(cliente))
          .then((tokenCliente) => {
            cy.request({
              method: 'POST',
              url: '/carrinhos',
              headers: { Authorization: tokenCliente },
              body: { produtos: [{ idProduto: produto._id, quantidade: 1 }] }
            })

            cy.request({
              method: 'DELETE',
              url: `/produtos/${produto._id}`,
              headers: { Authorization: tokenAdmin },
              failOnStatusCode: false
            }).then((resposta) => {
              expect(resposta.status).to.eq(400)
              expect(resposta.body.message).to.eq('Não é permitido excluir produto que faz parte de carrinho')
              expect(resposta.body.idCarrinhos).to.have.length(1)
            })
          })
      })
    })
  })

  describe('PUT /produtos/{id}', () => {
    it('CT-PRD-08 recusa editar para o nome de outro produto', () => {
      cy.criarProduto(tokenAdmin).then((primeiro) => {
        cy.criarProduto(tokenAdmin).then((segundo) => {
          cy.request({
            method: 'PUT',
            url: `/produtos/${segundo._id}`,
            headers: { Authorization: tokenAdmin },
            body: { nome: primeiro.nome, preco: segundo.preco, descricao: segundo.descricao, quantidade: segundo.quantidade },
            failOnStatusCode: false
          }).then((resposta) => {
            expect(resposta.status).to.eq(400)
            expect(resposta.body.message).to.eq('Já existe produto com esse nome')
          })
        })
      })
    })
  })
})