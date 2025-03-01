const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          util: false,
          url: false,
          crypto: false,
          http: false,
          https: false,
          stream: false,
          assert: false,
          os: false
        }
      }
    }
  }
}; 