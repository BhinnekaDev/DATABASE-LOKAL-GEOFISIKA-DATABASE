import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const romanRegex = /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/i;

export function IsMMI(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isMMI',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return (
            !value || !isNaN(value) || romanRegex.test(value.toUpperCase())
          );
        },
        defaultMessage(): string {
          return `${propertyName} must be a number (1–12) or a valid Roman numeral (I–XII)`;
        },
      },
    });
  };
}
