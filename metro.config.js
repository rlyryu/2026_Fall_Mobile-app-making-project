// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite on web (https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/#web-setup):
// let Metro bundle its .wasm file...
config.resolver.assetExts.push('wasm');

// ...and send COEP/COOP headers so the browser allows SharedArrayBuffer.
// Dev server only; the Android app / Expo Go are unaffected.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
