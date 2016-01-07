const debug = require('debug')('copi')
const la = require('lazy-ass')
const is = require('check-more-types')
const npm = require('npm-utils')
const fs = require('fs')
const fileShasum = require('./file-shasum')

// this is read-only registry inspired by
// https://github.com/nolanlawson/local-npm/blob/master/index.js

function makeRegistry (find, options) {
  la(is.fn(find), 'missing find package function')

  const express = require('express')
  const morgan = require('morgan')
  const app = express()

  function getTarball (req, res) {
    console.log('tarball for %s@%s', req.params.name, req.params.version)

    const found = find(req.params.name)
    if (!found) {
      return res.status(404).send({})
    }

    console.log('found package')
    console.log(found)

    debug('found package "%s" latest version %s, looking for version %s',
      found.name, found.latest, req.params.version)
    if (!found.name ||
      !found.latest ||
      !found.folder) {
      console.error('invalid found info', found)
      return res.status(404).send({})
    }

    la(is.object(found.versions) &&
      is.not.empty(found.versions), 'missing verions', found)
    if (!found.versions[req.params.version]) {
      console.error('Cannot find version %s@%s among %s',
        req.params.version, found.name, Object.keys(found.versions).join(','))
      return res.status(404).send({})
    }

    const folder = found.versions[req.params.version]
    la(is.unemptyString(folder), 'expected folder for version',
      req.params.version, 'in', found.versions)
    npm.pack(folder)
      .then(function (tarballFilename) {
        debug('built tar archive for %s@%s %s',
          found.name, req.params.version, tarballFilename)
        if (!tarballFilename) {
          console.error('cannot find tar', tarballFilename, 'from', folder)
          return res.status(500).send({})
        }

        const length = fs.statSync(tarballFilename).size
        res.set('content-type', 'application/octet-stream')
        res.set('content-length', length)
        const fileStream = fs.createReadStream(tarballFilename)
        fileStream.pipe(res)
        fileStream.on('end', function () {
          debug('sent tarball %s for %s@%s', tarballFilename,
            found.name, found.latest)
          fs.unlinkSync(tarballFilename)
        })
        fileStream.on('error', console.error.bind(console))
      })
  }

  function shaForPacked (folder) {
    return npm.pack({ folder: folder })
      .then(function (tarballFilename) {
        debug('built tar archive %s from folder %s', tarballFilename, folder)
        if (!tarballFilename) {
          throw new Error('Cannot tar folder ' + folder)
        }
        return fileShasum(tarballFilename)
          .then(function (shasum) {
            // delete tar for now
            fs.unlinkSync(tarballFilename)
            return shasum
          })
      })
  }

  // see example metadata using command
  // http http://registry.npmjs.org/foo
  // it is like package.json with additional
  // object "versions"
  // with each key a valid version
  // and "dist" object. The url format can be different
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

    const pkg = npm.getPackage(found.folder)
    // add information about available versions
    pkg['dist-tags'] = {
      latest: found.latest
    }
    pkg.versions = {}

    la(is.object(found.versions) && is.not.empty(found.versions),
      'cannot find versions in', found)
    const versions = Object.keys(found.versions)

    function versionInfo (version) {
      const folder = found.versions[version]
      return shaForPacked(folder)
        .then(function (shasum) {
          const tarUrl = options.url + '/tarballs/' + found.name + '/' + version + '.tgz'
          return {
            version: version,
            shasum: shasum,
            tarball: tarUrl
          }
        })
    }

    Promise.all(versions.map(versionInfo))
      .then(function (distInfos) {
        la(is.array(distInfos), 'could not compute shas', distInfos)
        distInfos.forEach(function (dist) {
          pkg.versions[dist.version] = {
            dist: dist
          }
        })
        res.json(pkg)
      })
  }

  app.use(morgan('dev'))
  // the only registry API needed
  app.get('/:name', getPackageMetadata)
  app.get('/tarballs/:name/:version.tgz', getTarball)

  return app
}

module.exports = makeRegistry
