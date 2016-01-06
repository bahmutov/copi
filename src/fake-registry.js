const la = require('lazy-ass')
const is = require('check-more-types')

const fs = require('fs')
const read = fs.readFileSync
const join = require('path').join
function getPackage (folder) {
  return JSON.parse(read(join(folder, 'package.json'), 'utf-8'))
}

const npm = require('npm-utils')
const fileShasum = require('./file-shasum')

function makeRegistry (find, options) {
  la(is.fn(find), 'missing find package function')

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
    const found = find(req.params.name)
    if (!found) {
      return res.status(404).send({})
    }
    debug('found package %s latest %s in %s',
      found.name, found.latest, found.folder)
    if (!found.name ||
      !found.latest ||
      !found.folder) {
      console.error('invalid found info', found)
      return res.status(404).send({})
    }
    la(is.unemptyString(options.url), 'missing server url in', options)

    const pkg = getPackage(found.folder)
    // add information about available versions
    pkg['dist-tags'] = {
      latest: found.latest
    }
    pkg.versions = {}

    const tarUrl = options.url + '/' + found.name + '/-/' + found.name + '-' + found.latest + '.tgz'

    npm.pack({ folder: found.folder })
      .then(function (tarballFilename) {
        debug('built tar archive for %s %s', found.name, tarballFilename)
        if (!tarballFilename) {
          return res.status(500).send({})
        }
        return fileShasum(tarballFilename)
          .then(function (shasum) {
            pkg.versions[found.latest] = {
              dist: {
                shasum: shasum,
                tarball: tarUrl
              }
            }
            // delete tar for now
            fs.unlinkSync(tarballFilename)
            res.json(pkg)
          })
      })
  }

  app.use(morgan('dev'))
  app.get('/:name', getPackageMetadata)

  return app
}

module.exports = makeRegistry
