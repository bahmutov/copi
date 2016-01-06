function start () {
  const app = require('./fake-registry')

  return new Promise(function (resolve) {
    const server = app.listen(function () {
      const port = server.address().port
      const url = 'http://localhost:' + port
      console.log('Started registry app at %s', url)
      resolve({
        url: url,
        server: server
      })
    })
  })
}

module.exports = start

if (!module.parent) {
  !(function tryRegistry () {
    start()
      .then(function (info) {
        console.log('running registry server at', info.url)
        const npm = require('npm-utils')
        npm.install({
          name: 'foo',
          registry: info.url,
          flags: ['--verbose']
        })
      })
      .catch(console.error.bind(console))
  }())
}
