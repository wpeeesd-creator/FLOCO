const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase v9+ 모듈 서브패스 해석 활성화
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
