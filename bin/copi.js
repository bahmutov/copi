#!/usr/bin/env node --harmony

function isWord (word, str) {
  return word === str
}

const installWord = isWord.bind(null, 'install')
const installWord = isWord.bind(null, 'i')

const args = process.argv
  .filter(installWord)
  .filter(iWord)

require('simple-bin-help')({
  minArguments: 1,
  packagePath: __dirname + '/../package.json',
  help: 'use: copi <npm package name>'
}, args)

const name = args[0]
console.log('installing %s', name)

