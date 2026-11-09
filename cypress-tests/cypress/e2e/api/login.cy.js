describe('POST /login', () => {
it('CT-LOG-01 login válido retorna token Bearer', { tags: '@smoke' }, () => {
    cy.criarUsuario().then((usuario) => {
      cy.request('POST', '/login', {
        email: usuario.email,
        password: usuario.password
      }).then((resposta) => {
        expect(resposta.status).to.eq(200)
        expect(resposta.body.message).to.eq('Login realizado com sucesso')
        expect(resposta.body.authorization).to.match(/^Bearer /)
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
})