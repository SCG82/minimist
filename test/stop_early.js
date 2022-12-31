import parse from '../index.js';
import test from 'tape';

test('stops parsing on the first non-option when stopEarly is set', function (t) {
	const argv = parse(['--aaa', 'bbb', 'ccc', '--ddd'], {
		stopEarly: true,
	});

	t.deepEqual(argv, {
		aaa: 'bbb',
		_: ['ccc', '--ddd'],
	});

	t.end();
});
