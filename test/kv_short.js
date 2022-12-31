import test from 'tape'
import parse from '../src/index.js'

test('short -k=v', function (t) {
    t.plan(1)

    const argv = parse(['-b=123'])
    t.deepEqual(argv, { b: 123, _: [] })
})

test('multi short -k=v', function (t) {
    t.plan(1)

    const argv = parse(['-a=whatever', '-b=robots'])
    t.deepEqual(argv, { a: 'whatever', b: 'robots', _: [] })
})
