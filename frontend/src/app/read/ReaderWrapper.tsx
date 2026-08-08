"use client";

import dynamic from 'next/dynamic';

const Reader = dynamic(() => import('./Reader'), { 
  ssr: false,
  loading: () => <div style={{ padding: '2rem' }}>Loading book viewer...</div>
});

export default function ReaderWrapper() {
  return <Reader />;
}
