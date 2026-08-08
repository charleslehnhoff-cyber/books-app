import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
  books: any[];
  getCoverUrl: (book: any) => string;
  handleImageError: (e: any, book: any) => void;
  formatTitle: (title: string) => string;
}

export default function SpotlightSearch({ isOpen, onClose, books, getCoverUrl, handleImageError, formatTitle }: SpotlightSearchProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) setQuery('');
  }, [isOpen]);

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
    <div className="modal-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', paddingTop: '10vh' }} onClick={onClose}>
      <div className="modal-animate-in" style={{ width: '90%', maxWidth: '650px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '70vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <Search size={24} color="var(--text-secondary)" />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search books, authors..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', outline: 'none', marginLeft: '1rem' }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>ESC</div>
        </div>
        <div style={{ overflowY: 'auto', padding: '1rem' }}>
          {debouncedQuery ? (
            books.filter(b => b.title.toLowerCase().includes(debouncedQuery.toLowerCase()) || (b.author && b.author.toLowerCase().includes(debouncedQuery.toLowerCase()))).length > 0 ? (
               books.filter(b => b.title.toLowerCase().includes(debouncedQuery.toLowerCase()) || (b.author && b.author.toLowerCase().includes(debouncedQuery.toLowerCase()))).map(book => (
                 <Link href={`/read?id=${book.id}`} key={book.id} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                   <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }} className="spotlight-result">
                      <img src={getCoverUrl(book)} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginRight: '1rem' }} onError={(e) => handleImageError(e, book)} loading="lazy" decoding="async" alt={book.title} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{formatTitle(book.title)}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{book.author}</div>
                      </div>
                   </div>
                 </Link>
               ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No results found.</div>
            )
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Start typing to search your library...</div>
          )}
        </div>
      </div>
    </div>
  );
}
