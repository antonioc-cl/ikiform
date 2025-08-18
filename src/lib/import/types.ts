export interface ImportedFormSchema {
  title: string;
  description?: string;
  settings?: {
    theme?: string;
    language?: string;
    submission?: {
      redirectUrl?: string | null;
      successMessage?: string;
    };
    notifications?: {
      sendEmail?: boolean;
      emails?: string[];
    };
    [key: string]: any;
  };
  fields: ImportedFormField[];
}

export interface ImportedFormField {
  id: string;
  type: string;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  options?: Array<{ id: string; label: string } | string>;
  allowOther?: boolean;
  minSelections?: number;
  maxSelections?: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
  defaultChecked?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  fixableErrors: ValidationError[];
}

export interface FieldTypeMapping {
  importType: string;
  internalType: string;
  transform?: (
    field: ImportedFormField
  ) => Partial<import('@/lib/database').FormField>;
}
