import React, { useState } from 'react';
import { X, Search, Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import Link from 'next/link';

interface Highlight {
  id: string;
  text: string;
  cfi: string;
  color?: string;
  note?: string;
  page?: number;
  date?: string;
}

interface BookType {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  highlights?: Highlight[];
}

export default function AnnotationsSidebar({ 
  books, 
  onClose 
}: { 
  books: BookType[], 
  onClose: () => void 
}) {
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const colorMap: Record<string, string> = {
    yellow: '#fef08a',
    cyan: '#a5f3fc',
    pink: '#fbcfe8',
    green: '#bbf7d0',
    purple: '#ddd6fe'
  };

  const allHighlights = books.flatMap(b => 
    (b.highlights || []).map(h => ({ ...h, book: b }))
  );

  const filtered = allHighlights.filter(h => {
    const matchesSearch = h.text.toLowerCase().includes(search.toLowerCase()) || 
                          h.book.title.toLowerCase().includes(search.toLowerCase()) ||
                          (h.note && h.note.toLowerCase().includes(search.toLowerCase()));
    const matchesColor = !selectedColor || (h.color && h.color.toLowerCase().includes(selectedColor.toLowerCase()));
    return matchesSearch && matchesColor;
  });

  // Export Markdown Study Guide
  const handleExportMarkdown = () => {
    if (filtered.length === 0) return;
    
    const grouped = filtered.reduce((acc, h) => {
      if (!acc[h.book.title]) acc[h.book.title] = { author: h.book.author, highlights: [] };
      acc[h.book.title].highlights.push(h);
      return acc;
    }, {} as Record<string, { author: string; highlights: any[] }>);

    let md = '# 📚 BOOKS - Study Guide & Highlights\n\n';
    for (const [title, data] of Object.entries(grouped)) {
      md += `## ${title}\n*by ${data.author || 'Unknown Author'}*\n\n`;
      for (const h of data.highlights) {
        md += `> "${h.text}"\n\n`;
        if (h.note) md += `**Note:** ${h.note}\n\n`;
        if (h.page) md += `*Page ${h.page}*\n\n`;
      }
      md += '---\n\n';
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Study_Guide_Highlights_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Anki / Quizlet CSV Flashcards
  const handleExportAnkiCSV = () => {
    if (filtered.length === 0) return;

    let csvContent = 'Front,Back,Tags\n';
    for (const h of filtered) {
      const front = `"${h.text.replace(/"/g, '""')}"`;
      const back = `"${(h.note ? `Note: ${h.note}<br><br>` : '')}Source: ${h.book.title.replace(/"/g, '""')} (by ${h.book.author.replace(/"/g, '""')})"`;
      const tags = `"${h.book.title.replace(/[^a-zA-Z0-9]/g, '_')}"`;
      csvContent += `${front},${back},${tags}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Anki_Flashcards_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '420px',
      maxWidth: '100vw',
      backgroundColor: 'var(--bg-primary)',
      borderLeft: '1px solid var(--border-color)',
      zIndex: 1100,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-10px 0 35px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(20px)'
    }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Annotations Hub</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{filtered.length} highlights & notes</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-icon" 
            onClick={handleExportAnkiCSV} 
            title="Export Anki Flashcards (CSV)"
            style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--accent)', borderRadius: '8px', padding: '0.4rem' }}
          >
            <FileSpreadsheet size={18} />
          </button>
          <button 
            className="btn btn-icon" 
            onClick={handleExportMarkdown} 
            title="Export Markdown Study Guide"
            style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--accent)', borderRadius: '8px', padding: '0.4rem' }}
          >
            <FileText size={18} />
          </button>
          <button className="btn btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}>
            <X size={22} />
          </button>
        </div>
      </div>
      
      {/* Search & Multi-Color Filter Bar */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }} />
          <input 
            type="text" 
            placeholder="Search quotes or notes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.9rem' }}
          />
        </div>

        {/* Color Palette Filter Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter Color:</span>
          <div 
            onClick={() => setSelectedColor(null)}
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: selectedColor === null ? 'var(--accent)' : 'var(--bg-secondary)',
              color: selectedColor === null ? '#000' : 'var(--text-secondary)'
            }}
          >
            All
          </div>
          {Object.entries(colorMap).map(([name, hex]) => (
            <div
              key={name}
              onClick={() => setSelectedColor(selectedColor === name ? null : name)}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: hex,
                cursor: 'pointer',
                border: selectedColor === name ? '2px solid #fff' : '2px solid transparent',
                boxShadow: selectedColor === name ? `0 0 8px ${hex}` : 'none'
              }}
              title={`Filter ${name} highlights`}
            />
          ))}
        </div>
      </div>

      {/* Highlights List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem', padding: '1rem' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>No highlights found</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Select text while reading a book or magazine to save quotes & margin notes here.</p>
          </div>
        ) : (
          filtered.map(h => (
            <Link 
              key={h.id + h.book.id} 
              href={`/read?id=${h.book.id}&cfi=${encodeURIComponent(h.cfi)}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ 
                padding: '1rem', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '10px',
                borderLeft: `4px solid ${h.color ? (colorMap[h.color] || h.color) : 'var(--accent)'}`,
                borderTop: '1px solid var(--border-color)',
                borderRight: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <p style={{ margin: '0 0 0.6rem 0', fontStyle: 'italic', fontSize: '0.92rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>"{h.text}"</p>
                
                {h.note && (
                  <div style={{ margin: '0.5rem 0', padding: '0.5rem 0.75rem', background: 'rgba(0, 204, 255, 0.08)', borderRadius: '6px', borderLeft: '2px solid var(--accent)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <strong>Note:</strong> {h.note}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {h.book.coverUrl && <img src={h.book.coverUrl} alt="Cover" style={{ width: '18px', height: '26px', objectFit: 'cover', borderRadius: '2px' }} />}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{h.book.title}</span>
                  </div>
                  {h.page && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>P. {h.page}</span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
