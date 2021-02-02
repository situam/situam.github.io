import * as diff from './diff.js';

var assertEqual = function(a, b, msg) {
	if (JSON.stringify(a) !== JSON.stringify(b)) {
		console.warn('test failed:', msg || '', a, b);
	} else {
		console.log('test passed:', msg || '');
	}
};

var testChange = function(a, b) {
	var change = diff.diff(a, b, 3);
	var actual = diff.apply(a, change);
	assertEqual(actual, b, 'testChange:' + a);
};

testChange('', 'asd');
testChange('foobar', 'foobarbaz');
testChange('foobaz', 'foobarbaz');
testChange('barbaz', 'foobarbaz');
testChange('asd', 'as');

assertEqual(diff.diff('xxasdz', 'xxasz', 0), [4, 1, 'd', '']);
assertEqual(diff.diff('xxasdz', 'xxasz', 3), [1, 0, 'xasdz', 'xasz']);

assertEqual(diff.merge([1, 0, 'foobaz', 'foobbaz'], [2, 1, 'oobba', 'oobaba']), [[1, 0, 'foobaz', 'foobabaz']], 'merge insert');
assertEqual(diff.merge([1, 1, 'fooba', 'foba'], [0, 0, 'Xfobaz', 'Xfbaz']), [[0, 0, 'Xfoobaz', 'Xfbaz']], 'merge delete');
