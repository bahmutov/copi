const is = require('check-more-types')
const la = require('lazy-ass')
const fs = require('fs')
const debug = require('debug')('copi')

function saveData (filename, data) {
  la(is.unemptyString(filename), 'missing filename', filename)

  const withTimestamp = {
    data: data,
    timestamp: new Date()
  }
  fs.writeFileSync(filename, JSON.stringify(withTimestamp, null, 2), 'utf-8')
  debug('saved data to %s', filename)
  return data
}

function loadData (maxAge, filename) {
  la(is.unemptyString(filename), 'missing filename', filename)
  if (!fs.existsSync(filename)) {
    return null
  }
  const text = fs.readFileSync(filename, 'utf-8')
  const withTimestamp = JSON.parse(text)
  la(is.has(withTimestamp, 'timestamp'), 'missing timestamp', Object.keys(withTimestamp))

  const now = new Date()
  const elapsed = now - new Date(withTimestamp.timestamp)
  debug('cache age', elapsed, 'ms, maxAge', maxAge)
  if (elapsed > maxAge) {
    return null
  }

  la(is.has(withTimestamp, 'data'), 'missing data', Object.keys(withTimestamp))
  return withTimestamp.data
}

function makeCache (filename, maxAge) {
  return {
    save: saveData.bind(null, filename),
    load: loadData.bind(null, maxAge, filename)
  }
}

module.exports = makeCache
