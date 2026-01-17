import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LanguageSelector from '../../components/LanguageSelector';

// Mock react-i18next
const mockChangeLanguage = vi.fn();
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'fi',
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear();
    vi.spyOn(Storage.prototype, 'setItem');
  });

  it('renderöi kaikki kielivalinnat', () => {
    render(<LanguageSelector />);

    expect(screen.getByText('FI')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('SV')).toBeInTheDocument();
  });

  it('vaihtaa kielen kun nappia klikataan', () => {
    render(<LanguageSelector />);

    fireEvent.click(screen.getByText('EN'));

    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    expect(localStorage.setItem).toHaveBeenCalledWith('language', 'en');
  });

  it('korostaa aktiivisen kielen', () => {
    render(<LanguageSelector />);

    const fiButton = screen.getByText('FI');
    expect(fiButton).toHaveClass('bg-primary-500');
  });
});
