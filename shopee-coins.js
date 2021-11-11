// https://api.justyy.workers.dev/api/curl/?url=https://browser-server.glitch.me/
// https://api.justyy.workers.dev/api/curl/?url=https://browser-server.glitch.me/?eval=include\(\%22./.data/shopee-coins.js\%22\)

(async () => {
  const waitUntil = { waitUntil: ['load', 'domcontentloaded', 'networkidle0'] }
  const waitTimeout = 5000

  let result = 'เกิดข้อผิดพลาดในการเก็บเหรียญ'

  try {
    await page.goto('https://shopee.co.th/user/coin', waitUntil)
  } catch { }

  await page.waitForTimeout(waitTimeout)

  if (page.url().includes('/buyer/login')) {
    try {
      var element = await page.waitForXPath('//button[contains(., "ไทย")]', { timeout: waitTimeout })
      if (element) await element.click()
    } catch { }

    try {
      var loginKey = await page.waitForSelector('#main>div>div>div>div>form>div>div>div>div>input[name=loginKey]', { timeout: waitTimeout })
      var password = await page.waitForSelector('#main>div>div>div>div>form>div>div>div>div>input[name=password]', { timeout: waitTimeout })

      if (loginKey && password) {
        await loginKey.type('ko25july@gmail.com')
        await password.type('nongkoko')

        await Promise.all([page.waitForNavigation(waitUntil), page.keyboard.press('Enter')])
      }
    } catch { }
  }

  await page.waitForTimeout(waitTimeout)

  if (page.url().includes('/user/coin')) {
    try {
      var element = await page.waitForXPath('//a[contains(., "รับ coins เพิ่ม")]', { timeout: waitTimeout })
      if (element) {
        await element.focus()
        await Promise.all([page.waitForNavigation(waitUntil), element.press('Enter')])
      }
    } catch { }

    await page.waitForTimeout(waitTimeout)

    if (page.url().includes('/shopee-coins')) {
      try {
        var element = await page.waitForXPath('//button[contains(., "เช็คอินวันนี้ รับ")]', { timeout: waitTimeout })
        if (element) {
          await element.focus()
          await Promise.all([page.waitForNavigation(waitUntil), element.press('Enter')])
        }
      } catch { }

      await page.waitForTimeout(waitTimeout)

      try {
        var element = await page.waitForSelector('#main>div>div>div>main>section>div>div>section>div>a>p', { timeout: waitTimeout })
        if (element) {
          let textContent = await page.evaluate(element => element.textContent, element)
          result = `มีเหรียญสะสม = ${textContent} บาท`
        }
      } catch { }
    }
  }

  await notify(result)

  return result
})()
