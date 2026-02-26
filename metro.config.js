const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Erforderlich für TensorFlow Model Weights (WASM & BIN Dateien)
config.resolver.assetExts.push('wasm', 'bin');

// Dummy-Module für web-only Pakete, die @tensorflow-models/pose-detection
// intern importiert, obwohl wir nur runtime:'tfjs' nutzen.
// Metro's resolver.extraNodeModules greift für ALLE require()-Aufrufe,
// auch aus node_modules heraus (anders als babel-plugin-module-resolver).
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    '@mediapipe/pose': path.resolve(__dirname, 'dummy_mediapipe_pose.js'),
    '@tensorflow/tfjs-backend-webgpu': path.resolve(__dirname, 'dummy_tfjs_webgpu.js'),
};

module.exports = config;
