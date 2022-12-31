import test from 'tape'
import parse from '../src/index.js'

test('parse with modifier functions', function (t) {
    t.plan(1)

    const argv = parse(['-b', '123'], { boolean: 'b' })
    t.deepEqual(argv, { b: true, _: [123] })
})
