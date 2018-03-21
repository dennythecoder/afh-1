
module.exports = {
    "moduleFileExtensions": [
      "js",
      "json",
      "vue"
    ],

    "transform": {
      "^.+\\.js$": "<rootDir>/node_modules/babel-jest",
      ".*\\.(vue)$": "<rootDir>/node_modules/vue-jest"
    },
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/src/$1",
      "quasar":"quasar-framework/dist/umd/quasar.mat.umd.js"
    },
    "snapshotSerializers": [
      "<rootDir>/node_modules/jest-serializer-vue"
    ]
  }