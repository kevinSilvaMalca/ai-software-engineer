// Extensible mock of NativeModules for jest-expo ~54 + RN 0.76 compatibility
// jest-expo setup.js requires: NativeUnimoduleProxy, UIManager to be extensible objects

const UIManager = {};
const NativeUnimoduleProxy = {
  viewManagersMetadata: {},
  modulesConstants: {},
  exportedMethods: {},
};

const mock = {
  UIManager,
  NativeUnimoduleProxy,
};

module.exports = { default: mock, ...mock };
