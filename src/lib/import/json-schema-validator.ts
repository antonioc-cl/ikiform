import type { FormField } from '@/lib/database';
import type {
  FieldTypeMapping,
  ImportedFormField,
  ImportedFormSchema,
  ValidationError,
  ValidationResult,
} from './types';

const SUPPORTED_FIELD_TYPES: Record<string, string> = {
  // Direct mappings
  text: 'text',
  short_text: 'text',
  email: 'email',
  textarea: 'textarea',
  long_text: 'textarea',
  number: 'number',
  date: 'date',
  time: 'time',
  phone: 'phone',
  file: 'file',
  signature: 'signature',
  rating: 'rating',
  slider: 'slider',
  tags: 'tags',
  address: 'address',
  link: 'link',

  // Options-based fields
  radio: 'radio',
  select: 'select',
  checkbox: 'checkbox',
  checkboxes: 'checkbox',
  multi_select: 'select',

  // Special fields
  section: 'statement',
  statement: 'statement',
  poll: 'poll',
  scheduler: 'scheduler',
  social: 'social',
};

export class JsonSchemaValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  public validate(jsonData: any): ValidationResult {
    this.errors = [];
    this.warnings = [];

    try {
      // Parse JSON if it's a string
      const data =
        typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      this.validateFormSchema(data);

      return {
        isValid: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings,
        fixableErrors: this.errors.filter((error) =>
          this.isFixableError(error)
        ),
      };
    } catch (error) {
      this.addError(
        'root',
        'Invalid JSON format. Please check your JSON syntax.',
        'error'
      );
      return {
        isValid: false,
        errors: this.errors,
        warnings: this.warnings,
        fixableErrors: [],
      };
    }
  }

  private validateFormSchema(data: any): void {
    // Check required root properties
    if (
      !data.title ||
      typeof data.title !== 'string' ||
      data.title.trim() === ''
    ) {
      this.addError(
        'title',
        'Form title is required and must be a non-empty string',
        'error'
      );
    }

    if (data.description && typeof data.description !== 'string') {
      this.addError(
        'description',
        'Form description must be a string',
        'error'
      );
    }

    // Validate fields array
    if (!Array.isArray(data.fields)) {
      this.addError('fields', 'Fields must be an array', 'error');
      return;
    }

    if (data.fields.length === 0) {
      this.addError('fields', 'Form must have at least one field', 'error');
    }

    // Validate each field
    data.fields.forEach((field: any, index: number) => {
      this.validateField(field, `fields[${index}]`);
    });

    // Validate settings if present
    if (data.settings) {
      this.validateSettings(data.settings, 'settings');
    }
  }

  private validateField(field: any, path: string): void {
    if (!field || typeof field !== 'object') {
      this.addError(path, 'Field must be an object', 'error');
      return;
    }

    // Required properties
    if (!field.id || typeof field.id !== 'string' || field.id.trim() === '') {
      this.addError(
        `${path}.id`,
        'Field ID is required and must be a non-empty string',
        'error'
      );
    }

    if (!field.type || typeof field.type !== 'string') {
      this.addError(
        `${path}.type`,
        'Field type is required and must be a string',
        'error'
      );
    } else if (!SUPPORTED_FIELD_TYPES[field.type]) {
      this.addError(
        `${path}.type`,
        `Unsupported field type: ${field.type}. Supported types: ${Object.keys(SUPPORTED_FIELD_TYPES).join(', ')}`,
        'error'
      );
    }

    if (
      !field.label ||
      typeof field.label !== 'string' ||
      field.label.trim() === ''
    ) {
      this.addError(
        `${path}.label`,
        'Field label is required and must be a non-empty string',
        'error'
      );
    }

    // Optional properties validation
    if (field.required !== undefined && typeof field.required !== 'boolean') {
      this.addError(
        `${path}.required`,
        'Field required must be a boolean',
        'error'
      );
    }

    if (field.placeholder && typeof field.placeholder !== 'string') {
      this.addError(
        `${path}.placeholder`,
        'Field placeholder must be a string',
        'error'
      );
    }

    if (field.helpText && typeof field.helpText !== 'string') {
      this.addError(
        `${path}.helpText`,
        'Field helpText must be a string',
        'error'
      );
    }

    if (field.description && typeof field.description !== 'string') {
      this.addError(
        `${path}.description`,
        'Field description must be a string',
        'error'
      );
    }

    // Type-specific validation
    this.validateFieldTypeSpecific(field, path);
  }

  private validateFieldTypeSpecific(
    field: ImportedFormField,
    path: string
  ): void {
    const fieldType = field.type;

    // Fields that require options
    const optionFields = [
      'radio',
      'select',
      'checkbox',
      'checkboxes',
      'multi_select',
    ];
    if (optionFields.includes(fieldType)) {
      if (!(field.options && Array.isArray(field.options))) {
        this.addError(
          `${path}.options`,
          `Field type ${fieldType} requires an options array`,
          'error'
        );
      } else if (field.options.length === 0) {
        this.addError(
          `${path}.options`,
          `Field type ${fieldType} must have at least one option`,
          'error'
        );
      } else {
        // Validate each option
        field.options.forEach((option: any, index: number) => {
          if (typeof option === 'string') {
            if (option.trim() === '') {
              this.addError(
                `${path}.options[${index}]`,
                'Option cannot be empty',
                'error'
              );
            }
          } else if (typeof option === 'object' && option !== null) {
            if (!option.id || typeof option.id !== 'string') {
              this.addError(
                `${path}.options[${index}].id`,
                'Option ID is required and must be a string',
                'error'
              );
            }
            if (!option.label || typeof option.label !== 'string') {
              this.addError(
                `${path}.options[${index}].label`,
                'Option label is required and must be a string',
                'error'
              );
            }
          } else {
            this.addError(
              `${path}.options[${index}]`,
              'Option must be a string or object with id and label',
              'error'
            );
          }
        });
      }

      // Validate selection constraints
      if (fieldType === 'checkboxes' || fieldType === 'multi_select') {
        if (
          field.minSelections !== undefined &&
          (!Number.isInteger(field.minSelections) || field.minSelections < 0)
        ) {
          this.addError(
            `${path}.minSelections`,
            'minSelections must be a non-negative integer',
            'error'
          );
        }
        if (field.maxSelections !== undefined) {
          if (
            !Number.isInteger(field.maxSelections) ||
            field.maxSelections < 1
          ) {
            this.addError(
              `${path}.maxSelections`,
              'maxSelections must be a positive integer',
              'error'
            );
          }
          if (
            field.minSelections !== undefined &&
            field.maxSelections < field.minSelections
          ) {
            this.addError(
              `${path}.maxSelections`,
              'maxSelections cannot be less than minSelections',
              'error'
            );
          }
        }
      }
    }

    // Number and slider fields
    if (fieldType === 'number' || fieldType === 'slider') {
      if (field.min !== undefined && typeof field.min !== 'number') {
        this.addError(`${path}.min`, 'min value must be a number', 'error');
      }
      if (field.max !== undefined && typeof field.max !== 'number') {
        this.addError(`${path}.max`, 'max value must be a number', 'error');
      }
      if (field.step !== undefined && typeof field.step !== 'number') {
        this.addError(`${path}.step`, 'step value must be a number', 'error');
      }
      if (
        field.min !== undefined &&
        field.max !== undefined &&
        field.min >= field.max
      ) {
        this.addError(
          `${path}.min`,
          'min value must be less than max value',
          'error'
        );
      }
    }

    // Statement/section fields
    if (
      (fieldType === 'section' || fieldType === 'statement') &&
      (!field.label || field.label.trim() === '')
    ) {
      this.addWarning(
        `${path}.label`,
        'Section fields should have descriptive labels',
        'warning'
      );
    }

    // Validation for specific field configurations
    if (field.validation) {
      this.validateFieldValidation(field.validation, `${path}.validation`);
    }
  }

  private validateFieldValidation(validation: any, path: string): void {
    if (typeof validation !== 'object' || validation === null) {
      this.addError(path, 'Validation must be an object', 'error');
      return;
    }

    if (
      validation.minLength !== undefined &&
      (!Number.isInteger(validation.minLength) || validation.minLength < 0)
    ) {
      this.addError(
        `${path}.minLength`,
        'minLength must be a non-negative integer',
        'error'
      );
    }

    if (
      validation.maxLength !== undefined &&
      (!Number.isInteger(validation.maxLength) || validation.maxLength < 1)
    ) {
      this.addError(
        `${path}.maxLength`,
        'maxLength must be a positive integer',
        'error'
      );
    }

    if (
      validation.minLength !== undefined &&
      validation.maxLength !== undefined &&
      validation.minLength >= validation.maxLength
    ) {
      this.addError(
        `${path}.minLength`,
        'minLength must be less than maxLength',
        'error'
      );
    }

    if (validation.pattern && typeof validation.pattern !== 'string') {
      this.addError(`${path}.pattern`, 'Pattern must be a string', 'error');
    }
  }

  private validateSettings(settings: any, path: string): void {
    if (typeof settings !== 'object' || settings === null) {
      this.addError(path, 'Settings must be an object', 'error');
      return;
    }

    // Validate theme
    if (settings.theme && typeof settings.theme !== 'string') {
      this.addError(`${path}.theme`, 'Theme must be a string', 'error');
    }

    // Validate language
    if (settings.language && typeof settings.language !== 'string') {
      this.addError(`${path}.language`, 'Language must be a string', 'error');
    }

    // Validate submission settings
    if (settings.submission) {
      const submission = settings.submission;
      if (typeof submission !== 'object' || submission === null) {
        this.addError(
          `${path}.submission`,
          'Submission settings must be an object',
          'error'
        );
      } else {
        if (
          submission.redirectUrl !== undefined &&
          submission.redirectUrl !== null &&
          typeof submission.redirectUrl !== 'string'
        ) {
          this.addError(
            `${path}.submission.redirectUrl`,
            'Redirect URL must be a string or null',
            'error'
          );
        }
        if (
          submission.successMessage &&
          typeof submission.successMessage !== 'string'
        ) {
          this.addError(
            `${path}.submission.successMessage`,
            'Success message must be a string',
            'error'
          );
        }
      }
    }

    // Validate notifications
    if (settings.notifications) {
      const notifications = settings.notifications;
      if (typeof notifications !== 'object' || notifications === null) {
        this.addError(
          `${path}.notifications`,
          'Notifications settings must be an object',
          'error'
        );
      } else {
        if (
          notifications.sendEmail !== undefined &&
          typeof notifications.sendEmail !== 'boolean'
        ) {
          this.addError(
            `${path}.notifications.sendEmail`,
            'sendEmail must be a boolean',
            'error'
          );
        }
        if (notifications.emails && !Array.isArray(notifications.emails)) {
          this.addError(
            `${path}.notifications.emails`,
            'emails must be an array',
            'error'
          );
        } else if (notifications.emails) {
          notifications.emails.forEach((email: any, index: number) => {
            if (typeof email !== 'string') {
              this.addError(
                `${path}.notifications.emails[${index}]`,
                'Email must be a string',
                'error'
              );
            }
          });
        }
      }
    }
  }

  private addError(
    path: string,
    message: string,
    severity: 'error' | 'warning'
  ): void {
    const error: ValidationError = { path, message, severity };
    if (severity === 'error') {
      this.errors.push(error);
    } else {
      this.warnings.push(error);
    }
  }

  private addWarning(path: string, message: string, severity: 'warning'): void {
    this.warnings.push({ path, message, severity });
  }

  private isFixableError(error: ValidationError): boolean {
    const fixableErrors = [
      'Field required must be a boolean',
      'Theme must be a string',
      'Language must be a string',
      'Success message must be a string',
    ];

    return fixableErrors.some((fixable) => error.message.includes(fixable));
  }

  public static getSupportedFieldTypes(): string[] {
    return Object.keys(SUPPORTED_FIELD_TYPES);
  }

  public static mapFieldType(importType: string): string {
    return SUPPORTED_FIELD_TYPES[importType] || importType;
  }
}

export const validateJsonSchema = (jsonData: any): ValidationResult => {
  const validator = new JsonSchemaValidator();
  return validator.validate(jsonData);
};
