const path = require('path');
const CHARS = { '{': '}', '(': ')', '[': ']'};
const STRICT = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\)|(\\).|([@?!+*]\(.*\)))/;
const RELAXED = /\\(.)|(^!|[*?{}()[\]]|\(\?)/;

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

  while (match = rgx.exec(str)) {
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
function parse(str, opts) {
  // unescape character sequences & split by path separators
  const segs = str.replace(/\\([\*\?\|\[\]\(\)\{\}])/g, '$1').split(/\/|\\+/g);
  const rgx = /(^|[^\\])([\{\[]|\([^\)]+$)/; // dunno what this is
  const strict = !!opts.strict;

  let i=0, out='', tmp, isGlob;

  if (segs[0] == '') {
    segs.shift();
    out += '/';
  }

  for (; i < segs.length; i++) {
    tmp = segs[i];
    if (isglob(tmp, { strict })) {
      isGlob = true;
      break;
    } else if (rgx.test(tmp)) {
      break;
    } else {
      out = path.join(out, tmp);
    }
  }

  return {
    isGlob: !!isGlob,
    glob: segs.slice(i).join('/'),
    base: path.normalize(out).replace(/\/|\\/, '/')
  };
};


/**
 * Parse a glob path, and split it by static/glob part
 * @param {String} pattern String path
 * @param {Object} [opts] Options
 * @param {Object} [opts.strict=false] Use strict parsing
 * @returns {Object} object with parsed path
 */
function globalyzer(pattern, opts = {}) {
  console.log(`RECEIVED: "${pattern}"`);
  let { base, isGlob, glob } = parse(pattern, opts);
  console.log(`~> base: "${base}"`);
  console.log(`~> glob: "${glob}"`);
  console.log(`~> isGlob: "${isGlob}"`);

  if (!isGlob) {
    let obj = path.parse(base);
    base = obj.dir || '.';
    glob = obj.base;
  }

  glob = glob.replace(/^(.\/|\/)/, '');
  console.log(`~> sending "${base}" + "${glob}"`);

  return { base, glob, isGlob };
}


module.exports = globalyzer;
