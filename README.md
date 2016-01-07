# copi
> Installs NPM package by finding it and copying from another local folder. Completely offline ;)

[![NPM][copi-icon] ][copi-url]

[![Build status][copi-ci-image] ][copi-ci-url]
[![semantic-release][semantic-image] ][semantic-url]

## Install

    npm install -g copi

## Use

    copi <module name>
    copi <module name> --save | --save-dev | -S | -D

If an existing local copy of `<module name>` is not found, `copi` calls standard
`npm install <module name> <flags ...>` automatically.

See `copi` in action below: installing a local project, then handling new project and
installing it from the registry

[![asciicast](https://asciinema.org/a/33013.png)](https://asciinema.org/a/33013)

## Limitation

If the package to be installed is not found locally, `copi` starts the regular
`npm install` command; there is nothing we can do offline if we don't have the data.

Some packages run `prepublish` step which might fail in the already installed folder,
when `copi` tries to pack them for install. These packages cannot be packed correctly
and cannot be installed, sorry.

## What?!

After surveying developers, I found that most have a single folder with bunch of projects,
each using NPM packages. Thus we have the directory structure looking like this

    /dev
        /projectA
            package.json
            /node_modules
                /lodash
                /async
        /projectB
            package.json
            /node_modules
                /lazy-ass
                /check-more-types

Imagine we start a new project "projectC", and it needs module "async". We can quickly
install it using `npm install /dev/projectA/node_modules/async` **if we knew where it was!**

`copi` finds all the packages already installed, and finds the latest version of the one
needed (lazily). Thus the installation is offline.

    copi -S lodash
    found lodash@3.0.6 among 1 candidate(s)
    installing /dev/projectA/node_modules/lodash
    projectC@1.0.0 /dev/projectC
    └── lodash@3.0.6

## Details

The found packages are stored in a temp file, which will be updated if it is older than N hours,
ensuring newly installed packages are discovered eventually.

The wildcard that searches for all installed packages looks at the working folder's parent,
and then down two levels. Should discover most of the packages without spending more than a
couple of seconds (if the cache of filenames is old or non-existent).

To avoid going to NPM for nested dependencies, `copi` spins a simple read-only NPM
registry server *while copi is running*. 
Thus `npm install` command goes back to `copi` for additional packages,
making sure we find those locally.

### Small print

Author: Gleb Bahmutov &copy; 2016

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](http://glebbahmutov.com)
* [blog](http://glebbahmutov.com/blog/)

License: MIT - do anything with the code, but don't blame me if it does not work.

Spread the word: tweet, star on github, etc.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/copi/issues) on Github

## MIT License

Copyright (c) 2016 Gleb Bahmutov

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

[copi-icon]: https://nodei.co/npm/copi.png?downloads=true
[copi-url]: https://npmjs.org/package/copi
[copi-ci-image]: https://travis-ci.org/bahmutov/copi.png?branch=master
[copi-ci-url]: https://travis-ci.org/bahmutov/copi
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
