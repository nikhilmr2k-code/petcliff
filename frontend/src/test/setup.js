import "@testing-library/jest-dom";

// jsdom doesn't implement IntersectionObserver, which framer-motion's
// whileInView relies on. Provide a no-op stub so components render in tests.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
globalThis.IntersectionObserver = globalThis.IntersectionObserver || IntersectionObserverStub;
