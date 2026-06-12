import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * Smoke test — sanity check that Vitest + RTL + jsdom wiring berfungsi.
 * Tidak menguji komponen produksi, hanya memastikan rendering sederhana
 * dan query helper bekerja. Dengan test ini passing, developer bisa
 * menulis komponen test menggunakan import path standar.
 */
describe('Vitest + React Testing Library smoke', () => {
  it('renders a React element and finds it via screen', () => {
    render(<h1>SIBERMAS</h1>);
    expect(screen.getByRole('heading', { name: 'SIBERMAS' })).toBeInTheDocument();
  });

  it('matches text content', () => {
    render(<p data-testid="greeting">Halo, dunia.</p>);
    expect(screen.getByTestId('greeting')).toHaveTextContent('Halo, dunia.');
  });
});
