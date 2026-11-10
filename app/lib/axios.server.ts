import axios from 'axios'

// Workers 里默认 adapter 会落到不支持的 xhr / Node http 实现上；
// 浏览器构建保持默认（xhr）以便复用同一批服务端代码时不改变客户端行为。
if (typeof window === 'undefined') {
  axios.defaults.adapter = 'fetch'
}

export default axios
export { isAxiosError } from 'axios'
