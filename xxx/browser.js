// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality.
// Any number of plugins can be added through `puppeteer.use()`
import puppeteer from 'puppeteer-extra'

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

// Add devtools plugin to debugging with DevTools Protocol
import DevtoolsPlugin from 'puppeteer-extra-plugin-devtools'
const devtools = DevtoolsPlugin()
puppeteer.use(devtools)

import { readFileSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { inspect } from 'util'

const __dirname = dirname(fileURLToPath(import.meta.url))

import express from 'express'
import notify from './notify.js'

const app = express()
const port = process.env.PORT || 80
const beforeHtml = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title></title></head><body>'
const afterHtml = '</body></html>'

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.raw())
app.use(express.text())

app.use('/', async (req, res, next) => {
  try {
    let result = ''

    if (req.path === '/') {
      if (req.body.eval || req.query.eval) {
        let data = await eval(req.body.eval || req.query.eval)

        try {
          if (typeof data === 'function') {
            data = data.call(undefined)
          } else if (typeof data === 'object' && typeof data.default === 'function') {
            data = data.default.call(undefined)
          }
        } catch { }

        result = inspect(await Promise.resolve(data))

        await page.waitForTimeout(1000)
        await page.screenshot({ path: `${__dirname}/screenshot.png`, fullPage: true })
        res.end(`${beforeHtml}<img src="/screenshot.png"><pre>${result}</pre>${afterHtml}`)
      } else {
        res.sendStatus(200)
      }

      if (result && (req.body.notify || req.query.notify)) {
        notify(result).catch(error => {
          console.error(error.message)
        })
      }
    } else {
      next('route')
    }
  } catch (error) {
    console.error(error.message)
    res.status(500).end(error.message)
  }
})

app.use('/eval', async (req, res) => {
  let result = ''

  try {
    if (req.body.eval || req.query.eval) {
      let data = await eval(req.body.eval || req.query.eval)

      if (typeof data === 'function') {
        data = data.call(undefined)
      } else if (typeof data === 'object' && typeof data.default === 'function') {
        data = data.default.call(undefined)
      }

      result = inspect(await Promise.resolve(data))

      await page.waitForTimeout(1000)
      await page.screenshot({ path: `${__dirname}/screenshot.png`, fullPage: true })
    }
  } catch (error) {
    console.error(error.message)
    result = error.message
  }

  res.end(`${beforeHtml}<form action="eval" enctype="text/json" method="post"><p><textarea type="text" name="eval" value="" id="eval" style="width: 100%;" autofocus oninput='this.style.height=""; this.style.height=this.scrollHeight+"px"'></textarea></p><p><input type="submit" name="Submit" value="Submit"></p></form><img src="/screenshot.png"><pre>${result}</pre>${afterHtml}`)

  if (result && (req.body.notify || req.query.notify)) {
    notify(result).catch(error => {
      console.error(error.message)
    })
  }
})

app.use('/notify', (req, res) => {
  if (req.body.message || req.query.message) {
    notify(req.body.message || req.query.message).then(value => {
      res.end(value)
    }).catch(error => {
      console.error(error.message)
      res.status(500).end(error.message)
    })
  } else {
    res.sendStatus(204)
  }
})

app.get('/screenshot', async (req, res) => {
  try {
    await page.screenshot({ path: `${__dirname}/screenshot.png`, fullPage: true })
    await page.waitForTimeout(1000)

    res.setHeader('Content-Type', 'image/png')
    res.sendFile(`${__dirname}/screenshot.png`)
  } catch (error) {
    console.error(error.message)
    res.status(500).end(error.message)
  }
})

app.get('/screenshot.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png')
  res.sendFile(`${__dirname}/screenshot.png`)
})

app.get('/favicon.ico', (_req, res) => {
  res.setHeader('Content-Type', 'image/x-icon')
  res.sendFile(`${__dirname}/favicon.ico`)
})

app.use('/devtools', async (_req, res) => {
  res.redirect(tunnel.getUrlForPage(page))
})

app.use('*', (_req, res) => {
  res.sendStatus(404)
})

app.listen(port, () => {
  console.log(`Server listening at port ${port}`)

  globalThis.include = async file => await Promise.resolve(await eval.apply(globalThis, [readFileSync(file).toString()]))
  globalThis.notify = notify

  newBrowser()
})

const newBrowser = async () => {
  try {
    globalThis.browser = await puppeteer.launch({
      headless: true,
      devtools: false,
      defaultViewport: null,
      userDataDir: './.data/chrome/',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    })

    browser.on('disconnected', () => {
      tunnel.close()

      setTimeout(async () => {
        await newBrowser()
      }, 1000)
    })

    devtools.setAuthCredentials('admin', 'password')

    globalThis.tunnel = await devtools.createTunnel(browser)
    globalThis.page = (await browser.pages())[0]

    page.on('close', () => {
      setTimeout(async () => {
        globalThis.page = await browser.newPage()

        await page.setContent('<html><head></head><body></body></html>')
      }, 1000)
    })

    await page.setContent('<html><head></head><body></body></html>')

    // console.log(devtools.getLocalDevToolsUrl(browser))
    // console.log(tunnel.url)
    // console.log(tunnel.getUrlForPage(page))
  } catch (error) {
    console.error(error.message)
  }
}

export default async () => new Promise(resolve => setTimeout(resolve, 1000))
