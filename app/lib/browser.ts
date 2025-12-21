import type { Browser, LaunchOptions, Page } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import core from 'puppeteer-core'
import { env } from '~/lib/env.server'

let browserInstance: Browser | null = null

async function getLaunchOptions(): Promise<LaunchOptions> {
  const commonArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--force-color-profile=srgb', // 强制使用 sRGB，修复颜色发灰
    '--font-render-hinting=none', // 调整字体微调策略，有时能改善模糊
    '--disable-font-subpixel-positioning', // 禁用子像素定位，截图场景下能让文字更锐利
  ]

  if (env.VERCEL) {
    // Vercel / AWS Lambda Configuration
    chromium.setGraphicsMode = false
    const viewport = {
      deviceScaleFactor: 2,
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
      headless: 'shell', // 或使用 chromium.headless 变量
    }
  }
  else {
    const { executablePath } = await import('puppeteer')

    return {
      args: commonArgs,
      executablePath: executablePath(),
      headless: 'shell',
      defaultViewport: { width: 1000, height: 1000, deviceScaleFactor: 2 },
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

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2, // 2x 渲染，解决文字发虚边缘模糊
    })

    const targetUrl = `${env.HOSTNAME}/plain-tweet/${tweetId}`

    // 在 goto 之后，screenshot 之前，除了等待图片，最好也等待 Web Font 加载
    await page.goto(targetUrl, {
      waitUntil: 'networkidle0', // 等待网络空闲，通常包含字体下载
      timeout: 30000,
    })

    const screenshootSelector = '#main-container'
    const loadedSelector = '.tweet-loaded'

    await page.waitForSelector(loadedSelector, { visible: true, timeout: 20000 })

    await page.waitForFunction(
      (selector) => {
        const container = document.querySelector(selector)
        if (!container)
          return false
        const images = Array.from(container.querySelectorAll('img'))

        const fontsReady = document.fonts.status === 'loaded'
        const imagesReady = images.every(img => img.complete)

        return imagesReady && fontsReady
      },
      { timeout: 10000, polling: 100 },
      screenshootSelector,
    )

    await new Promise(r => setTimeout(r, 200))

    const element = await page.$(screenshootSelector)
    if (!element) {
      throw new Error(`Target element "${screenshootSelector}" not found.`)
    }

    const buffer = await element.screenshot({
      type: 'png',
      omitBackground: true,
      optimizeForSpeed: false,
    })

    return Buffer.from(buffer)
  }
  catch (error) {
    console.error(`Screenshot failed for ${tweetId}:`, error)
    if (browserInstance && !browserInstance.connected) {
      browserInstance = null
    }
    throw error
  }
  finally {
    if (page) {
      await page.close().catch(() => {})
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
