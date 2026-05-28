import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
