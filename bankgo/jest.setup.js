// jest-expo ~54 + React Native 0.76 compatibility patch
// jest-expo/src/preset/setup.js does:
//   const mockNativeModules = require('react-native/Libraries/BatchedBridge/NativeModules').default
// In RN 0.76 that .default is undefined, causing Object.defineProperty to throw.
// We mock the module so .default is an extensible plain object.

jest.mock(
  'react-native/Libraries/BatchedBridge/NativeModules',
  () => {
    const actual = jest.requireActual(
      'react-native/Libraries/BatchedBridge/NativeModules'
    );
    const nativeModules = actual?.default ?? actual ?? {};
    // Return a plain extensible object so jest-expo can defineProperty on it
    return {
      ...actual,
      default: Object.assign({}, nativeModules),
    };
  },
  { virtual: false }
);
