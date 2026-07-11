import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsTimeConstraint implements ValidatorConstraintInterface {
  validate(time: string): boolean {
    if (typeof time !== 'string') return false;
    // HH:mm format, strict 24-hour time
    const regex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }

  defaultMessage(): string {
    return 'Time must be in 24-hour HH:mm format (e.g., 14:30).';
  }
}

export function IsTime(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTimeConstraint,
    });
  };
}
