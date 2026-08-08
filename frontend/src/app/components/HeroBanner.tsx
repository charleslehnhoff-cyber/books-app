import React from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { BookType } from '../../types';

interface HeroBannerProps {
  heroBook: BookType | null;
  heroColor: string;
  theme: string;
  getCoverUrl: (book: BookType) => string;
  formatTitle: (title: string) => string;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, book: BookType) => void;
}

export default function HeroBanner({
  heroBook,
  heroColor,
  theme,
  getCoverUrl,
  formatTitle,
  handleImageError
}: HeroBannerProps) {
  if (!heroBook) return null;

  return (
    <div style={{ 
      marginBottom: '3rem', 
      borderRadius: '16px', 
      border: '1px solid var(--border-color)',
      display: 'flex',
      gap: '2rem',
      alignItems: 'center',
      boxShadow: `0 10px 40px ${heroColor}`,
      position: 'relative',
      overflow: 'hidden',
      backgroundImage: `url('${getCoverUrl(heroBook)}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      transition: 'box-shadow 0.5s ease'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backdropFilter: 'blur(40px)',
        background: theme === 'dark' 
          ? 'linear-gradient(to right, rgba(15,23,42,1) 0%, rgba(15,23,42,0.8) 50%, rgba(15,23,42,0.4) 100%)'
          : 'linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.4) 100%)',
        zIndex: 0
      }} />

      <div className="book-card hero-book-container" style={{ zIndex: 1, display: 'flex', gap: '2rem', alignItems: 'center', padding: '2.5rem', width: '100%',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)', 
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)' }}>
        <img 
          src={getCoverUrl(heroBook)} 
          alt={heroBook.title} 
          style={{ width: '140px', height: '200px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 12px 24px rgba(0,0,0,0.5)' }}
          onError={(e) => handleImageError(e, heroBook)}
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-book-info" style={{ flex: 1 }}>
          <div style={{ color: heroColor !== 'rgba(0, 204, 255, 0.4)' ? heroColor.replace('0.8)', '1)') : 'var(--accent)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Continue Reading</div>
          <h2 className="hero-book-title" style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{formatTitle(heroBook.title)}</h2>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>You left off on Page {heroBook.progress}.</div>
            <div style={{ width: '100%', maxWidth: '300px', background: 'rgba(255,255,255,0.2)', height: '6px', borderRadius: '3px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
              <div style={{ width: `${heroBook.progressPercent || Math.min(100, Math.max(5, ((heroBook.progress || 0) / 300) * 100))}%`, height: '100%', background: heroColor !== 'rgba(0, 204, 255, 0.4)' ? heroColor.replace('0.8)', '1)') : 'var(--accent)', borderRadius: '3px' }}></div>
            </div>
          </div>
          <Link href={`/read?id=${heroBook.id}`} style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: heroColor !== 'rgba(0, 204, 255, 0.4)' ? heroColor.replace('0.8)', '1)') : 'var(--accent)', border: 'none', boxShadow: `0 4px 12px ${heroColor}` }}>
              <Play size={18} fill="currentColor" /> Jump Back In
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
