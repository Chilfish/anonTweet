import { createRequestHandler, RouterContextProvider } from 'react-router'
import * as build from 'virtual:react-router/server-build'

const handler = createRequestHandler(build)

export default (req: Request) => handler(req, new RouterContextProvider())
