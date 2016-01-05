#!/usr/bin/env node --harmony

function isNotWord (word, str) {
  return word !== str
}

function isFlag (s) {
  return typeof s === 'string' &&
    s[0] === '-'
}

function removeFlag (s) {
  return !isFlag(s)
}

const removeInstall = isNotWord.bind(null, 'install')
const removeI = isNotWord.bind(null, 'i')
const removeNode = (s) => {
  return s !== 'node' && !/bin\/node$/.test(s)
}
const removeCopi = (s) => {
  return !/bin\/copi$/.test(s)
}

const args = process.argv
  .filter(removeNode)
  .filter(removeCopi)
  .filter(removeInstall)
  .filter(removeI)
  .filter(removeFlag)

const flags = process.argv
  .filter(isFlag)

require('simple-bin-help')({
  minArguments: 1,
  packagePath: __dirname + '/../package.json',
  help: 'use: copi <npm package name>'
}, args)

const name = args[0]
require(__dirname + '/..')({
  name: name,
  flags: flags
})

