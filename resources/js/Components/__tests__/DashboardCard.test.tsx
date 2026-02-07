import { render, screen } from '@testing-library/react';
import DashboardCard from '../DashboardCard';

test('renders dashboard card with correct data', () => {
  render(<DashboardCard title="Total Students" value={100} />);

  expect(screen.getByText('Total Students')).toBeInTheDocument();
  expect(screen.getByText('100')).toBeInTheDocument();
});
