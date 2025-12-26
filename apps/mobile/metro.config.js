const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Only look in the mobile app's node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Don't watch files outside the mobile app directory
config.watchFolders = [projectRoot];

// Block packages from root node_modules
config.resolver.blockList = [
  // Block root node_modules
  new RegExp(`${path.resolve(projectRoot, '../..')}/node_modules/.*`),
];

module.exports = config;
