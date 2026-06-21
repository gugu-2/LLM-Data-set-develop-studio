import '@testing-library/react';

// Polyfill ResizeObserver for recharts
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
