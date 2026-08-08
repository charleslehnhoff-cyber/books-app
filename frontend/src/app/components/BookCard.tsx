import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Edit3, Trash2, MoreVertical, Library } from 'lucide-react';
import { SphaerusHeart, SphaerusLibrary } from './BrandIcons';
import { BookType } from '../../types';

interface BookCardProps {
  book: BookType;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  isActiveMenu: boolean;
  heroColor: string;
  onToggleSelection: (id: string) => void;
  onToggleMenu: (id: string | null) => void;
  onToggleShelf: (book: BookType, shelf: string) => void;
  onManageShelves: (id: string) => void;
  onEditDetails: (id: string, title: string, author: string, coverUrl: string) => void;
  onDeleteBook: (id: string) => void;
  onShowDetails: (book: BookType) => void;
  getCoverUrl: (book: BookType) => string;
  handleImageError: (e: any, book: BookType) => void;
  formatTitle: (title: string) => string;
  priority?: boolean;
}

const BookCard = React.memo(({
  book,
  viewMode,
  isSelected,
  isActiveMenu,
  heroColor,
  onToggleSelection,
  onToggleMenu,
  onToggleShelf,
  onManageShelves,
  onEditDetails,
  onDeleteBook,
  onShowDetails,
  getCoverUrl,
  handleImageError,
  formatTitle,
  priority = false
}: BookCardProps) => {
  if (viewMode === 'list') {
    return (
      <div className={`book-card-container ${isSelected ? 'has-selection' : ''}`} draggable={true} onDragStart={(e) => e.dataTransfer.setData('bookId', book.id)} style={{ position: 'relative' }}>
        <div 
          onClick={() => onShowDetails(book)}
          style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', transition: 'background 0.2s', cursor: 'pointer' }} 
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'} 
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
        >
            
            <div className="book-checkbox" style={{ marginRight: '1rem' }}>
              <input 
                type="checkbox" 
                checked={isSelected} 
                onChange={(e) => { e.stopPropagation(); onToggleSelection(book.id); }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative', width: '40px', height: '60px', marginRight: '1rem', flexShrink: 0 }}>
                <Image 
                  src={getCoverUrl(book)} 
                  alt={`Cover of ${book.title}`} 
                  fill
                  sizes="40px"
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                  onError={(e) => handleImageError(e, book)}
                  priority={priority}
                />
              </div>
              {book.collections?.includes('favorites') && (
                <div style={{ position: 'absolute', top: '-0.25rem', right: '0.75rem', zIndex: 4, background: 'rgba(0,0,0,0.8)', borderRadius: '50%', padding: '0.15rem' }}>
                  <SphaerusHeart size={10} fill="#ef4444" color="#ef4444" />
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatTitle(book.title)}</div>
              {book.author && book.author !== 'Unknown Author' && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.author}</div>
              )}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
              {book.progress && book.progress > 1 ? (
                 <span style={{ background: 'rgba(0, 204, 255, 0.1)', color: 'var(--accent)', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Page {book.progress}</span>
              ) : null}
            </div>
            
            <button 
              className="btn btn-icon book-menu-trigger"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleMenu(isActiveMenu ? null : book.id);
              }}
              style={{ marginLeft: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
              aria-label="Book options"
            >
              <MoreVertical size={18} />
            </button>
          </div>

        {/* Context Menu Dropdown */}
        {isActiveMenu && (
          <div 
            className="context-menu-dropdown"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'absolute', top: '2.5rem', right: '0', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', zIndex: 20, minWidth: '160px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
          >
            <button 
              onClick={() => { onToggleMenu(null); onToggleShelf(book, 'favorites'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              <SphaerusHeart size={16} fill={book.collections?.includes('favorites') ? '#ef4444' : 'none'} color={book.collections?.includes('favorites') ? '#ef4444' : 'currentColor'} /> Favorite
            </button>
            <button 
              onClick={() => { onToggleMenu(null); onManageShelves(book.id); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              <SphaerusLibrary size={16} /> Manage Shelves
            </button>
            <button 
              onClick={() => { 
                onToggleMenu(null); 
                onEditDetails(book.id, book.title, book.author || '', book.coverUrl || '');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              <Edit3 size={16} /> Edit Details
            </button>
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.25rem 0' }} />
            <button 
              onClick={() => { onToggleMenu(null); onDeleteBook(book.id); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '4px' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              <Trash2 size={16} /> Delete Book
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      style={{ position: 'relative' }}
      className={`book-card-container ${isSelected ? 'has-selection' : ''}`}
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('bookId', book.id);
      }}
    >
      <div onClick={() => onShowDetails(book)} style={{ cursor: 'pointer' }}>
        <div className="book-card book-card-3d">
          <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <Image 
              src={getCoverUrl(book)} 
              alt={`Cover of ${book.title}`} 
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              className="book-cover-image"
              style={{ objectFit: 'contain', transition: 'transform 0.4s ease' }}
              onError={(e) => handleImageError(e, book)}
              priority={priority}
            />
          </div>
          
          <div className="book-checkbox" style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 10 }}>
            <input 
              type="checkbox" 
              checked={isSelected} 
              onChange={(e) => { e.stopPropagation(); onToggleSelection(book.id); }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
          </div>

          {book.collections?.includes('favorites') && (
            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 4, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '0.25rem' }}>
              <SphaerusHeart size={16} fill="#ef4444" color="#ef4444" />
            </div>
          )}

          {book.progress && book.progress > 1 && (
            <div className="book-progress-bar">
              <div className="book-progress-fill" style={{ width: `${book.progressPercent || Math.min(100, Math.max(5, ((book.progress || 0) / 300) * 100))}%` }}></div>
            </div>
          )}
          
          <div className="book-info">
            <div className="book-title" title={formatTitle(book.title)}>{formatTitle(book.title)}</div>
            {book.author && book.author !== 'Unknown Author' && (
              <div className="book-author" title={book.author}>{book.author}</div>
            )}
          </div>
        </div>
      </div>

      <button 
        className="btn btn-icon book-menu-trigger"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleMenu(isActiveMenu ? null : book.id);
        }}
        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff', padding: '0.25rem', width: '32px', height: '32px', opacity: isActiveMenu ? 1 : 0, transition: 'opacity 0.2s', zIndex: 5 }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
        onMouseOut={(e) => e.currentTarget.style.opacity = isActiveMenu ? '1' : '0'}
        aria-label="Book options"
      >
        <MoreVertical size={18} />
      </button>

      {/* Context Menu Dropdown */}
      {isActiveMenu && (
        <div 
          className="context-menu-dropdown"
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: '2.5rem', right: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', zIndex: 20, minWidth: '160px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
        >
          <button 
            onClick={() => { onToggleMenu(null); onToggleShelf(book, 'favorites'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            <SphaerusHeart size={16} fill={book.collections?.includes('favorites') ? '#ef4444' : 'none'} color={book.collections?.includes('favorites') ? '#ef4444' : 'currentColor'} /> Favorite
          </button>
          <button 
            onClick={() => { onToggleMenu(null); onManageShelves(book.id); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            <SphaerusLibrary size={16} /> Manage Shelves
          </button>
          <button 
            onClick={() => { 
              onToggleMenu(null); 
              onEditDetails(book.id, book.title, book.author || '', book.coverUrl || '');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            <Edit3 size={16} /> Edit Details
          </button>
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.25rem 0' }} />
          <button 
            onClick={() => { onToggleMenu(null); onDeleteBook(book.id); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '4px' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            <Trash2 size={16} /> Delete Book
          </button>
        </div>
      )}
    </div>
  );
});

BookCard.displayName = 'BookCard';

export default BookCard;
