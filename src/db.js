const is = require('check-more-types')
const la = require('lazy-ass')
const read = require('fs').readFileSync

function isPackageFile (str) {
  return /\/package\.json$/.test(str)
}

function updateCandidates (db, info) {
  la(is.object(db[info.name]), 'missing candidate', info)
  db[info.name].candidates.push(info.path)
  return db
}

function buildPackageDatabase (filenames, loadFile) {
  la(is.array(filenames), 'expected list of package filenames', filenames)
  loadFile = loadFile || read
  la(is.fn(loadFile), 'invalid load file', loadFile)

  const db = {}

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
        latestPath: undefined
      }
    }
    updateCandidates(db, info)
  })

  return db
}

module.exports = buildPackageDatabase
