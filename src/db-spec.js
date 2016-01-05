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
    console.log(db)
  })
})
