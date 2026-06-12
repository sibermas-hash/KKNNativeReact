import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Auto-clean DOM between tests (React Testing Library convention).
afterEach(() => {
  cleanup();
});
