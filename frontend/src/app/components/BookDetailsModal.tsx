import React, { useEffect, useState } from 'react';
import { X, BookOpen, Clock, Calendar, Hash, FileText } from 'lucide-react';
import Link from 'next/link';
import { BookType } from '../../types';

interface BookDetailsModalProps {
  book: BookType;
  onClose: () => void;
  getCoverUrl: (book: BookType) => string;
  formatTitle: (title: string) => string;
}

export default function BookDetailsModal({
  book,
  onClose,
  getCoverUrl,
  formatTitle
}: BookDetailsModalProps) {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    // Fetch detailed metadata including synopsis from EPUB/PDF
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`/api/books/${book.id}`);
        if (res.ok) {
          const data = await res.json();
          setMetadata(data);
        }
      } catch (err) {
        console.error("Failed to fetch book metadata", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, [book.id]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10 }}
        >
          <X size={20} />
        </button>

        <div className="modal-left-panel">
          <img 
            src={getCoverUrl(book)} 
            alt={book.title} 
            className="modal-cover-image"
          />
          <Link href={`/read?id=${book.id}`} style={{ width: '100%', textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <BookOpen size={18} />
              {book.progress && book.progress > 0 ? 'Continue Reading' : 'Start Reading'}
            </button>
          </Link>
          
          {book.progress && book.progress > 0 && (
            <div style={{ width: '100%', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <span>Progress</span>
                <span>{Math.round(book.progressPercent || ((book.progress || 0) / 300) * 100)}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--accent)', width: `${book.progressPercent || Math.min(100, Math.max(0, ((book.progress || 0) / 300) * 100))}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-right-panel">
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }}>{formatTitle(book.title)}</h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {book.author && book.author !== 'Unknown Author' ? book.author : 'Unknown Author'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <FileText size={14} /> Pages
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{metadata?.pageCount || book.totalPages || '--'}</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <Calendar size={14} /> Published
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{metadata?.publishedYear || '--'}</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <Hash size={14} /> Format
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', textTransform: 'uppercase' }}>
                {book.title.includes('.') ? book.title.split('.').pop() : 
                 book.id.includes('.') ? book.id.split('.').pop() : 
                 metadata?.format || '--'}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Synopsis</h3>
            {loading ? (
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', animation: 'pulse 2s infinite' }}>Loading synopsis...</div>
            ) : metadata?.description ? (
              <div style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '0.95rem', opacity: 0.9 }}>
                {metadata.description.length > 800 ? `${metadata.description.substring(0, 800)}...` : metadata.description}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No synopsis available for this title.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
