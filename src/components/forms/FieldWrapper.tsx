import React from 'react';
import { Label } from "../ui/label";

interface FieldWrapperProps {
  label?: string;
  error?: any;
  helperText?: string;
  children: React.ReactNode;
}

export const FieldWrapper = ({ label, error, helperText, children }: FieldWrapperProps) => (
  <div className="space-y-1.5">
    {label && <Label className={error ? "text-destructive" : ""}>{label}</Label>}
    {children}
    {error && <p className="text-xs text-destructive">{error.message}</p>}
    {helperText && !error && <p className="text-xs text-muted-foreground">{helperText}</p>}
  </div>
);
