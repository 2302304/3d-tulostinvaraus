import { describe, it, expect } from 'vitest';

// Testataan validointisääntöjä jotka ovat käytössä lomakkeissa
describe('Validointisäännöt', () => {
  describe('Sähköpostin validointi', () => {
    const isValidEmail = (email: string) => {
      // VAMK-sähköpostit: @vamk.fi tai @edu.vamk.fi
      const vamkEmailRegex = /^[^\s@]+@(edu\.)?vamk\.fi$/i;
      return vamkEmailRegex.test(email);
    };

    it('hyväksyy vamk.fi sähköpostin', () => {
      expect(isValidEmail('admin@vamk.fi')).toBe(true);
      expect(isValidEmail('testi.kayttaja@vamk.fi')).toBe(true);
    });

    it('hyväksyy edu.vamk.fi sähköpostin', () => {
      expect(isValidEmail('opiskelija@edu.vamk.fi')).toBe(true);
      expect(isValidEmail('e2000123@edu.vamk.fi')).toBe(true);
    });

    it('hylkää muut sähköpostiosoitteet', () => {
      expect(isValidEmail('test@gmail.com')).toBe(false);
      expect(isValidEmail('test@outlook.com')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
    });
  });

  describe('Salasanan validointi', () => {
    const isValidPassword = (password: string) => {
      // Vähintään 8 merkkiä, iso ja pieni kirjain, numero, erikoismerkki
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return passwordRegex.test(password);
    };

    it('hyväksyy vahvan salasanan', () => {
      expect(isValidPassword('Test123!')).toBe(true);
      expect(isValidPassword('Salasana1!')).toBe(true);
    });

    it('hylkää liian lyhyen salasanan', () => {
      expect(isValidPassword('Test1!')).toBe(false);
    });

    it('hylkää salasanan ilman isoa kirjainta', () => {
      expect(isValidPassword('test123!')).toBe(false);
    });

    it('hylkää salasanan ilman numeroa', () => {
      expect(isValidPassword('Testtest!')).toBe(false);
    });

    it('hylkää salasanan ilman erikoismerkkiä', () => {
      expect(isValidPassword('Testtest1')).toBe(false);
    });
  });

  describe('Varausajan validointi', () => {
    const isValidReservationTime = (startTime: Date, endTime: Date) => {
      const now = new Date();
      return startTime > now && endTime > startTime;
    };

    it('hyväksyy tulevaisuudessa olevan varauksen', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(12, 0, 0, 0);

      expect(isValidReservationTime(tomorrow, endTime)).toBe(true);
    });

    it('hylkää menneisyydessä olevan varauksen', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const endTime = new Date(yesterday);
      endTime.setHours(endTime.getHours() + 2);

      expect(isValidReservationTime(yesterday, endTime)).toBe(false);
    });

    it('hylkää varauksen jossa loppuaika on ennen alkuaikaa', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(10, 0, 0, 0);

      expect(isValidReservationTime(tomorrow, endTime)).toBe(false);
    });
  });
});
