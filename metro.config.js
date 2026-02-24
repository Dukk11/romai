const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Erforderlich für expo-sqlite Web-Support (WASM Dateien)
config.resolver.assetExts.push('wasm');

module.exports = config;
