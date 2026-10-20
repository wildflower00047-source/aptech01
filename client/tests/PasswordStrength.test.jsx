import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PasswordStrength from '../src/components/common/PasswordStrength.jsx';

describe('<PasswordStrength />', () => {
  it('renders every password rule', () => {
    render(<PasswordStrength password="Abcdef1!" />);
    for (const label of [
      '8+ characters',
      'Lowercase letter',
      'Uppercase letter',
      'Number',
      'Special character',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('reports a strong password as Excellent', () => {
    render(<PasswordStrength password="Str0ng@Pass" />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('shows a placeholder when the password is empty', () => {
    render(<PasswordStrength password="" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
