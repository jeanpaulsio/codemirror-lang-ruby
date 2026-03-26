import typescript from "@rollup/plugin-typescript"
import {nodeResolve} from "@rollup/plugin-node-resolve"
import {lezer} from "@lezer/generator/rollup"

export default {
  input: "demo/demo.ts",
  output: {
    file: "demo/demo.js",
    format: "iife",
  },
  plugins: [nodeResolve(), lezer(), typescript({tsconfig: "demo/tsconfig.json"})],
}
