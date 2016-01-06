const debug = require('debug')('copi')
const la = require('lazy-ass')
const is = require('check-more-types')
const npm = require('npm-utils')
const loadDb = require('./load-db')
const startRegistry = require('./start-registry')

la(is.fn(npm.install), 'missing npm.install method')

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

  return startRegistry(db.find)
    .then(function (registry) {
      return npm.install({
        name: found.name,
        flags: options.flags,
        registry: registry.url
      }).then(function () {
        debug('finished install', found.name)
        // if (saveFlag(options.flags)) {
        //   setInstalledVersion(options.name, found.folder)
        // }
      })
    })
}

function copi (options) {
  console.log('installing %s', options.name)
  return loadDb(options.folder)
    .then(install.bind(null, options))
    .catch(console.error.bind(console))
}

module.exports = copi
