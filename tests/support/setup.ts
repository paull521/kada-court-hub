import "@testing-library/jest-dom/vitest";

// React 19 only flushes synchronous renders when it believes it is inside an
// act() environment. Without this, render() schedules work that never commits
// and every component test sees an empty container.
declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
