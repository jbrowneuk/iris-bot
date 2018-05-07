import { container } from './installer';
import { TYPES } from '../constants/types';

describe('inversion of control framework', () => {
  it('should return a value for each defined type', () => {
    const typeKeys = Object.keys(TYPES);
    typeKeys.forEach((key: string) => {
      const symbol = (TYPES as any)[key];
      expect(container.get(symbol)).toBeTruthy();
    });
  });
});
