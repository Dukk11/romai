const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Erforderlich für expo-sqlite Web-Support und TensorFlow Model Weights (WASM & BIN Dateien)
config.resolver.assetExts.push('wasm', 'bin');

module.exports = config;
