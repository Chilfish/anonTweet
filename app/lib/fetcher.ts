import Axios from 'axios'
import { buildWebStorage, setupCache } from 'axios-cache-interceptor'

const storage = typeof localStorage === 'undefined' ? {} as Storage : localStorage

const axios = Axios.create({
  timeout: 60000,
})

axios.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.status && data.status !== 200) {
      return Promise.reject(data)
    }
    return response
  },
  (error) => {
    return Promise.reject(error)
  },
)

export const fetcher = setupCache(
  axios,
  {
    storage: buildWebStorage(storage),
  },
)
