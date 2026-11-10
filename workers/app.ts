import { createRequestHandler, RouterContextProvider } from 'react-router'
import * as build from 'virtual:react-router/server-build'

const requestHandler = createRequestHandler(build, import.meta.env.MODE)

export default {
  fetch(request: Request) {
    return requestHandler(request, new RouterContextProvider())
  },
}
