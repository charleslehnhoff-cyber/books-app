import React from 'react';
import { X, Search, Download } from 'lucide-react';
import Link from 'next/link';

interface Highlight {
  id: string;
  text: string;
  cfi: string;
  color: string;
  note: string;
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
  const [search, setSearch] = React.useState('');

  const allHighlights = books.flatMap(b => 
    (b.highlights || []).map(h => ({ ...h, book: b }))
  );

  const filtered = allHighlights.filter(h => 
    h.text.toLowerCase().includes(search.toLowerCase()) || 
    h.book.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    if (filtered.length === 0) return;
    
    // Group highlights by book
    const grouped = filtered.reduce((acc, h) => {
      if (!acc[h.book.title]) acc[h.book.title] = { author: h.book.author, highlights: [] };
      acc[h.book.title].highlights.push(h);
      return acc;
    }, {} as Record<string, { author: string; highlights: any[] }>);

    let md = '# My Highlights\\n\\n';
    for (const [title, data] of Object.entries(grouped)) {
      md += `## ${title}\\n*by ${data.author || 'Unknown Author'}*\\n\\n`;
      for (const h of data.highlights) {
        md += `> ${h.text}\\n\\n`;
        if (h.note) md += `**Note:** ${h.note}\\n\\n`;
      }
      md += '---\\n\\n';
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'highlights.md';
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
      width: '400px',
      backgroundColor: 'var(--bg-primary)',
      borderLeft: '1px solid var(--border-color)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-10px 0 25px rgba(0,0,0,0.5)'
    }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Annotations Hub</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-icon" 
            onClick={handleExport} 
            title="Export to Markdown"
            style={{ border: 'none', background: 'transparent', color: 'var(--accent)' }}
          >
            <Download size={20} />
          </button>
          <button className="btn btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}>
            <X size={24} />
          </button>
        </div>
      </div>
      
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '99px' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }} />
          <input 
            type="text" 
            placeholder="Search highlights..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%' }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>No highlights found.</p>
        ) : (
          filtered.map(h => (
            <Link 
              key={h.id + h.book.id} 
              href={`/read?id=${h.book.id}&cfi=${encodeURIComponent(h.cfi)}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ 
                marginBottom: '1rem', 
                padding: '1rem', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px',
                borderLeft: `4px solid ${h.color || 'var(--accent)'}`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <p style={{ margin: '0 0 0.5rem 0', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: '1.5' }}>"{h.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {h.book.coverUrl && <img src={h.book.coverUrl} alt="Cover" style={{ width: '20px', height: '30px', objectFit: 'cover', borderRadius: '2px' }} />}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{h.book.title}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
