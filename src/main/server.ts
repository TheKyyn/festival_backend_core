import { buildContainer, toAppDependencies } from './container'
import { createApp } from '../interface/http/app'
import { loadEnv } from '../infrastructure/config/env'

const env = loadEnv()
const container = buildContainer(env)
const app = createApp(toAppDependencies(container))

app.listen(env.port, () => {
  console.log(`Festival Backend Core - API demarree sur http://localhost:${env.port}`)
})
