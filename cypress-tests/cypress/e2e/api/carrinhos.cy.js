import Ajv from 'ajv'
import schemaCarrinho from '../../fixtures/schemas/carrinho.json'

const ajv = new Ajv({ allErrors: true })

describe('Carrinhos e estoque', () => {
  let tokenAdmin

  before(() => {
    cy.criarUsuario({ administrador: 'true' })
      .then((admin) => cy.login(admin))
      .then((token) => { tokenAdmin = token })
  })

  // Cada teste usa um cliente novo: cada usuário só pode ter 1 carrinho
  const novoCliente = () =>
    cy.criarUsuario({ administrador: 'false' }).then((cliente) => cy.login(cliente))

  const item = (produto, quantidade) => ({ idProduto: produto._id, quantidade })

  const criarCarrinho = (token, produtos) =>
    cy.request({
      method: 'POST',
      url: '/carrinhos',
      headers: { Authorization: token },
      body: { produtos },
      failOnStatusCode: false
    })

  const encerrarCompra = (token, acao) =>
    cy.request({ method: 'DELETE', url: `/carrinhos/${acao}`, headers: { Authorization: token } })

  const estoqueDo = (produto) => cy.request(`/produtos/${produto._id}`).its('body.quantidade')

  describe('POST /carrinhos', () => {
    it('CT-CAR-01 criar carrinho baixa o estoque e calcula o total', { tags: '@smoke' }, () => {
      cy.criarProduto(tokenAdmin, { quantidade: 3, preco: 10 }).then((produto) => {
        novoCliente().then((tokenCliente) => {
          criarCarrinho(tokenCliente, [item(produto, 2)]).then((resposta) => {
            expect(resposta.status).to.eq(201)
            expect(resposta.body.message).to.eq('Cadastro realizado com sucesso')

            cy.request(`/carrinhos/${resposta.body._id}`).then((consulta) => {
              expect(ajv.validate(schemaCarrinho, consulta.body), JSON.stringify(ajv.errors)).to.be.true
              expect(consulta.body.precoTotal).to.eq(20)
              expect(consulta.body.quantidadeTotal).to.eq(2)
            })

            estoqueDo(produto).should('eq', 1)
          })
        })
      })
    })

    it('CT-CAR-02 recusa um segundo carrinho para o mesmo usuário', () => {
      cy.criarProduto(tokenAdmin).then((produto) => {
        novoCliente().then((tokenCliente) => {
          criarCarrinho(tokenCliente, [item(produto, 1)]).its('status').should('eq', 201)

          criarCarrinho(tokenCliente, [item(produto, 1)]).then((resposta) => {
            expect(resposta.status).to.eq(400)
            expect(resposta.body.message).to.eq('Não é permitido ter mais de 1 carrinho')
          })
        })
      })
    })

    it('CT-CAR-05 recusa quantidade acima do estoque', () => {
      cy.criarProduto(tokenAdmin, { quantidade: 3 }).then((produto) => {
        novoCliente().then((tokenCliente) => {
          criarCarrinho(tokenCliente, [item(produto, 4)]).then((resposta) => {
            expect(resposta.status).to.eq(400)
            expect(resposta.body.message).to.eq('Produto não possui quantidade suficiente')
          })
          estoqueDo(produto).should('eq', 3)
        })
      })
    })

    it('CT-CAR-06 recusa produto duplicado lado a lado [A, A]', () => {
      cy.criarProduto(tokenAdmin).then((produtoA) => {
        novoCliente().then((tokenCliente) => {
          criarCarrinho(tokenCliente, [item(produtoA, 1), item(produtoA, 1)]).then((resposta) => {
            expect(resposta.status).to.eq(400)
            expect(resposta.body.message).to.eq('Não é permitido possuir produto duplicado')
          })
        })
      })
    })

    it('CT-CAR-06 recusa produto duplicado em posições separadas [A, B, A] (BUG-01)', { tags: '@bug-aberto' }, () => {
      cy.criarProduto(tokenAdmin, { quantidade: 3, preco: 10 }).then((produtoA) => {
        cy.criarProduto(tokenAdmin, { quantidade: 10, preco: 100 }).then((produtoB) => {
          novoCliente().then((tokenCliente) => {
            // 4 unidades de A no total, mas o estoque de A é 3
            criarCarrinho(tokenCliente, [item(produtoA, 2), item(produtoB, 1), item(produtoA, 2)]).then((resposta) => {
              if (resposta.status === 201) {
                // O defeito aconteceu: devolve o estoque antes de falhar
                encerrarCompra(tokenCliente, 'cancelar-compra')
              }
              // As verificações DEPOIS da limpeza porque se expect falha, o Cypress para o teste imediatamente e daí, a limpeza não aconteceria
              cy.wrap(resposta).then(() => {
                expect(resposta.status).to.eq(400)
                expect(resposta.body.message).to.eq('Não é permitido possuir produto duplicado')
              })
            })
          })
        })
      })
    })

    // CT-CAR-08: particionamento de equivalência
    it('CT-CAR-08 recusa lista de produtos vazia', () => {
      novoCliente().then((tokenCliente) => {
        criarCarrinho(tokenCliente, []).then((resposta) => {
          expect(resposta.status).to.eq(400)
          expect(resposta.body.produtos).to.eq('produtos não contém 1 valor obrigatório')
        })
      })
    })

    it('CT-CAR-08 recusa quantidade 0', () => {
      cy.criarProduto(tokenAdmin).then((produto) => {
        novoCliente().then((tokenCliente) => {
          criarCarrinho(tokenCliente, [item(produto, 0)]).then((resposta) => {
            expect(resposta.status).to.eq(400)
            expect(resposta.body['produtos[0].quantidade']).to.eq('produtos[0].quantidade deve ser um número positivo')
          })
        })
      })
    })

    it('CT-CAR-08 recusa produto inexistente', () => {
      novoCliente().then((tokenCliente) => {
        criarCarrinho(tokenCliente, [{ idProduto: 'AAAAAAAAAAAAAAAA', quantidade: 1 }]).then((resposta) => {
          expect(resposta.status).to.eq(400)
          expect(resposta.body.message).to.eq('Produto não encontrado')
        })
      })
    })
  })

  describe('Concluir e cancelar compra', () => {
    it('CT-CAR-03 cancelar a compra devolve o estoque', () => {
      cy.criarProduto(tokenAdmin, { quantidade: 3 }).then((produto) => {
        novoCliente().then((tokenCliente) => {
          criarCarrinho(tokenCliente, [item(produto, 2)])
          estoqueDo(produto).should('eq', 1)

          encerrarCompra(tokenCliente, 'cancelar-compra')
            .its('body.message')
            .should('eq', 'Registro excluído com sucesso. Estoque dos produtos reabastecido')

          estoqueDo(produto).should('eq', 3)
        })
      })
    })

    it('CT-CAR-04 concluir a compra mantém a baixa no estoque', () => {
      cy.criarProduto(tokenAdmin, { quantidade: 3 }).then((produto) => {
        novoCliente().then((tokenCliente) => {
          criarCarrinho(tokenCliente, [item(produto, 2)])

          encerrarCompra(tokenCliente, 'concluir-compra')
            .its('body.message')
            .should('eq', 'Registro excluído com sucesso')

          estoqueDo(produto).should('eq', 1)
        })
      })
    })

    it('CT-CAR-07 concluir-compra sem carrinho informa que não há carrinho', () => {
    novoCliente().then((tokenCliente) => {
        encerrarCompra(tokenCliente, 'concluir-compra').then((resposta) => {
        expect(resposta.status).to.eq(200)
        expect(resposta.body.message).to.eq('Não foi encontrado carrinho para esse usuário')
        })
    })
    })

    it('CT-CAR-07 cancelar-compra sem carrinho informa que não há carrinho', () => {
    novoCliente().then((tokenCliente) => {
        encerrarCompra(tokenCliente, 'cancelar-compra').then((resposta) => {
        expect(resposta.status).to.eq(200)
        expect(resposta.body.message).to.eq('Não foi encontrado carrinho para esse usuário')
        })
    })
})
})
})