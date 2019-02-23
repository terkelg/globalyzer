const path = require('path');
const CHARS = { '{': '}', '(': ')', '[': ']'};
const STRICT = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\)|(\\).|([@?!+*]\(.*\)))/;
const RELAXED = /\\(.)|(^!|[*?{}()[\]]|\(\?)/;
const TRIM = /^(.\/|\/)/;

/**
 * Detect if a string cointains glob
 * @param {String} str Input string
 * @param {Object} [options] Configuration object
 * @param {Boolean} [options.strict=true] Use relaxed regex if true
 * @returns {Boolean} true if string contains glob
 */
function isglob(str, { strict = true } = {}) {
  if (str === '') return false;
  let match, rgx = strict ? STRICT : RELAXED;

  while ((match = rgx.exec(str))) {
    if (match[2]) return true;
    let idx = match.index + match[0].length;

    // if an open bracket/brace/paren is escaped,
    // set the index to the next closing character
    let open = match[1];
    let close = open ? CHARS[open] : null;
    if (open && close) {
      let n = str.indexOf(close, idx);
      if (n !== -1)  idx = n + 1;
    }

    str = str.slice(idx);
  }
  return false;
}


/**
 * Find the static part of a glob-path,
 * split path and return path part
 * @param {String} str Path/glob string
 * @returns {String} static path section of glob
 */
function parent(str, { strict = false } = {}) {
  str = path.normalize(str).replace(/\/|\\/, '/');

  // special case for strings ending in enclosure containing path separator
  if (/[\{\[].*[\/]*.*[\}\]]$/.test(str)) str += '/';

  // preserves full path in case of trailing path separator
  str += 'a';

  do {str = path.dirname(str)}
  while (isglob(str, {strict}) || /(^|[^\\])([\{\[]|\([^\)]+$)/.test(str));

  // remove escape chars and return result
  return str.replace(/\\([\*\?\|\[\]\(\)\{\}])/g, '$1');
};


/**
 * Parse a glob path, and split it by static/glob part
 * @param {String} pattern String path
 * @param {Object} [opts] Options
 * @param {Object} [opts.strict=false] Use strict parsing
 * @returns {Object} object with parsed path
 */
function globalyzer(pattern, opts = {}) {
  let base = parent(pattern, opts);
  let isGlob = isglob(pattern, opts);
  let glob;

  if (base != '.') {
    glob = pattern.replace(TRIM, '').substr(base.replace(TRIM, '').length);
  } else {
    glob = pattern;
  }

  if (!isGlob) {
    base = path.dirname(pattern);
    glob = base !== '.' ? pattern.substr(base.length) : pattern;
  }

  glob = glob.replace(TRIM, '');

  return { base, glob, isGlob };
}


module.exports = globalyzer;
