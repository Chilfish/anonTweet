import Axios from 'axios'
import { buildWebStorage, setupCache } from 'axios-cache-interceptor'

const storage = typeof localStorage === 'undefined' ? {} as Storage : localStorage

const axios = Axios.create({
  timeout: 20000,
})

export const fetcher = setupCache(
  axios,
  {
    storage: buildWebStorage(storage),
  },
)
