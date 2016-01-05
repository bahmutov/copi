const debug = require('debug')('copi')
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

const fs = require('fs')
const exists = fs.existsSync
const join = require('path').join

function isSaveFlag (flag) {
  return is.string(flag) &&
    (flag === '-S' ||
      flag === '-D' ||
      flag === '--save' ||
      flag === '--save-dev')
}

function saveFlag (flags) {
  return is.array(flags) &&
    flags.some(isSaveFlag)
}

function setInstalledVersion (name, sourceFolder) {
  const packageFilename = join(process.cwd(), 'package.json')
  if (!exists(packageFilename)) {
    return
  }
  const sourceFilename = join(sourceFolder, 'package.json')
  if (!exists(sourceFolder)) {
    console.error('Cannot find package in', sourceFolder)
    return
  }
  const sourcePackage = JSON.parse(fs.readFileSync(sourceFilename, 'utf-8'))
  const sourceVersion = sourcePackage.version
  if (!is.unemptyString(sourceVersion)) {
    console.error('Invalid version in file', sourceFilename)
    return
  }
  const pkg = JSON.parse(fs.readFileSync(packageFilename, 'utf-8'))
  var changed
  if (pkg.dependencies && pkg.dependencies[name]) {
    pkg.dependencies[name] = sourceVersion
    changed = true
  }
  if (pkg.devDependencies && pkg.devDependencies[name]) {
    pkg.devDependencies[name] = sourceVersion
    changed = true
  }
  if (changed) {
    fs.writeFileSync(packageFilename, JSON.stringify(pkg, null, 2), 'utf-8')
    debug('saved updated version %s@%s in %s', name, sourceVersion, packageFilename)
  } else {
    debug('could not save updated version %s@%s in %s', name, sourceVersion, packageFilename)
  }
}

const filenamesCache = makeCache(__dirname + '/../.package-filenames.json', seconds(3600))
const packagesCache = makeCache(__dirname + '/../.packages.json', seconds(3600))

function loadDb (rootFolder) {
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

function install (options, db) {
  la(is.object(options), 'missing options', options)
  la(is.unemptyString(options.name), 'missing name', options)
  la(is.has(db, 'find'), 'missing find method in db')

  const found = db.find(options.name)

  if (!found || !found.latest) {
    console.error('Could not find locally installed "%s", using NPM to install', options.name)
    return npm.install({
      name: options.name,
      flags: options.flags
    })
  }
  console.log('found %s@%s among %d candidate(s)',
    options.name, found.latest, found.candidates.length)
  debug(found)

  la(is.unemptyString(found.folder), 'missing founder in found object', found)
  return npm.install({
    name: found.folder,
    flags: options.flags
  }).then(function () {
    if (saveFlag(options.flags)) {
      setInstalledVersion(options.name, found.folder)
    }
  })
}

function copi (options) {
  console.log('installing %s', options.name)

  const rootFolder = options.folder || process.cwd() + '/../'
  return loadDb(rootFolder)
    .then(install.bind(null, options))
    .catch(console.error.bind(console))
}

module.exports = copi
