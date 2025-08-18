'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ValidationError, ValidationResult } from '@/lib/import';

interface ValidationResultsProps {
  validationResult: ValidationResult;
  className?: string;
}

export function ValidationResults({
  validationResult,
  className,
}: ValidationResultsProps) {
  const { isValid, errors, warnings } = validationResult;

  const getIcon = (severity: 'error' | 'warning') => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'destructive' : 'default';
  };

  if (isValid && warnings.length === 0) {
    return (
      <Alert className={className} variant="success">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4" />
          <div>
            <div className="font-semibold">Validation Successful</div>
            <div className="mt-1 text-sm">
              Your JSON schema is valid and ready to import. All fields have
              been validated successfully.
            </div>
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Summary */}
      <div className="flex items-center gap-2">
        <Badge variant={isValid ? 'secondary' : 'destructive'}>
          {isValid ? 'Valid with warnings' : 'Validation failed'}
        </Badge>
        {errors.length > 0 && (
          <Badge variant="destructive">
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </Badge>
        )}
        {warnings.length > 0 && (
          <Badge variant="secondary">
            {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Results list */}
      <ScrollArea className="h-48 w-full">
        <div className="space-y-2">
          {errors.map((error, index) => (
            <ValidationErrorItem error={error} key={`error-${index}`} />
          ))}
          {warnings.map((warning, index) => (
            <ValidationErrorItem error={warning} key={`warning-${index}`} />
          ))}
        </div>
      </ScrollArea>

      {/* Help text */}
      {!isValid && (
        <Alert variant="destructive">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-semibold">Import cannot proceed</div>
              <div className="mt-1 text-sm">
                Please fix the errors above before importing your form. You can
                edit your JSON file and try again.
              </div>
            </div>
          </div>
        </Alert>
      )}

      {isValid && warnings.length > 0 && (
        <Alert variant="warning">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-semibold">Ready to import with warnings</div>
              <div className="mt-1 text-sm">
                Your form can be imported, but some features may not work as
                expected. Review the warnings above for more details.
              </div>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}

interface ValidationErrorItemProps {
  error: ValidationError;
}

function ValidationErrorItem({ error }: ValidationErrorItemProps) {
  const { path, message, severity } = error;

  return (
    <Alert className="py-3" variant={getVariant(severity)}>
      <div className="flex items-start gap-2">
        {getIcon(severity)}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              {path}
            </code>
            <Badge className="text-xs" variant="outline">
              {severity}
            </Badge>
          </div>
          <p className="mt-1 text-foreground/80 text-sm">{message}</p>
        </div>
      </div>
    </Alert>
  );
}

function getVariant(severity: 'error' | 'warning'): 'default' | 'destructive' {
  return severity === 'error' ? 'destructive' : 'default';
}

function getIcon(severity: 'error' | 'warning') {
  switch (severity) {
    case 'error':
      return <AlertCircle className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}
