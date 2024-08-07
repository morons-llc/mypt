import fs from 'fs'
import ejs from 'ejs'
import yaml from 'js-yaml'
import crypto from 'crypto'
import puppeteer from 'puppeteer'
import { Storage } from '@google-cloud/storage'

fs.rmSync('_site', { recursive: true, force: true })
fs.mkdirSync('_site', { recursive: true })

// staticFiles maps static file source names to their fingerprinted versions
// it is passed to all templates
const staticFiles = {}
let cssContents, browser

// copy static files with md5 checksum added to filename
fs.readdirSync('static', { withFileTypes: true }).forEach(dirent => {
  if (!dirent.isFile()) {
    return;
  }

  const fileName = dirent.name
  const contents = fs.readFileSync(`static/${fileName}`, 'utf8')
  if (fileName === "main.css") cssContents = contents
  const hexDigest = crypto.createHash('md5').update(contents, 'utf8').digest('hex')

  const fileExtensionIndex = fileName.lastIndexOf('.')
  const fingerprintedFilename = `${fileName.slice(0, fileExtensionIndex)}-${hexDigest}${fileName.slice(fileExtensionIndex)}`
  staticFiles[fileName] = fingerprintedFilename

  fs.cpSync(`static/${fileName}`, `_site/static/${fingerprintedFilename}`)
  console.log(`copied static file with fingerprint: ${fileName} -> ${fingerprintedFilename}`)
})

const facts = yaml.load(fs.readFileSync('facts.yaml', 'utf8'))
const factTemplate = ejs.compile(fs.readFileSync('fact.ejs', 'utf8'))
const factCardTemplate = ejs.compile(fs.readFileSync('fact_card.ejs', 'utf8'))
const factCardImageTemplate = ejs.compile(fs.readFileSync('fact_card_image.ejs', 'utf8'))

if (process.env.RENDER_IMAGES) {
  browser = await puppeteer.launch()
  fs.rmSync('_pics', { recursive: true, force: true })
  fs.mkdirSync('_pics', { recursive: true })
}

const factCards = []
for (const fact of facts) {
  const factCard = factCardTemplate({ fact })
  let imagePngFile, imagePngRemote
  factCards.push({ fact, factCard })

  if (process.env.RENDER_IMAGES) {
    const browserPage = await browser.newPage()
    await browserPage.setViewport({ width: 1200, height: 630 });

    const imageHtmlFile = `_pics/${fact.slug}.html`
    imagePngFile = `_pics/${fact.slug}.html.png`

    fs.writeFileSync(imageHtmlFile, factCardImageTemplate({ fact, cssContents }))

    await browserPage.goto(`file://${process.cwd()}/${imageHtmlFile}`)
    fs.writeFileSync(imagePngFile, await browserPage.screenshot({ type: 'png' }))
    console.log(`rendered fact image: ${imagePngFile}`)
  }

  if (process.env.UPLOAD_IMAGES) {
    const storage = new Storage()
    imagePngRemote = fact.slug + ".png"

    await storage.bucket('fact-images').upload(imagePngFile, { destination: imagePngRemote })
  }

  fs.writeFileSync(`_site/${fact.slug}`, factTemplate({ fact, factCard, staticFiles }))
  console.log(`rendered fact template: ${fact.slug}`)
}
console.log(`rendered ${factCards.length} facts`)

if (process.env.RENDER_IMAGES) {
  await browser.close()
}

const indexTemplate = ejs.compile(fs.readFileSync('index.ejs', 'utf8'))
fs.writeFileSync(`_site/index.html`, indexTemplate({ factCards, staticFiles }))
console.log(`rendered index.html`)

console.log('Done!\n')