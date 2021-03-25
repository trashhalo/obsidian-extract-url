import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { base64 } from 'rollup-plugin-base64';

export default {
  input: 'index.js',
  output: {
    file: 'main.js',
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default'
  },
  external: ['obsidian'],
  plugins: [
    nodeResolve({ browser: false }),
    commonjs(),
    base64({ include: "**/*.wasm" })
  ]
};