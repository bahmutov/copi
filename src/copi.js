const debug = require('debug')('copi')
const la = require('lazy-ass')
const is = require('check-more-types')
const npm = require('npm-utils')
const loadDb = require('./load-db')

la(is.fn(npm.install), 'missing npm.install method')

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
  return loadDb(options.folder)
    .then(install.bind(null, options))
    .catch(console.error.bind(console))
}

module.exports = copi
