const is = require('check-more-types')
const la = require('lazy-ass')

/* global describe, it */
describe('cache in file', () => {
  const makeCache = require('./cache')

  it('is a function', () => {
    la(is.fn(makeCache))
  })
})
