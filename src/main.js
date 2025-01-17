const puppeteer = require("puppeteer")
const { GoogleSpreadsheet } = require("google-spreadsheet")
const { JWT } = require("google-auth-library");

const updateSpreadsheet = async (world, us) => {
  const serviceAccountAuth = new JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })


  const doc = new GoogleSpreadsheet(process.env.SHEET_ID, serviceAccountAuth)
  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByTitle[process.env.SHEET_NAME]
  await sheet.loadCells('B1:B5')
  const worldCell = sheet.getCellByA1('B1')
  const usCell = sheet.getCellByA1('B2')
  const time = sheet.getCellByA1('B4')
  const date = sheet.getCellByA1('B5')
  const now = new Date()

  worldCell.value = world
  usCell.value = us
  time.value = now.toLocaleTimeString("en-NZ", { timezone: 'Pacific/Wellington' })
  date.value = now.toLocaleDateString("en-NZ", { timezone: 'Pacific/Wellington' })
  await sheet.saveUpdatedCells()

  process.exit(0)
}

const scrapeData = async () => {
  const browser = await puppeteer.launch({headless: 'new', executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"]})//({headless: false})
  const page = await browser.newPage()

  console.log(process.env.URL_1)
  await page.goto(process.env.URL_1)

  await page.waitForSelector('.sal-mip-quote__block-grid')
  const world = await page.evaluate(() => {
    const elem = document.getElementsByClassName('sal-dp-value')[0]
    return Number(elem.textContent.split('/')[0].trim())
  })
  console.log(world)

  
  await page.goto(process.env.URL_2)
  await page.waitForSelector('.sal-mip-quote__block-grid')
  const us = await page.evaluate(() => {
    const elem = document.getElementsByClassName('sal-dp-value')[0]
    return Number(elem.textContent.split('/')[0].trim())
  })
  console.log(us)

  await updateSpreadsheet(world, us)
}

scrapeData()
