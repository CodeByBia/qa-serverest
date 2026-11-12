import 'cypress-mochawesome-reporter/register'
import { register as registerCypressGrep } from '@cypress/grep'
import './commands'


registerCypressGrep()



//Carrega o relatório, o filtro de tags e os comandos antes de cada spec.