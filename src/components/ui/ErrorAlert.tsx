import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from './card';

export const ErrorAlert = ({ message, onRetry }: { message: string, onRetry?: () => void }) => (
  <Card className="border-destructive bg-destructive/10">
    <CardContent className="flex items-center gap-3 p-4">
      <AlertCircle className="text-destructive h-5 w-5" />
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="ml-auto text-xs font-bold underline">Tentar novamente</button>
      )}
    </CardContent>
  </Card>
);
