const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's browser implementation ships as WebAssembly.
config.resolver.assetExts.push('wasm');

// SharedArrayBuffer is required by the SQLite web worker during local preview.
config.server.enhanceMiddleware = (middleware) => {
  return (request, response, next) => {
    response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return middleware(request, response, next);
  };
};

module.exports = config;
