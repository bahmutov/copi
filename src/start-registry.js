const is = require('check-more-types')
const la = require('lazy-ass')

function start (find) {
  la(is.fn(find), 'expected find function')

  const options = {}
  const makeRegistry = require('./fake-registry')
  const app = makeRegistry(find, options)

  return new Promise(function (resolve) {
    const server = app.listen(function () {
      const port = server.address().port
      const url = 'http://localhost:' + port
      console.log('Started registry app at %s', url)
      options.url = url
      options.server = server
      resolve(options)
    })
  })
}

module.exports = start

if (!module.parent) {
  !(function tryRegistry () {
    const loadDb = require('./load-db')
    loadDb()
      .then(function (db) {
        start(db.find)
          .then(function (info) {
            console.log('running registry server at', info.url)
            const npm = require('npm-utils')
            npm.install({
              name: 'ms@0.6.2',
              registry: info.url
              // flags: ['--verbose']
            })
          })
          .catch(console.error.bind(console))
      })
  }())
}
