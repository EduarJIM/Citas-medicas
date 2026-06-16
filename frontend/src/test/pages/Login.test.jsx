import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Login from '../../pages/Login';

const renderLogin = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Login Page', () => {
  it('renders login form', () => {
    renderLogin();
    expect(screen.getByText('Iniciar Sesion')).toBeInTheDocument();
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contrasena/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    renderLogin();
    const btn = screen.getByRole('button', { name: /ingresar/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/correo.*obligatorio/i)).toBeInTheDocument();
      expect(screen.getByText(/contraseña.*obligatoria/i)).toBeInTheDocument();
    });
  });

  it('shows email format error for invalid email', async () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/correo/i);

    fireEvent.change(emailInput, { target: { value: 'invalido' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/correo.*válido/i)).toBeInTheDocument();
    });
  });

  it('has link to register', () => {
    renderLogin();
    expect(screen.getByText(/registrate/i)).toBeInTheDocument();
  });

  it('has link to forgot password', () => {
    renderLogin();
    expect(screen.getByText(/olvidaste/i)).toBeInTheDocument();
  });
});
