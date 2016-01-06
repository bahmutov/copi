const express = require('express')
const morgan = require('morgan')
const app = express()
const debug = require('debug')('copi')

// see example metadata using command
// http http://registry.npmjs.org/foo
// it is like package.json with additional
// object "versions"
// with each key a valid version
// and "dist" object
/*
  "dist": {
    "shasum": "943e0ec03df00ebeb6273a5b94b916ba54b47581",
    "tarball": "http://registry.npmjs.org/foo/-/foo-1.0.0.tgz"
  }
*/
function getPackageMetadata (req, res) {
  debug('metadata for package', req.params.name)
  res.json({ foo: 'bar' })
}

app.use(morgan('dev'))
app.get('/:name', getPackageMetadata)

module.exports = app
