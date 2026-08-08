import React from 'react';
import { Book, X } from 'lucide-react';
import { ShelfType } from '../../types';

interface BulkShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBooksCount: number;
  shelves: ShelfType[];
  handleBulkToggleShelf: (shelfId: string) => void;
}

export default function BulkShelfModal({
  isOpen,
  onClose,
  selectedBooksCount,
  shelves,
  handleBulkToggleShelf
}: BulkShelfModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div 
        style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', minWidth: '350px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Add {selectedBooksCount} Books to Shelf</h3>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close bulk shelf modal"><X size={20} /></button>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {shelves.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No shelves created yet.</p>
          ) : (
            shelves.map(shelf => (
              <div 
                key={shelf.id} 
                onClick={() => handleBulkToggleShelf(shelf.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', cursor: 'pointer', border: '1px solid transparent' }} 
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'} 
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <Book size={18} color="var(--text-secondary)" />
                <span style={{ fontSize: '1.1rem' }}>{shelf.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
