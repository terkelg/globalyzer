test = require('tape');
const $ = require('../src');

test('standard', t => {
  t.equal(typeof $, 'function', 'constructor is a typeof function');
  t.end();
});

test('base', t => {
  [
    // should strip glob magic to return parent path
    ['.', '.'],
    ['.*', '.'],
    ['/.*', '/'],
    ['/.*/', '/'],
    ['a/.*/b', 'a'],
    ['a*/.*/b', '.'],
    ['*/a/b/c', '.'],
    ['*', '.'],
    ['*/', '.'],
    ['*/*', '.'],
    ['*/*/', '.'],
    ['**', '.'],
    ['**/', '.'],
    ['**/*', '.'],
    ['**/*/', '.'],
    ['/*.js', '/'],
    ['*.js', '.'],
    ['**/*.js', '.'],
    ['{a,b}', '.'],
    ['/{a,b}', '/'],
    ['/{a,b}/', '/'],
    ['(a|b)', '.'],
    ['/(a|b)', '/'],
    ['./(a|b)', '.'],
    ['a/(b c)', 'a', 'not an extglob'],
    ['a/(b c)/d', 'a/(b c)', 'not an extglob'],
    ['path/to/*.js', 'path/to'],
    ['/root/path/to/*.js', '/root/path/to'],
    ['chapter/foo [bar]/', 'chapter'],
    ['path/[a-z]', 'path'],
    ['path/{to,from}', 'path'],
    ['path/(to|from)', 'path'],
    //['path/(foo bar)/subdir/foo.*', 'path/(foo bar)/subdir'],
    ['path/!(to|from)', 'path'],
    ['path/?(to|from)', 'path'],
    ['path/+(to|from)', 'path'],
    ['path/*(to|from)', 'path'],
    ['path/@(to|from)', 'path'],
    ['path/!/foo', 'path/!'],
    ['path/?/foo', 'path/?'],
    ['path/+/foo', 'path/+'],
    ['path/*/foo', 'path'],
    ['path/@/foo', 'path/@'],
    ['path/!/foo/', 'path/!'],
    ['path/?/foo/', 'path/?'],
    ['path/+/foo/', 'path/+'],
    ['path/*/foo/', 'path'],
    //['path/@/foo/', 'path/@/foo'],
    ['path/**/*', 'path'],
    ['path/**/subdir/foo.*', 'path'],
    ['path/subdir/**/foo.js', 'path/subdir'],
    ['path/!subdir/foo.js', 'path/!subdir'],
    // should respect escaped characters
    ['path/\\*\\*/subdir/foo.*', 'path/**/subdir'],
    ['path/\\[\\*\\]/subdir/foo.*', 'path/[*]/subdir'],
    ['path/\\*(a|b)/subdir/foo.*', 'path'],
    ['path/\\*/(a|b)/subdir/foo.*', 'path/*'],
    ['path/\\*\\(a\\|b\\)/subdir/foo.*', 'path/*(a|b)/subdir'],
    ['path/\\[foo bar\\]/subdir/foo.*', 'path/[foo bar]/subdir'],
    ['path/\\[bar]/', 'path'],
    ['path/foo \\[bar]/', 'path'],
    // should return parent dirname from non-glob paths
    ['path', '.'],,
    ['path/foo', 'path'],
    ['path/foo/', 'path'],
    ['path/foo/bar.js', 'path/foo'],
    ['path', '.'],
    ['path/foo', 'path'],
    ['path/foo/', 'path'],
    ['path/foo/bar.js', 'path/foo'],
    // glob2base test patterns
    ['js/*.js', 'js'],
    ['js/**/test/*.js', 'js'],
    ['js/test/wow.js', 'js/test'],
    ['js/test/wow.js', 'js/test'],
    ['js/t[a-z]st}/*.js', 'js'],
    ['js/{src,test}/*.js', 'js'],
    ['js/test{0..9}/*.js', 'js'],
    ['js/t+(wo|est)/*.js', 'js'],
    ['js/t(wo|est)/*.js', 'js'],
    ['js/t/(wo|est)/*.js', 'js/t'],
    // should get a base name from a complex brace glob
    ['lib/{components,pages}/**/{test,another}/*.txt', 'lib'],
    ['js/test/**/{images,components}/*.js', 'js/test'],
    ['ooga/{booga,sooga}/**/dooga/{eooga,fooga}', 'ooga']
  ].forEach(([x, y]) => {
    t.is($(x).base, y);
  });

  t.end();
});

test('glob', t => {
  [
    ['', ''],
    ['*', '*'],
    ['.*', '.*'],
    ['/.*', '.*'],
    ['path/**/*', '**/*'],
    ['/path/**/*', '**/*'],
    ['root/(foo|bar)/path/**/*', '(foo|bar)/path/**/*'],
    ['@(test)/root/(foo|bar)/path/**/*', '@(test)/root/(foo|bar)/path/**/*'],
  ].forEach(([x, y]) => {
    t.is($(x).glob, y);
  });

  t.end();
})

test('isGlob', t => {
  // should be true if it is a glob pattern
  ['*.js', '!*.js', '!foo', '!foo.js', '**/abc.js', 'abc/*.js', '@.(?:abc)', '@.(?!abc)'].forEach(x => {
    t.true($(x).isGlob);
  });

  // should not match escaped globs
  ['\\!\\*.js', '\\!foo', '\\!foo.js', '\\*(foo).js', '\\*.js', '\\*\\*/abc.js', 'abc/\\*.js'].forEach(x => {
    t.false($(x).isGlob);
  });
  
  // should be false if it is not a glob pattern
  ['', '~/abc', '~/abc', '~/(abc)', '+~(abc)', '.', '@.(abc)', 'aa', 'who?', 'why!?', 'where???',
  'abc!/def/!ghi.js', 'abc.js', 'abc/def/!ghi.js', 'abc/def/ghi.js'].forEach(x => {
    t.false($(x).isGlob);
  });

  // should be true if the path has a regex capture group
	['abc/(?!foo).js', 'abc/(?:foo).js', 'abc/(?=foo).js', 'abc/(a|b).js', 'abc/(a|b|c).js', 'abc/(foo bar)/*.js'].forEach(x => {
    t.true($(x).isGlob);
  });

	// should be true if the path has parens but is not a valid capture group
  ['abc/(?foo).js', 'abc/(a b c).js', 'abc/(ab).js', 'abc/(abc).js', 'abc/(foo bar).js'].forEach(x => {
    //t.true($(x).isGlob);
  });

  // should be false if the capture group is imbalanced
  ['abc/(?ab.js', 'abc/(ab.js', 'abc/(a|b.js', 'abc/(a|b|c.js'].forEach(x => {
    t.false($(x).isGlob);
  });

	// should be false if the group is escaped
  ['abc/\\(a|b).js', 'abc/\\(a|b|c).js'].forEach(x => {
    t.false($(x).isGlob);
  });

	// should be true if glob chars exist and `options.strict` is false
	[
    '$(abc)',
    '&(abc)',
    '? (abc)',
    '?.js',
    'abc/(?ab.js',
    'abc/(ab.js',
    'abc/(a|b.js',
    'abc/(a|b|c.js',
    'abc/(foo).js',
    'abc/?.js',
    'abc/[1-3.js',
    'abc/[^abc.js',
    'abc/[abc.js',
    'abc/foo?.js',
    'abc/{abc.js',
    'Who?.js'
  ].forEach(x => {
    t.true($(x, {strict: false}).isGlob);
  });

  // should be false if the first delim is escaped and options.strict is false
  [
    ['abc/\\(a|b).js'],
    ['abc/(a|b\\).js', true],
    ['abc/\\(a|b|c).js'],
    ['abc/\\(a|b|c.js'],
    ['abc/\\[abc].js'],
    ['abc/\\[abc.js']
  ].forEach(([x, y]) => {
    t.false($(x, {strict: y || false}).isGlob);
  });

  t.true($('abc/(a|b\\).js', {strict: false}));
 
  // should be true if the path has a regex character class
  ['abc/[abc].js', 'abc/[^abc].js', 'abc/[1-3].js'].forEach(x => {
    t.true($(x).isGlob);
  });

	// should be false if the character class is not balanced
  ['abc/[abc.js', 'abc/[^abc.js', 'abc/[1-3.js'].forEach(x => {
    t.false($(x).isGlob);
  });

	// should be false if the character class is escaped
  ['abc/\\[abc].js', 'abc/\\[^abc].js', 'abc/\\[1-3].js'].forEach(x => {
    t.false($(x).isGlob);
  });

  // should be true if the path has brace characters
	['abc/{a,b}.js', 'abc/{a..z}.js', 'abc/{a..z..2}.js'].forEach(x => {
    t.true($(x).isGlob);
  });

	// should be false if (basic) braces are not balanced
	['abc/\\{a,b}.js', 'abc/\\{a..z}.js', 'abc/\\{a..z..2}.js'].forEach(x => {
    t.false($(x).isGlob);
  });

  // should not be true if the path has regex characters
	['$(abc)', '&(abc)', 'Who?.js', '? (abc)', '?.js', 'abc/?.js'].forEach(x => {
    t.false($(x).isGlob);
  });

  [
    '!&(abc)',
    '!*.js',
    '!foo',
    '!foo.js',
    '**/abc.js',
    '*.js',
    '*z(abc)',
    '[1-10].js',
    '[^abc].js',
    '[a-j]*[^c]b/c',
    '[abc].js',
    'a/b/c/[a-z].js',
    'abc/(aaa|bbb).js',
    'abc/*.js',
    'abc/{a,b}.js',
    'abc/{a..z..2}.js',
    'abc/{a..z}.js'
  ].forEach(x => {
    t.true($(x).isGlob);
  });

  // should be false if regex characters are escaped
  [
    '\\?.js',
    '\\[1-10\\].js',
    '\\[^abc\\].js',
    '\\[a-j\\]\\*\\[^c\\]b/c',
    '\\[abc\\].js',
    '\\a/b/c/\\[a-z\\].js',
    'abc/\\(aaa|bbb).js',
    'abc/\\?.js'
  ].forEach(x => {
    t.false($(x).isGlob);
  });

  // should be true if it has an extglob
  [
    'abc/!(a).js',
    'abc/!(a|b).js',
    'abc/(ab)*.js',
    'abc/(a|b).js',
    'abc/*(a).js',
    'abc/*(a|b).js',
    'abc/+(a).js',
    'abc/+(a|b).js',
    'abc/?(a).js',
    'abc/?(a|b).js',
    'abc/@(a).js',
    'abc/@(a|b).js'
  ].forEach(x => {
    t.true($(x).isGlob);
  });

	// should be false if extglob characters are escaped
  [
    'abc/\\*.js',
    'abc/\\*\\*.js',
    'abc/\\@(a).js',
    'abc/\\!(a).js',
    'abc/\\+(a).js',
    'abc/\\*(a).js',
    'abc/\\?(a).js'
  ].forEach(x => {
    t.false($(x).isGlob);
  });

  [
    'abc/\\@(a|b).js',
    'abc/\\!(a|b).js',
    'abc/\\+(a|b).js',
    'abc/\\*(a|b).js',
    'abc/\\?(a|b).js',
    'abc/\\@(a\\|b).js',
    'abc/\\!(a\\|b).js',
    'abc/\\+(a\\|b).js',
    'abc/\\*(a\\|b).js',
    'abc/\\?(a\\|b).js'
  ].forEach(x => {
    t.true($(x).isGlob);
  });

	// should not return true for non-extglob parens
	t.false($('C:/Program Files (x86)/').isGlob);

	// should be true if it has glob characters and is not a valid path
	['abc/[*].js', 'abc/*.js'].forEach(x => t.true($(x).isGlob));

  // should be false if it is a valid non-glob path
  [
    'abc/?.js',
    'abc/!.js',
    'abc/@.js',
    'abc/+.js'
  ].forEach(x => {
    t.false($(x).isGlob);
  });

  // should return true when the string has an extglob
  [
    '?(abc)',
    '@(abc)',
    '!(abc)',
    '*(abc)',
    '+(abc)',
    'xyz/?(abc)/xyz',
    'xyz/@(abc)/xyz',
    'xyz/!(abc)/xyz',
    'xyz/*(abc)/xyz',
    'xyz/+(abc)/xyz',
    '?(abc|xyz)/xyz',
    '@(abc|xyz)',
    '!(abc|xyz)',
    '*(abc|xyz)',
    '+(abc|xyz)'
  ].forEach(x => {
    t.true($(x).isGlob);
  });

  // should not match escaped extglobs
  [
    '\\?(abc)',
    '\\@(abc)',
    '\\!(abc)',
    '\\*(abc)',
    '\\+(abc)',
    'xyz/\\?(abc)/xyz',
    'xyz/\\@(abc)/xyz',
    'xyz/\\!(abc)/xyz',
    'xyz/\\*(abc)/xyz',
    'xyz/\\+(abc)/xyz'
  ].forEach(x => {
    t.false($(x).isGlob);
  });

  // should detect when an glob is in the same pattern as an escaped glob
  [
    '\\?(abc|xyz)/xyz',
    '\\@(abc|xyz)',
    '\\!(abc|xyz)',
    '\\*(abc|xyz)',
    '\\+(abc|xyz)',
    '\\?(abc)/?(abc)',
    '\\@(abc)/@(abc)',
    '\\!(abc)/!(abc)',
    '\\*(abc)/*(abc)',
    '\\+(abc)/+(abc)',
    'xyz/\\?(abc)/xyz/def/?(abc)/xyz',
    'xyz/\\@(abc)/xyz/def/@(abc)/xyz',
    'xyz/\\!(abc)/xyz/def/!(abc)/xyz',
    'xyz/\\*(abc)/xyz/def/*(abc)/xyz',
    'xyz/\\+(abc)/xyz/def/+(abc)/xyz',
    '\\?(abc|xyz)/xyz/?(abc|xyz)/xyz',
    '\\@(abc|xyz)/@(abc|xyz)',
    '\\!(abc|xyz)/!(abc|xyz)',
    '\\*(abc|xyz)/*(abc|xyz)',
    '\\+(abc|xyz)/+(abc|xyz)'
  ].forEach(x => {
    t.true($(x).isGlob);
  });

  t.end();
});
