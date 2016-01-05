#!/usr/bin/env node --harmony

function isNotWord (word, str) {
  return word !== str
}

const removeInstall = isNotWord.bind(null, 'install')
const removeI = isNotWord.bind(null, 'i')

const args = process.argv
  .filter(removeInstall)
  .filter(removeI)

require('simple-bin-help')({
  minArguments: 1,
  packagePath: __dirname + '/../package.json',
  help: 'use: copi <npm package name>'
}, args)

const name = args[2]
console.log('installing %s', name)

