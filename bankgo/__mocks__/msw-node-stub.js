// Stub for msw/node — used by Metro when bundling for device/simulator.
// The real msw/node uses Node APIs (async_hooks) that don't exist in React Native.
// Tests use the real msw/node via Jest's moduleNameMapper, not Metro.

function setupServer() {
  return {
    listen: () => {},
    close: () => {},
    resetHandlers: () => {},
    use: () => {},
  };
}

module.exports = { setupServer };
