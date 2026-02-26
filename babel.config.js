module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            ['react-native-reanimated/plugin'],
            [
                'module-resolver',
                {
                    alias: {
                        'react-native-fs': './dummy_RNFS.js',
                        '@mediapipe/pose': './dummy_mediapipe_pose.js',
                        '@tensorflow/tfjs-backend-webgpu': './dummy_tfjs_webgpu.js',
                    },
                },
            ],
        ],
    };
};
