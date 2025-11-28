import '@testing-library/jest-dom';

if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

if (typeof global.ReadableStream === 'undefined') {
  const { Readable } = require('stream');
  global.ReadableStream = Readable;
}
