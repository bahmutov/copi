const glob = require('glob-promise')
const is = require('check-more-types')
const la = require('lazy-ass')
const makeCache = require('./cache')
const db = require('./db')

function findPackageFiles (folder) {
  return glob(folder + '/*/node_modules/*/package.json')
}

function seconds (n) {
  return n * 1000
}

const filenamesCache = makeCache(__dirname + '/../.package-filenames.json', seconds(300))
const packagesCache = makeCache(__dirname + '/../.packages.json', seconds(300))

function copi (options) {
  console.log('installing %s', options.name)

  const rootFolder = options.folder || process.cwd() + '/../'
  return Promise.resolve(filenamesCache.load())
    .then(function (filenames) {
      if (!filenames) {
        return findPackageFiles(rootFolder)
          .then(function (filenames) {
            la(is.array(filenames), 'could not package filenames', filenames)
            console.log('found %d package filenames', filenames.length)
            return filenames
          })
      }
      console.log('using cached %d package filenames', filenames.length)
      return filenames
    })
    .then(filenamesCache.save)
    .then(db)
    .then(packagesCache.save)
    .catch(console.error.bind(console))
}

module.exports = copi
