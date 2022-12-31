import parse from '../index.js';
import test from 'tape';

test('whitespace should be whitespace', function (t) {
	t.plan(1);
	const x = parse(['-x', '\t']).x;
	t.equal(x, '\t');
});
