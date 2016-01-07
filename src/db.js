const debug = require('debug')('copi')
const is = require('check-more-types')
const la = require('lazy-ass')
const readSync = require('fs').readFileSync
const exists = require('fs').existsSync
const dirname = require('path').dirname
const semver = require('semver')

function readPackage (filename) {
  if (!exists(filename)) {
    return
  }
  return JSON.parse(readSync(filename, 'utf-8'))
}

function isPackageFile (str) {
  return /\/package\.json$/.test(str)
}

function updateCandidates (db, info) {
  la(is.object(db[info.name]), 'missing candidate', info)
  db[info.name].candidates.push(info.path)
  return db
}

function isLaterVersion (a, b) {
  la(is.semver(a), 'not semver', a)
  la(is.semver(b), 'not semver', b)
  return semver.gt(a, b)
}

function addCandidateInfo (info, path, version) {
  la(is.object(info.versions), 'cannot find versions in', info)
  la(is.unemptyString(path), 'expected path', path)
  la(is.semver(version), 'expected semver', version)

  const folder = dirname(path)

  if (!info.latest || isLaterVersion(version, info.latest)) {
    info.latest = version
    info.folder = folder
  }

  if (!info.versions[version]) {
    info.versions[version] = folder
  }

  return info
}

// lazy finding - returns all versions
function find (db, loadFile, name) {
  la(is.unemptyString(name), 'missing package to find', name)
  const info = db[name]
  if (!info) {
    // cannot find package with this name in DB
    return null
  }
  la(info.name === name, 'different name, searching for %s, found %s',
    name, info.name)

  if (info.latest) {
    debug('found latest version for %s', name)
    return info
  }

  la(is.object(info.versions), 'expected object with versions', info)
  if (is.not.empty(info.versions)) {
    debug('returning prefilled info for candidate', name)
    return info
  }

  la(is.array(info.candidates), 'info for', name, 'has not candidates', info)
  debug('filtering candidates for "%s" among %d candidates',
    name, info.candidates.length)

  info.candidates.forEach(function (candidatePath) {
    const pkg = loadFile(candidatePath)
    if (!is.object(pkg)) {
      console.error('could not read %s', candidatePath)
      return
    }
    if (!is.semver(pkg.version)) {
      console.error('could not read semver from %s got', candidatePath, pkg.version)
      return
    }
    addCandidateInfo(info, candidatePath, pkg.version)
  })
  return info
}

function buildPackageDatabase (filenames, loadFile) {
  loadFile = loadFile || readPackage
  la(is.fn(loadFile), 'invalid load file', loadFile)

  const db = is.object(filenames) ? filenames : {}
  db.find = find.bind(null, db, loadFile)
  if (is.object(filenames)) {
    // done, we are just restoring an object
    return db
  }

  la(is.array(filenames), 'expected list of package filenames', filenames)
  const infos = filenames.map(function (filename) {
    la(isPackageFile(filename), 'not a package filename', filename)
    const parts = filename.split('/')
    return {
      name: parts[parts.length - 2],
      path: filename
    }
  })
  // console.log(infos)

  infos.forEach(function (info) {
    if (!db[info.name]) {
      db[info.name] = {
        name: info.name,
        candidates: [],
        latest: undefined,
        folder: undefined,
        versions: {}
      }
    }
    updateCandidates(db, info)
  })

  return db
}

module.exports = buildPackageDatabase
