/**
 * Dummy-Modul für @tensorflow/tfjs-backend-webgpu.
 *
 * @tensorflow-models/pose-detection importiert das PoseNet-Backend,
 * das optional tfjs-backend-webgpu nutzt. WebGPU ist nur im Browser verfügbar.
 * Dieses Dummy verhindert den Bundling-Fehler in React Native.
 */
export default {};
