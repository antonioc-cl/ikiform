import { Plus, Sparkles, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { JsonImportModal } from '@/components/form-builder/json-import-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '@/components/ui/modal';
import type { ImportTransformResult } from '@/lib/import';
import type { FormHeaderProps } from '../types';

interface FormsHeaderProps extends FormHeaderProps {
  onCreateWithAI: () => void;
  onCreateManually: () => void;
  onImportFromJson?: (result: ImportTransformResult) => void;
}

export function FormsHeader({
  onCreateForm,
  onCreateWithAI,
  onCreateManually,
  onImportFromJson,
}: FormsHeaderProps) {
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportSuccess = (result: ImportTransformResult) => {
    setShowImportModal(false);
    if (onImportFromJson) {
      onImportFromJson(result);
    }
  };
  return (
    <div className="flex flex-col justify-between gap-4 rounded-card border border-border bg-card p-6 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-2xl text-foreground tracking-tight">
          Your Forms
        </h2>
        <p className="text-muted-foreground">
          Create, manage, and analyze your forms with ease
        </p>
      </div>
      <div className="flex gap-2">
        <Modal>
          <ModalTrigger asChild>
            <Button onClick={onCreateForm}>
              <Plus className="h-5 w-5" />
              Create New Form
            </Button>
          </ModalTrigger>
          <ModalContent className="flex flex-col items-start justify-start gap-4 text-left">
            <ModalHeader className="flex flex-col gap-2 text-left">
              <ModalTitle>How would you like to create your form?</ModalTitle>
              <ModalDescription asChild>
                <span>
                  Choose to build your form manually, let Kiko AI generate it
                  for you, or import from JSON.
                </span>
              </ModalDescription>
            </ModalHeader>
            <div className="items-left justify-left flex w-full flex-wrap gap-2">
              <Button
                className="max-sm:grow"
                onClick={onCreateWithAI}
                size="lg"
                variant="default"
              >
                <Sparkles /> Use Kiko AI
              </Button>
              <Button
                className="max-sm:grow"
                onClick={onCreateManually}
                size="lg"
                variant="secondary"
              >
                Create Manually
              </Button>
              {onImportFromJson && (
                <Button
                  className="max-sm:grow"
                  onClick={() => setShowImportModal(true)}
                  size="lg"
                  variant="outline"
                >
                  <Upload className="h-4 w-4" />
                  Import from JSON
                </Button>
              )}
            </div>
          </ModalContent>
        </Modal>
      </div>

      <JsonImportModal
        onImportSuccess={handleImportSuccess}
        onOpenChange={setShowImportModal}
        open={showImportModal}
      />
    </div>
  );
}
