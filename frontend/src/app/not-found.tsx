'use client';

import Link from 'next/link';
import { BookX, Home } from 'lucide-react';
import React from 'react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      background: 'var(--bg-primary)'
    }}>
      <div style={{
        position: 'relative',
        marginBottom: '2rem',
        padding: '2.5rem',
        background: 'rgba(var(--accent-rgb), 0.05)',
        borderRadius: '50%',
        boxShadow: '0 10px 40px rgba(var(--accent-rgb), 0.1)',
        border: '1px solid rgba(var(--accent-rgb), 0.15)',
        backdropFilter: 'blur(10px)',
      }}>
        <BookX size={80} style={{ color: 'var(--accent)', filter: 'drop-shadow(0 4px 12px rgba(var(--accent-rgb), 0.3))' }} />
      </div>
      
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: '700',
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>Page Not Found</h1>
      
      <p style={{
        fontSize: '1.1rem',
        color: 'var(--text-secondary)',
        maxWidth: '500px',
        marginBottom: '2.5rem',
        lineHeight: '1.6'
      }}>
        We couldn't find the page or book you were looking for. It might have been moved, deleted, or the link may be incorrect.
      </p>
      
      <Link href="/" style={{ textDecoration: 'none' }}>
        <button 
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '99px',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 15px rgba(var(--accent-rgb), 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(var(--accent-rgb), 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(var(--accent-rgb), 0.3)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'}
        >
          <Home size={18} />
          Return to Library
        </button>
      </Link>
    </div>
  );
}
