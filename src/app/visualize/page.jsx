import { Suspense } from 'react';
import VisualizeClient from './VisualizeClient';

export default function VisualizePage() {
  return (
    <Suspense fallback={<div className="text-center mt-10 text-purple-700">Loading Visualization Page...</div>}>
      <VisualizeClient />
    </Suspense>
  );
}
