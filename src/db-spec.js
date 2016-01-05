const is = require('check-more-types')
const la = require('lazy-ass')

/* global describe, it */
describe('building db of packages', () => {
  const build = require('./db')

  const barPackage = {
    name: 'bar',
    version: '1.0.0'
  }
  const bar2Package = {
    name: 'bar',
    version: '1.2.0'
  }
  const bazPackage = {
    name: 'baz',
    version: '2.0.0'
  }
  const filesystem = {
    'some/path/bar/package.json': barPackage,
    'or/this/bar/package.json': bar2Package,
    'another/baz/package.json': bazPackage
  }
  const filenames = Object.keys(filesystem)

  const loadFile = (filename) => {
    return filesystem[filename]
  }

  it('is a function', () => {
    la(is.fn(build))
  })

  it('builds db from filenames', () => {
    const db = build(filenames, loadFile)
    la(is.object(db), 'returns an object', db)
  })

  it('can search', () => {
    const db = build(filenames, loadFile)
    la(is.fn(db.find), 'has find method')
  })

  it('can find the latest "bar"', () => {
    const db = build(filenames, loadFile)
    const found = db.find('bar')
    la(is.object(found), 'found an object', found)
    la(found.latest === bar2Package.version, 'wrong version', found)
  })

  it('can find the latest "baz"', () => {
    const db = build(filenames, loadFile)
    const found = db.find('baz')
    la(is.object(found), 'found an object', found)
    la(found.latest === bazPackage.version, 'wrong version', found)
  })

  it('can search several times', () => {
    const db = build(filenames, loadFile)
    const found1 = db.find('baz')
    la(found1.latest === bazPackage.version, 'wrong version', found1)
    const found2 = db.find('baz')
    la(found2.latest === bazPackage.version, 'wrong version', found2)
  })
})
