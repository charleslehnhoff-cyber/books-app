import React, { useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { UploadTask } from '../../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGlobalDragOver: boolean;
  setIsGlobalDragOver: React.Dispatch<React.SetStateAction<boolean>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleGlobalDrop: (e: React.DragEvent) => void;
}

export default function UploadModal({ 
  isOpen, 
  onClose, 
  isGlobalDragOver, 
  setIsGlobalDragOver, 
  fileInputRef, 
  handleGlobalDrop 
}: UploadModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsGlobalDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsGlobalDragOver(false); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleGlobalDrop(e); }}
    >
      <div 
        style={{ background: 'var(--bg-secondary)', padding: '2.5rem', borderRadius: '16px', width: '500px', maxWidth: '90vw', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s ease', transform: isGlobalDragOver ? 'scale(1.02)' : 'scale(1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1.5rem', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Upload Books</h3>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close upload modal"><X size={24} /></button>
        </div>
        
        <div 
          style={{ 
            width: '100%', 
            border: `2px dashed ${isGlobalDragOver ? 'var(--accent)' : 'var(--border-color)'}`, 
            borderRadius: '12px', 
            padding: '4rem 2rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: isGlobalDragOver ? 'rgba(0, 204, 255, 0.05)' : 'var(--bg-primary)', 
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Plus size={32} color="var(--accent)" />
          </div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', textAlign: 'center' }}>Drag & drop your files here</h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0, textAlign: 'center', marginBottom: '2rem' }}>Supports EPUB and PDF format</p>
          <button className="btn btn-premium-gradient" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            Browse Files
          </button>
        </div>
      </div>
    </div>
  );
}
