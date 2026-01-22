import Axios from 'axios'

export const fetcher = Axios.create({
  timeout: 60000,
})

fetcher.interceptors.response.use(
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
