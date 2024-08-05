const fs = require('fs')
const ejs = require('ejs')
const yaml = require('js-yaml')

fs.rmSync('_site', { recursive: true, force: true })
fs.mkdirSync('_site', { recursive: true })

const facts = yaml.load(fs.readFileSync('facts.yaml', 'utf8'))
const factTemplate = ejs.compile(fs.readFileSync('fact.ejs', 'utf8'))

facts.forEach(fact => {
  const page = factTemplate({ fact })

  fs.writeFileSync(`_site/${fact.slug}`, page)
})

const indexTemplate = ejs.compile(fs.readFileSync('index.ejs', 'utf8'))
fs.writeFileSync(`_site/index.html`, indexTemplate({ facts }))

fs.cpSync('static', '_site/static', { recursive: true })
