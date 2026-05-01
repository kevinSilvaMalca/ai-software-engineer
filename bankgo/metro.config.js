const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// MSW uses Node-only APIs (async_hooks, etc.) that don't exist in React Native.
// We stub out msw/node so Metro doesn't bundle it when running on device.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'msw/node') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('./__mocks__/msw-node-stub.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
