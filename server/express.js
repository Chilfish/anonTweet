import compression from 'compression'
import express from 'express'
import morgan from 'morgan'

const BUILD_PATH = '../build/server/index.js'
const PORT = Number.parseInt(process.env.PORT || '9080')

export const app = express()

app.use(compression())
app.disable('x-powered-by')

console.log('Starting production server')
app.use(
  '/assets',
  express.static('../build/client/assets', { immutable: true, maxAge: '1y' }),
)
app.use(morgan('tiny'))
app.use(express.static('../build/client', { maxAge: '1h' }))
app.use(await import(BUILD_PATH).then(mod => mod.app))

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
