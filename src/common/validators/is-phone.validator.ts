import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: string): boolean {
    if (typeof phone !== 'string') return false;
    // Basic international phone format: + followed by 1 to 14 digits
    const regex = /^\+[1-9]\d{1,14}$/;
    return regex.test(phone);
  }

  defaultMessage(): string {
    return 'Phone number must follow international format (e.g., +60123456789).';
  }
}

export function IsPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneConstraint,
    });
  };
}
