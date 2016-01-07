const glob = require('glob-promise')
const la = require('lazy-ass')
const is = require('check-more-types')
const makeCache = require('./cache')
const db = require('./db')
const npm = require('npm-utils')

la(is.fn(npm.install), 'missing npm.install method')

function findPackageFiles (folder) {
  return glob(folder + '/*/node_modules/*/package.json')
}

function seconds (n) {
  return n * 1000
}

const cacheFolder = __dirname + '/../'
const maxAge = seconds(600)
const filenamesCache = makeCache(cacheFolder + '.package-filenames.json', maxAge)
const packagesCache = makeCache(cacheFolder + '.packages.json', maxAge)

function loadDb (rootFolder) {
  rootFolder = rootFolder || process.cwd() + '/../'
  la(is.unemptyString(rootFolder), 'expected root folder', rootFolder)

  return Promise.resolve(packagesCache.load())
    .then(function (dbData) {
      if (!dbData) {
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
      }
      return db(dbData)
    })
}

module.exports = loadDb
