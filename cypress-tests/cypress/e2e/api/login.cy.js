import Ajv from 'ajv'
import schemaLogin from '../../fixtures/schemas/login.json'
import { emailUnico } from '../../support/dados'

const ajv = new Ajv({ allErrors: true })

describe('POST /login', () => {
  it('CT-LOG-01 login válido retorna token Bearer', { tags: '@smoke' }, () => {
    cy.criarUsuario().then((usuario) => {
      cy.request('POST', '/login', {
        email: usuario.email,
        password: usuario.password
      }).then((resposta) => {
        expect(resposta.status).to.eq(201)
        expect(resposta.body.message).to.eq('Login realizado com sucesso')
        expect(resposta.body.authorization).to.match(/^Bearer /)
        expect(ajv.validate(schemaLogin, resposta.body), JSON.stringify(ajv.errors)).to.be.true
      })
    })
  })

  it('CT-LOG-02 senha incorreta retorna 401', () => {
    cy.criarUsuario().then((usuario) => {
      cy.request({
        method: 'POST',
        url: '/login',
        body: { email: usuario.email, password: 'senha-errada' },
        failOnStatusCode: false
      }).then((resposta) => {
        expect(resposta.status).to.eq(401)
        expect(resposta.body.message).to.eq('Email e/ou senha inválidos')
      })
    })
  })

  it('CT-LOG-03 e-mail não cadastrado retorna a mesma mensagem da senha errada', () => {
    cy.request({
      method: 'POST',
      url: '/login',
      body: { email: emailUnico(), password: 'qualquer' },
      failOnStatusCode: false
    }).then((resposta) => {
      expect(resposta.status).to.eq(401)
      expect(resposta.body.message).to.eq('Email e/ou senha inválidos')
    })
  })

  // CT-LOG-04: Campos ausentes, vazios e tipo errado. Particionamento de equivalência na prática
  
  const entradasInvalidas = [
    {
      caso: 'corpo vazio',
      body: {},
      erros: { email: 'email é obrigatório', password: 'password é obrigatório' }
    },
    {
      caso: 'campos em branco',
      body: { email: '', password: '' },
      erros: { email: 'email não pode ficar em branco', password: 'password não pode ficar em branco' }
    },
    {
      caso: 'e-mail sem formato válido',
      body: { email: 'abc', password: 'x' },
      erros: { email: 'email deve ser um email válido' }
    }
  ]

  entradasInvalidas.forEach(({ caso, body, erros }) => {
    it(`CT-LOG-04 recusa ${caso}`, () => {
      cy.request({ method: 'POST', url: '/login', body, failOnStatusCode: false })
        .then((resposta) => {
          expect(resposta.status).to.eq(400)
          expect(resposta.body).to.deep.eq(erros)
        })
    })
  })
})