import { IsPasswordConstraint } from '../is-password.validator';

describe('IsPasswordConstraint', () => {
  let constraint: IsPasswordConstraint;

  beforeEach(() => {
    constraint = new IsPasswordConstraint();
  });

  describe('validate', () => {
    it('should return true for valid passwords', () => {
      expect(constraint.validate('Password123!')).toBe(true);
      expect(constraint.validate('A1!aaaaaa')).toBe(true);
      expect(constraint.validate('VeryLongPassword123!@$')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(constraint.validate('short')).toBe(false); // Too short
      expect(constraint.validate('password123!')).toBe(false); // No uppercase
      expect(constraint.validate('PASSWORD123!')).toBe(false); // No lowercase
      expect(constraint.validate('Password!!!!')).toBe(false); // No number
      expect(constraint.validate('Password1234')).toBe(false); // No special char
      expect(constraint.validate('Pass word123!')).toBe(false); // Has space
      expect(constraint.validate(12345678 as any)).toBe(false); // Not a string
    });
  });

  describe('defaultMessage', () => {
    it('should return default error message', () => {
      expect(constraint.defaultMessage()).toContain('Password must be 8-64 characters');
    });
  });
});
