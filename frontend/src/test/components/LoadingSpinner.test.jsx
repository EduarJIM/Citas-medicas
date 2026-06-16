import { render, screen, waitFor } from '@testing-library/react';
import LoadingSpinner from '../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders default text', async () => {
    render(<LoadingSpinner />);
    await waitFor(() => {
      expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });
  });

  it('renders custom text', async () => {
    render(<LoadingSpinner text="Espere por favor..." />);
    await waitFor(() => {
      expect(screen.getByText('Espere por favor...')).toBeInTheDocument();
    });
  });
});
