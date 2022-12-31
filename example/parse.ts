import parseArgs from '../src/index.js'

const argv = parseArgs(process.argv.slice(2))
console.log(argv)
