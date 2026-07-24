import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('axios', () => {
  const client = jest.fn();
  client.create = jest.fn(() => client);
  client.post = jest.fn();
  client.interceptors = {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  };
  client.defaults = { headers: { common: {} } };

  return { __esModule: true, default: client };
});

test('renders the login screen for unauthenticated users', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
});
