/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const GaleriaIA = lazy(() => import('./pages/GaleriaIA.tsx'));

export default function App() {
  return (
    <div className="w-full h-screen bg-background">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <GaleriaIA />
      </Suspense>
    </div>
  );
}
