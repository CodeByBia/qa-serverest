let contador = 0

export const sufixoUnico = () => `${Date.now()}${++contador}`
export const emailUnico = () => `qa.${sufixoUnico()}@teste.com`
export const nomeUnico = () => `Produto QA ${sufixoUnico()}`