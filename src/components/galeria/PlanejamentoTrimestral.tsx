import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlanejamentoTrimestral() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planejamento Trimestral</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Planejamento trimestral em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
