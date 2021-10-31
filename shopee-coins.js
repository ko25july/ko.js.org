// https://api.justyy.workers.dev/api/curl/?url=https://browser-server.glitch.me/?eval=include\(\%22./.data/shopee-coins.js\%22\)

(async () => {
  let result = 'เกิดข้อผิดพลาดในการเก็บเหรียญ'

  try {
    await page.goto('https://shopee.co.th/user/coin', { waitUntil: 'networkidle0' })
  } catch { }

  if (await page.url().includes('/buyer/login')) {
    try {
      var element = await page.waitForXPath('//button[contains(., "ไทย")]', { timeout: 3000 })
      if (element) await element.click()
    } catch { }

    try {
      var loginKey = await page.waitForSelector('#main>div>div>div>div>form>div>div>div>div>input[name=loginKey]', { timeout: 3000 })
      var password = await page.waitForSelector('#main>div>div>div>div>form>div>div>div>div>input[name=password]', { timeout: 3000 })

      if (loginKey && password) {
        await loginKey.type('ko25july@gmail.com')
        await password.type('nongkoko')

        await Promise.all([page.keyboard.press('Enter'), page.waitForNavigation({ waitUntil: 'networkidle0' })])

        page.waitForTimeout(3000)
      }
    } catch { }
  }

  try {
    if (await page.url().includes('/user/coin')) {
      var element = await page.waitForXPath('//a[contains(., "รับ coins เพิ่ม")]', { timeout: 3000 })
      if (element) {
        await element.focus()
        await Promise.all([element.press('Enter'), page.waitForNavigation({ waitUntil: 'networkidle0' })])
      }

      if (await page.url().includes('/shopee-coins')) {
        var element = await page.waitForXPath('//button[contains(., "เช็คอินวันนี้ รับ")]', { timeout: 3000 })
        if (element) {
          await element.focus()
          await Promise.all([element.press('Enter'), page.waitForNavigation({ waitUntil: 'networkidle0' })])
        }

        page.waitForTimeout(3000)

        var element = await page.waitForSelector('#main>div>div>div>main>section>div>div>section>div>a>p', { timeout: 3000 })
        if (element) result = `มีเหรียญสะสม = ${element.innerText} บาท`
      }
    }
  } catch { }

  await notify(result)
})()
