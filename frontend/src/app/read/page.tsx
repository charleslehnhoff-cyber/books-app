import { Suspense } from 'react';
import { Metadata } from 'next';
import ReaderWrapper from './ReaderWrapper';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Reader | Sphaerus Books',
  description: 'Immerse yourself in reading with the Sphaerus digital e-reader.',
};

export default function ReadBookPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ padding: '2rem' }}>Loading book viewer...</div>}>
        <ReaderWrapper />
      </Suspense>
    </ErrorBoundary>
  );
}
