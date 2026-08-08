import React from 'react';
import { BookType } from '../../types';
import { X } from 'lucide-react';

interface EditFormState {
  title: string;
  author: string;
  coverUrl: string;
}

interface EditDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editForm: EditFormState;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  handleSaveBookDetails: () => void;
}

export default function EditDetailsModal({
  isOpen,
  onClose,
  editForm,
  setEditForm,
  handleSaveBookDetails
}: EditDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div 
        style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', minWidth: '400px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Edit Book Details</h3>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close edit details modal"><X size={20} /></button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Title</label>
            <input 
              type="text" 
              value={editForm.title} 
              onChange={e => setEditForm({...editForm, title: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Author</label>
            <input 
              type="text" 
              value={editForm.author} 
              onChange={e => setEditForm({...editForm, author: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Custom Cover Image URL</label>
            <input 
              type="text" 
              placeholder="https://example.com/cover.jpg"
              value={editForm.coverUrl} 
              onChange={e => setEditForm({...editForm, coverUrl: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Paste a link to an image to override the default cover.</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveBookDetails}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
