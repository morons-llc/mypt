const fs = require('fs')
const ejs = require('ejs')
const yaml = require('js-yaml')
const crypto = require('crypto')

fs.rmSync('_site', { recursive: true, force: true })
fs.mkdirSync('_site', { recursive: true })

// staticFiles maps static file source names to their fingerprinted versions
// it is passed to all templates
const staticFiles = {}

// copy static files with md5 checksum added to filename
fs.readdirSync('static', { withFileTypes: true }).forEach(dirent => {
  if (!dirent.isFile()) {
    return;
  }

  const fileName = dirent.name
  const contents = fs.readFileSync(`static/${fileName}`, 'utf8')
  const hexDigest = crypto
        .createHash('md5')
        .update(contents, 'utf8')
        .digest('hex')

  const fileExtensionIndex = fileName.lastIndexOf('.')
  const fingerprintedFilename = fileName.slice(0, fileExtensionIndex) + "-" + hexDigest + fileName.slice(fileExtensionIndex)
  staticFiles[fileName] = fingerprintedFilename

  fs.cpSync(`static/${fileName}`, `_site/static/${fingerprintedFilename}`)
  console.log(`copied static file with fingerprint: ${fileName} -> ${fingerprintedFilename}`)
})


const facts = yaml.load(fs.readFileSync('facts.yaml', 'utf8'))
const factTemplate = ejs.compile(fs.readFileSync('fact.ejs', 'utf8'))

let factCount = 0
facts.forEach(fact => {
  const page = factTemplate({ fact, staticFiles })

  fs.writeFileSync(`_site/${fact.slug}`, page)
  console.log(`rendered fact template: ${fact.slug}`)
  factCount++
})
console.log(`rendered ${factCount} facts`)

const indexTemplate = ejs.compile(fs.readFileSync('index.ejs', 'utf8'))
fs.writeFileSync(`_site/index.html`, indexTemplate({ facts, staticFiles }))
console.log(`rendered index.html`)

console.log('Done!\n')
