'use client';

import { CheckCircle, FileText, Upload, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import type { ImportTransformResult, ValidationResult } from '@/lib/import';
import { jsonImportService } from '@/lib/import';

import { ValidationResults } from './components/ValidationResults';

interface JsonImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (result: ImportTransformResult) => void;
}

type ImportStep = 'upload' | 'validate' | 'preview' | 'complete';

export function JsonImportModal({
  open,
  onOpenChange,
  onImportSuccess,
}: JsonImportModalProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [importResult, setImportResult] =
    useState<ImportTransformResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const resetModal = () => {
    setCurrentStep('upload');
    setJsonFile(null);
    setJsonText('');
    setValidationResult(null);
    setImportResult(null);
    setIsProcessing(false);
    setProgress(0);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setJsonFile(file);
        // Read file content for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setJsonText(e.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const handleValidateAndProcess = async () => {
    setIsProcessing(true);
    setProgress(25);

    try {
      let result: ImportTransformResult;

      if (jsonFile) {
        result = await jsonImportService.importFromFile(jsonFile);
      } else {
        result = await jsonImportService.transformJsonToFormSchema(
          JSON.parse(jsonText)
        );
      }

      setProgress(75);
      setImportResult(result);
      setValidationResult(result.validationResult || null);

      if (result.success) {
        setCurrentStep('preview');
      } else {
        setCurrentStep('validate');
      }

      setProgress(100);
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        errors: [
          `Failed to process JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        warnings: [],
      });
      setCurrentStep('validate');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (importResult?.success && importResult.formSchema) {
      onImportSuccess(importResult);
      setCurrentStep('complete');
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const canProceedFromUpload = jsonFile || jsonText.trim().length > 0;
  const canProceedFromValidation = importResult?.success;

  const getStepProgress = () => {
    switch (currentStep) {
      case 'upload':
        return 25;
      case 'validate':
        return 50;
      case 'preview':
        return 75;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Form from JSON</DialogTitle>
          <DialogDescription>
            Upload or paste a JSON file to create a new form. We'll validate the
            structure and help you fix any issues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>
                Step{' '}
                {currentStep === 'upload'
                  ? 1
                  : currentStep === 'validate'
                    ? 2
                    : currentStep === 'preview'
                      ? 3
                      : 4}{' '}
                of 4
              </span>
              <span>
                {Math.round(isProcessing ? progress : getStepProgress())}%
              </span>
            </div>
            <Progress
              className="h-2"
              value={isProcessing ? progress : getStepProgress()}
            />
          </div>

          {/* Upload Step */}
          {currentStep === 'upload' && (
            <div className="space-y-4">
              <div className="mb-4 flex gap-2">
                <Button
                  onClick={() => setUploadMode('file')}
                  size="sm"
                  variant={uploadMode === 'file' ? 'default' : 'outline'}
                >
                  Upload File
                </Button>
                <Button
                  onClick={() => setUploadMode('text')}
                  size="sm"
                  variant={uploadMode === 'text' ? 'default' : 'outline'}
                >
                  Paste JSON
                </Button>
              </div>

              {uploadMode === 'file' && (
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-border border-dashed p-6 text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Click to upload or drag and drop your JSON file
                      </p>
                      <input
                        accept=".json,application/json"
                        className="text-muted-foreground text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:font-medium file:text-primary-foreground file:text-sm hover:file:bg-primary/90"
                        onChange={handleFileUpload}
                        type="file"
                      />
                    </div>
                  </div>
                  {jsonFile && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <FileText className="h-4 w-4" />
                      <span>
                        {jsonFile.name} ({(jsonFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {uploadMode === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="json-text">JSON Content</Label>
                  <Textarea
                    className="min-h-[120px] font-mono text-sm"
                    id="json-text"
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder="Paste your JSON form schema here..."
                    value={jsonText}
                  />
                </div>
              )}
            </div>
          )}

          {/* Validation Step */}
          {currentStep === 'validate' && validationResult && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Validation Results</h3>
              <ValidationResults validationResult={validationResult} />

              {importResult?.errors && importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-destructive">
                    Import Errors:
                  </h4>
                  <ul className="space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li className="text-destructive text-sm" key={index}>
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && importResult?.formSchema && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Import Preview</h3>
              <div className="rounded-lg bg-muted p-4">
                <div className="space-y-3">
                  <div>
                    <Label className="font-medium text-sm">Form Title</Label>
                    <p className="text-sm">
                      {importResult.formSchema.settings.title}
                    </p>
                  </div>
                  {importResult.formSchema.settings.description && (
                    <div>
                      <Label className="font-medium text-sm">Description</Label>
                      <p className="text-muted-foreground text-sm">
                        {importResult.formSchema.settings.description}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="font-medium text-sm">Fields</Label>
                    <p className="text-sm">
                      {importResult.formSchema.fields.length} field(s) will be
                      imported
                    </p>
                    <div className="mt-2 space-y-1">
                      {importResult.formSchema.fields
                        .slice(0, 5)
                        .map((field, index) => (
                          <div
                            className="flex items-center gap-2 text-muted-foreground text-xs"
                            key={index}
                          >
                            <span className="rounded bg-primary/10 px-1.5 py-0.5">
                              {field.type}
                            </span>
                            <span>{field.label}</span>
                          </div>
                        ))}
                      {importResult.formSchema.fields.length > 5 && (
                        <div className="text-muted-foreground text-xs">
                          ... and {importResult.formSchema.fields.length - 5}{' '}
                          more fields
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {importResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-medium text-orange-600 text-sm">
                    Import Warnings:
                  </Label>
                  <ul className="space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <li className="text-orange-600 text-xs" key={index}>
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="space-y-4 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <h3 className="font-semibold text-lg">Import Successful!</h3>
                <p className="text-muted-foreground text-sm">
                  Your form has been imported and is ready to edit.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button onClick={handleClose} variant="outline">
            Cancel
          </Button>

          <div className="flex gap-2">
            {currentStep === 'upload' && (
              <Button
                disabled={!canProceedFromUpload || isProcessing}
                onClick={handleValidateAndProcess}
              >
                {isProcessing ? 'Processing...' : 'Validate & Process'}
              </Button>
            )}

            {currentStep === 'validate' && !canProceedFromValidation && (
              <Button
                onClick={() => setCurrentStep('upload')}
                variant="outline"
              >
                Back to Upload
              </Button>
            )}

            {currentStep === 'preview' && (
              <>
                <Button
                  onClick={() => setCurrentStep('upload')}
                  variant="outline"
                >
                  Back
                </Button>
                <Button onClick={handleConfirmImport}>Import Form</Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
