import type { FormBlock, FormField, FormSchema } from '@/lib/database';
import { createDefaultFormSchema } from '@/lib/forms';
import {
  JsonSchemaValidator,
  validateJsonSchema,
} from './json-schema-validator';
import type {
  ImportedFormField,
  ImportedFormSchema,
  ValidationResult,
} from './types';

export interface ImportTransformResult {
  success: boolean;
  formSchema?: FormSchema;
  errors: string[];
  warnings: string[];
  validationResult?: ValidationResult;
}

export class JsonImportService {
  private generateUniqueId(): string {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBlockId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async transformJsonToFormSchema(
    jsonData: any
  ): Promise<ImportTransformResult> {
    try {
      // First validate the JSON structure
      const validationResult = validateJsonSchema(jsonData);

      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors.map((e) => `${e.path}: ${e.message}`),
          warnings: validationResult.warnings.map(
            (w) => `${w.path}: ${w.message}`
          ),
          validationResult,
        };
      }

      const importedSchema = jsonData as ImportedFormSchema;

      // Transform to internal format
      const formSchema = await this.createFormSchema(importedSchema);

      return {
        success: true,
        formSchema,
        errors: [],
        warnings: validationResult.warnings.map(
          (w) => `${w.path}: ${w.message}`
        ),
        validationResult,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to transform JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        warnings: [],
      };
    }
  }

  private async createFormSchema(
    importedSchema: ImportedFormSchema
  ): Promise<FormSchema> {
    // Start with default schema
    const baseSchema = createDefaultFormSchema({
      title: importedSchema.title,
      description: importedSchema.description || '',
      multiStep: false,
    });

    // Transform fields
    const transformedFields = importedSchema.fields.map((field) =>
      this.transformField(field)
    );

    // Create single block with all fields (for now, we'll put everything in one block)
    const mainBlock: FormBlock = {
      id: this.generateBlockId(),
      title: 'Main',
      description: '',
      fields: transformedFields,
      settings: {
        showStepNumber: false,
        layout: 'single',
        spacing: 'normal',
      },
    };

    // Apply imported settings
    const settings = this.transformSettings(
      importedSchema.settings || {},
      baseSchema.settings
    );

    return {
      blocks: [mainBlock],
      fields: transformedFields,
      settings,
      logic: baseSchema.logic,
    };
  }

  private transformField(importedField: ImportedFormField): FormField {
    // Generate unique ID if not provided or make sure it's unique
    const fieldId = importedField.id || this.generateUniqueId();

    // Map field type
    const mappedType = JsonSchemaValidator.mapFieldType(
      importedField.type
    ) as FormField['type'];

    // Transform options
    const options = this.transformOptions(importedField.options);

    // Build the internal field structure
    const field: FormField = {
      id: fieldId,
      type: mappedType,
      label: importedField.label,
      description: importedField.description,
      placeholder: importedField.placeholder,
      required: importedField.required ?? false,
      validation: this.transformValidation(importedField),
      settings: this.transformFieldSettings(importedField, mappedType),
    };

    // Add options for fields that support them
    if (options && options.length > 0) {
      field.options = options;
    }

    return field;
  }

  private transformOptions(
    importedOptions?: Array<{ id: string; label: string } | string>
  ): string[] | undefined {
    if (!importedOptions || importedOptions.length === 0) {
      return;
    }

    return importedOptions.map((option) => {
      if (typeof option === 'string') {
        return option;
      }
      if (typeof option === 'object' && option.label) {
        return option.label;
      }
      return 'Option';
    });
  }

  private transformValidation(
    importedField: ImportedFormField
  ): FormField['validation'] {
    const validation: FormField['validation'] = {};

    // Direct mappings
    if (importedField.validation?.minLength) {
      validation.minLength = importedField.validation.minLength;
    }
    if (importedField.validation?.maxLength) {
      validation.maxLength = importedField.validation.maxLength;
    }
    if (importedField.validation?.min) {
      validation.min = importedField.validation.min;
    }
    if (importedField.validation?.max) {
      validation.max = importedField.validation.max;
    }
    if (importedField.validation?.pattern) {
      validation.pattern = importedField.validation.pattern;
    }

    // Map min/max from root level for number fields
    if (importedField.min !== undefined) {
      validation.min = importedField.min;
    }
    if (importedField.max !== undefined) {
      validation.max = importedField.max;
    }

    // Custom validation messages
    if (importedField.required) {
      validation.requiredMessage = 'This field is required';
    }

    return validation;
  }

  private transformFieldSettings(
    importedField: ImportedFormField,
    fieldType: FormField['type']
  ): FormField['settings'] {
    const settings: FormField['settings'] = {};

    // Help text
    if (importedField.helpText) {
      settings.helpText = importedField.helpText;
    }

    // Default values
    if (importedField.defaultValue !== undefined) {
      settings.defaultValue = importedField.defaultValue;
    }

    if (importedField.defaultChecked !== undefined) {
      settings.defaultValue = importedField.defaultChecked;
    }

    // Field-specific settings
    switch (fieldType) {
      case 'textarea':
        if (importedField.rows) {
          settings.rows = importedField.rows;
        }
        break;

      case 'number':
      case 'slider':
        if (importedField.min !== undefined) {
          settings.min = importedField.min;
        }
        if (importedField.max !== undefined) {
          settings.max = importedField.max;
        }
        if (importedField.step !== undefined) {
          settings.step = importedField.step;
        }
        if (
          fieldType === 'slider' &&
          importedField.defaultValue !== undefined
        ) {
          settings.defaultValue = importedField.defaultValue;
        }
        break;

      case 'checkbox':
        // Handle selection constraints for multi-checkbox fields
        if (importedField.minSelections !== undefined) {
          settings.min = importedField.minSelections;
        }
        if (importedField.maxSelections !== undefined) {
          settings.max = importedField.maxSelections;
        }
        break;

      case 'select':
        // Allow multiple selection if specified
        if (importedField.type === 'multi_select') {
          settings.allowMultiple = true;
        }
        break;

      case 'statement':
        // Map section/statement settings
        settings.statementHeading = importedField.label;
        if (importedField.description) {
          settings.statementDescription = importedField.description;
        }
        settings.statementAlign = 'left';
        settings.statementSize = 'md';
        break;

      case 'rating':
        settings.starCount = 5;
        settings.icon = 'star';
        settings.color = '#fbbf24';
        break;

      case 'tags':
        settings.maxTags = 10;
        settings.allowDuplicates = false;
        break;
    }

    return settings;
  }

  private transformSettings(
    importedSettings: any,
    baseSettings: FormSchema['settings']
  ): FormSchema['settings'] {
    const settings = { ...baseSettings };

    // Basic settings
    if (importedSettings.theme) {
      settings.theme = {
        ...settings.theme,
        primaryColor: importedSettings.theme === 'dark' ? '#1f2937' : '#3b82f6',
      };
    }

    // Submission settings
    if (importedSettings.submission) {
      if (importedSettings.submission.successMessage) {
        settings.successMessage = importedSettings.submission.successMessage;
      }
      if (importedSettings.submission.redirectUrl) {
        settings.redirectUrl = importedSettings.submission.redirectUrl;
      }
    }

    // Notifications
    if (importedSettings.notifications) {
      settings.notifications = {
        enabled: importedSettings.notifications.sendEmail ?? false,
        email: importedSettings.notifications.emails?.[0] || '',
        subject: `New form submission: ${settings.title}`,
        message: 'A new form submission has been received.',
      };
    }

    // Language/RTL support
    if (importedSettings.language) {
      settings.rtl = ['ar', 'he', 'ur', 'fa'].includes(
        importedSettings.language
      );
    }

    return settings;
  }

  public async importFromFile(file: File): Promise<ImportTransformResult> {
    try {
      const text = await this.readFileAsText(file);
      const jsonData = JSON.parse(text);
      return this.transformJsonToFormSchema(jsonData);
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        warnings: [],
      };
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  }
}

export const jsonImportService = new JsonImportService();
