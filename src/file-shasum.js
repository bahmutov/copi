const fs = require('fs')
const crypto = require('crypto')
const la = require('lazy-ass')
const is = require('check-more-types')

function computeShasum (filename) {
  la(is.unemptyString(filename), 'expected filename')
  return new Promise(function (resolve) {
    const fd = fs.createReadStream(filename)
    const hash = crypto.createHash('sha1')
    hash.setEncoding('hex')

    fd.on('end', () => {
      hash.end()
      resolve(hash.read())
    })
    fd.pipe(hash)
  })
}

module.exports = computeShasum

if (!module.parent) {
  computeShasum(__filename)
    .then(function (shasum) {
      console.log('%s - shasum %s', __filename, shasum)
    })
    .catch(console.error.bind(console))
}
