/** 
 * @module merked/split 
 */

'use strict';

const fs = require('fs');


const isSafe = function(number) {
  return Number.MIN_SAFE_INTEGER <= number
    && number <= Number.MAX_SAFE_INTEGER;
};

const isDefined = function(property, object) {
  return property in object
    && object[property] !== undefined
    && object[property] !== null;
};

const checkOptions = function(_options) {
  const options = {};

  if (typeof _options !== 'object' || _options === null) {
    throw new TypeError('Options must be an object');
  }

  let byLines = isDefined('lines', _options);
  let byBytes = isDefined('bytes', _options);
  let byLineBytes = isDefined('line_bytes', _options);

  if ((byLines && byBytes)
    || (byBytes && byLineBytes)
    || (byLines && byLineBytes)) {
    throw new Error('Cannot split in more than one way');
  }

  if (!byLines && !byBytes && !byLineBytes) {
    throw new Error('Splitting way is not specified');
  }

  if (byLines) {
    if (isNaN(_options.lines)
      || !isSafe(_options.lines) || _options.lines < 1) {
      throw new Error('Invalid number of lines');
    }

    options.lines = Math.floor(_options.lines);
  }

  if (byBytes || byLineBytes) {
    const size = byBytes ? _options.bytes : _options.line_bytes;

    if (isNaN(size)) {
      const result = /^(\d+)(KB|MB|K|M)$/i.exec(size);

      if (result === null) {
        throw new Error('Invalid number of bytes');
      }

      const unit = (function(x) {
        switch (x) {
          case 'k': case 'K':   return 1024;
          case 'm': case 'M':   return 1048576;
          case 'kb': case 'KB': return 1000;
          case 'mb': case 'MB': return 1000000;
        }
      })(result[2]);

      if (!isSafe(result[1] * unit)) {
        throw new Error('Invalid number of bytes');
      }

      options[byBytes ? 'bytes' : 'line_bytes'] = result[1] * unit;
    } else {
      if (!isSafe(size) || size < 1) {
        throw new Error('Invalid number of bytes');
      }

      options[byBytes ? 'bytes' : 'line_bytes'] = Math.floor(size);
    }
  }

  if (isDefined('prefix', _options)) {
    options.prefix = '' + _options.prefix;

    if (isDefined('suffix_length', _options)) {
      if (!isSafe(_options.suffix_length) || _options.suffix_length < 1) {
        throw new Error('Invalid suffix length');
      }

      options.suffix_length = Math.floor(_options.suffix_length);
    }

    if (isDefined('numeric_suffixes', _options)) {
      if (!isSafe(_options.numeric_suffixes) || _options.numeric_suffixes < 0) {
        throw new Error('');
      }

      options.numeric_suffixes = Math.floor(_options.numeric_suffixes);
    }

    options.additional_suffix = isDefined('additional_suffix', _options)
      ? _options.additional_suffix + ''
      : '';
  }

  return options;
};

const getSuffixLength = function(length, symbolLength) {
  let count = 0;
  for (; length = Math.floor(length / symbolLength); ++count) {}
  return count;
};

const replicate = function(length, value) {
  const array = new Array(length);
  for (let i = 0; i < length; ++i) {
    array[i] = value;
  }
  return array;
};

const createFilenames = function(size, options) {
  if (isDefined('numeric_suffixes', options)) {
    if (!isSafe(options.numeric_suffixes + size - 1)) {
      throw new Error(''); // TODO
    }

    if (isDefined('suffix_length', options)) {
      if (options.suffix_length < getSuffixLength(size, 10)) {
        throw new Error(''); // TODO
      }
    } else {
      options.suffix_length = Math.max(getSuffixLength(size, 10), 2);
    }

    let padding = replicate(options.suffix_length, '0').join('');
    let filenames = new Array(size);

    for (let i = 0; i < size; ++i) {
      filenames[i] = options.prefix
        + (padding + (options.numeric_suffixes + i))
          .slice(-options.suffix_length)
        + options.additional_suffix;
    }

    return filenames;
  }

  const alphabet = 'abcdefghijklmnopqrstuvwxyz';

  if (isDefined('suffix_length', options)) {
    if (options.suffix_length < getSuffixLength(size, alphabet.length)) {
      throw new Error('output file suffixes exhausted');
    }
  } else {
    options.suffix_length
      = Math.max(getSuffixLength(size, alphabet.length), 2);
  }

  let padding = replicate(options.suffix_length, 'a').join('');
  let filenames = [];

  for (let i = 0; i < size; ++i) {
    const suffix = [];

    for (let n = i; n > 0; n = Math.floor(n / alphabet.length)) {
      suffix.push(alphabet[n % alphabet.length]);
    }

    filenames[i] = options.prefix
      + (padding + suffix.reverse().join('')).slice(-options.suffix_length)
      + options.additional_suffix;
  }

  return filenames;
};

const splitByLines = function(buffer, lines) {
  const LF = '\n'.charCodeAt(0);

  const splitted = [];

  for (let begin = 0, index = 0, lineCount = 1; ; ++index) {
    if (begin === buffer.length) {
      break;
    }

    if (buffer.length < index) {
      splitted.push(buffer.slice(begin));
      break;
    }

    if (buffer[index] === LF) {
      if (lineCount === lines) {
        splitted.push(buffer.slice(begin, index + 1));
        begin = index + 1;
        lineCount = 1;
      } else {
        ++lineCount;
      }
    }
  }

  return splitted;
};

const splitByBytes = function(buffer, size) {
  const splitted = [];

  for (let begin = 0, end = size; ; begin = end, end += size) {
    if (begin === buffer.length) {
      break;
    }

    if (buffer.length < end) {
      splitted.push(buffer.slice(begin));
      break;
    }

    splitted.push(buffer.slice(begin, end));
  }

  return splitted;
};

const _split = function(buffer, options) {
  if (isDefined('lines', options)) {
    return splitByLines(buffer, options.lines);
  }

  if (isDefined('bytes', options)) {
    return splitByBytes(buffer, options.bytes);
  }

  return splitByLines(buffer, 1).map(function(line) {
    return splitByBytes(line, options.line_bytes);
  }).reduce(function(acc, line) {
    acc.push.apply(acc, line);
    return acc;
  }, []);
};

/**
 * Split buffer.
 *
 * @param {Buffer} buffer - Buffer to split.
 * @param {Object} options - Splitting options.
 * @param {number=} options.lines - Number of lines to put per output files.
 * @param {(number|string)=} options.bytes - Number of bytes to put per output files.
 * @param {(number|string)=} options.line_bytes - Number of bytes to put at most per output files.
 * @param {string=} options.prefix - Output file names prefix.
 * @param {number=} options.suffix_length - Length of suffixes.
 * @param {string=} options.additional_suffix - Additional suffix of file names.
 * @param {number=} options.numeric_suffixes - Start number of numeric suffixes.
 * @returns {Promise.<Array.<Buffer>>}
 */
module.exports.split = function(buffer, options) {
  let splitted = null;

  try {
    options = checkOptions(options);
    splitted = _split(buffer, options);
  } catch (err) {
    return Promise.reject(err);
  }

  if (isDefined('prefix', options)) {
    const filenames = [];

    try {
      filenames = createFilenames(splitted.length, options);
    } catch (err) {
      return Promise.reject(err);
    }

    return new Promise((resolve, reject) => {
      let done = 0, errored = false;

      splitted.forEach(function(buf, index) {
        fs.writeFile(filenames[index], buf, { encoding: null }, function(err) {
          if (err) {
            errored = true;
            return reject(err);
          }

          ++done;

          if (!errored && done === splitted.length) {
            resolve(splitted, filenames);
          }
        });
      });
    });
  }

  Promise.resolve(splitted);
};

/**
 * Split buffer synchronously.
 *
 * @param {Buffer} buffer - Buffer to split.
 * @param {Object} options - Splitting options. See {@link module:merked/split.split}.
 * @return {Array.<Buffer>} Array of splitted buffer
 * @throws Throws an error when options are invalid or when running out of suffixes.
 */
module.exports.splitSync = function(buffer, options) {
  options = checkOptions(options);

  const splitted = _split(buffer, options);
  const filenames = createFilenames(splitted.length, options);

  if (isDefined('prefix', options)) {
    splitted.forEach(function(buf, index) {
      fs.writeFileSync(filenames[index], buf, { encoding: null });
    });
  }

  return splitted;
};

