import type { Browser, LaunchOptions, Page } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import core from 'puppeteer-core'
import { isProduction } from '~/lib/env.server'

let browserInstance: Browser | null = null

/**
 * Generates the appropriate browser launch options based on the environment.
 * Handles the binary path resolution for Vercel (Lambda) vs Local Machine.
 */
async function getLaunchOptions(): Promise<LaunchOptions> {
  // Common arguments for stability in containerized environments
  const commonArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
  ]

  if (isProduction) {
    // Vercel / AWS Lambda Configuration
    // @sparticuz/chromium automatically handles the correct binary path and graphics flags
    chromium.setGraphicsMode = false // Optional: strict mode for headless

    // 如果需要支持自定义字体，需要在此处加载
    // await chromium.font('https://raw.githack.com/googlefonts/noto-cjk/main/Sans/Variable/HK/NotoSansHK-VF.ttf');

    const viewport = {
      deviceScaleFactor: 1,
      hasTouch: false,
      height: 1080,
      isLandscape: true,
      isMobile: false,
      width: 1920,
    }
    return {
      args: [...chromium.args, ...commonArgs],
      defaultViewport: viewport,
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    }
  }
  else {
    // Local Development Configuration
    // Dynamically import full puppeteer to find local chrome path
    // or assume standard paths.
    // Using a conditional require to avoid bundling 'puppeteer' in production
    let exePath = ''
    try {
      // 尝试自动定位本地 Chrome/Chromium
      const { executablePath } = await import('puppeteer')
      exePath = executablePath()
    }
    catch (e) {
      // Fallback: Manually specify path if 'puppeteer' devDependency is missing
      // Mac example:
      exePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      console.warn('Local Puppeteer not found, using manual path:', exePath)
    }

    return {
      args: commonArgs,
      executablePath: exePath,
      headless: 'shell',
      defaultViewport: { width: 1000, height: 1000 },
    }
  }
}

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance
  }

  const options = await getLaunchOptions()

  browserInstance = await core.launch({
    ...options,
    // Protocol timeout specifically for slow serverless environments
    protocolTimeout: 240000,
  })

  return browserInstance
}

export async function screenshotTweet(tweetId: string): Promise<Buffer> {
  let browser: Browser | null = null
  let page: Page | null = null

  try {
    browser = await getBrowser()
    page = await browser.newPage()

    // Optimizing Viewport
    await page.setViewport({
      width: 1000,
      height: 1200, // Slightly larger initial height to prevent scroll jank
      deviceScaleFactor: 2,
    })

    const targetUrl = `https://anon-tweet-dev.chilfish.top/tweets/${tweetId}?plain=true`
    // const targetUrl = `http://localhost:9080/tweets/${tweetId}?plain=true`

    await page.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    const screenshootSelector = '#main-container'
    const loadedSelector = '.tweet-loaded'

    try {
      await page.waitForSelector(loadedSelector, {
        visible: true,
        timeout: 20000,
      })
    }
    catch (e) {
      throw new Error(`Tweet loaded timeout: Skeleton screen persisted for too long on ${tweetId}`)
    }

    await page.waitForFunction(
      (selector) => {
        const container = document.querySelector(selector)
        if (!container)
          return false
        const images = Array.from(container.querySelectorAll('img'))
        // 检查每一张图片的状态
        // img.complete: 浏览器原生属性，图片加载成功或失败时都为 true，加载中为 false
        // 只有当所有图片都 complete 时，才返回 true，触发截图
        return images.every(img => img.complete)
      },
      {
        timeout: 10000,
        polling: 100,
      },
      screenshootSelector,
    )

    await new Promise(r => setTimeout(r, 500))

    const element = await page.$(screenshootSelector)
    if (!element) {
      throw new Error(`Target element "${screenshootSelector}" not found.`)
    }

    const buffer = await element.screenshot({
      type: 'png',
      omitBackground: true,
      // Optimize encoding
      optimizeForSpeed: true,
    })

    return Buffer.from(buffer)
  }
  catch (error) {
    console.error(`Screenshot failed for ${tweetId}:`, error)

    // Critical: If browser crashed, force reset the singleton
    if (browserInstance && !browserInstance.connected) {
      browserInstance = null
    }
    throw error
  }
  finally {
    if (page) {
      await page.close().catch(() => {}) // Suppress errors on close
    }
  }
}

/**
 * Handle warm shutdown signals if the platform sends them
 */
export async function closeBrowserService(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(console.error)
    browserInstance = null
  }
}
