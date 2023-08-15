import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'
import builtins from 'builtin-modules'
// import camelCase from 'lodash.camelcase'


const pkg = require('./package.json')

const libraryName = 'core'

export default {
  input: `src/${libraryName}.ts`,
  output: [
    // { file: pkg.main, name: camelCase(libraryName), format: 'umd', sourcemap: true },
    // { file: pkg.main, format: 'cjs', sourcemap: true },
    { file: pkg.main, format: 'cjs', sourcemap: true },
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')

  external: [ ...builtins, 'sqlite3', 'typeorm', 'axios' ],
  watch: {
    include: 'src/**',
  },
  plugins: [
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript({ useTsconfigDeclarationDir: true }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs({
      // namedExports: { 'typeorm': [ 'Entity', 'PrimaryColumn', 'Column' ] },
      // ignore: [
      //   '@sap/hdbext',
      //   'mongodb',
      //   'oracledb',
      //   'mysql',
      //   'mysql2',
      //   'pg-native',
      //   'redis',
      //   'pg',
      //   'ioredis',
      //   'mssql',
      //   'pg-query-stream',
      //   'sql.js',
      //   'typeorm-aurora-data-api-driver',
      //   'react-native-sqlite-storage'
      // ]
    }),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),
    // Resolve source maps to the original source
    sourceMaps(),
  ],
}
