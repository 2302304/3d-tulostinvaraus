import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../../stores/authStore';

// Mock queryClient
vi.mock('../../main', () => ({
  queryClient: {
    clear: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  const mockUser = {
    id: '1',
    email: 'test@vamk.fi',
    firstName: 'Testi',
    lastName: 'Käyttäjä',
    role: 'STUDENT' as const,
  };

  describe('login', () => {
    it('asettaa käyttäjän tiedot ja tokenin', () => {
      const { login } = useAuthStore.getState();

      login(mockUser, 'access-token', 'refresh-token');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('tyhjentää käyttäjän tiedot', () => {
      const { login, logout } = useAuthStore.getState();

      // First login
      login(mockUser, 'access-token', 'refresh-token');

      // Then logout
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('updateToken', () => {
    it('päivittää access tokenin', () => {
      const { login, updateToken } = useAuthStore.getState();

      login(mockUser, 'old-token', 'refresh-token');
      updateToken('new-token');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-token');
      expect(state.user).toEqual(mockUser); // User unchanged
    });
  });

  describe('isAuthenticated', () => {
    it('on false kun käyttäjä ei ole kirjautunut', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('on true kun käyttäjä on kirjautunut', () => {
      const { login } = useAuthStore.getState();
      login(mockUser, 'token', 'refresh');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });
  });
});
