const fs = require('fs');
const path = require('path');

const pageFile = 'src/app/page.tsx';
let content = fs.readFileSync(pageFile, 'utf8');

// --- 1. SpotlightSearch ---
const spotlightContent = `import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) setQuery('');
  }, [isOpen]);

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
          {query ? (
            books.filter(b => b.title.toLowerCase().includes(query.toLowerCase()) || (b.author && b.author.toLowerCase().includes(query.toLowerCase()))).length > 0 ? (
               books.filter(b => b.title.toLowerCase().includes(query.toLowerCase()) || (b.author && b.author.toLowerCase().includes(query.toLowerCase()))).map(book => (
                 <Link href={\`/read?id=\${book.id}\`} key={book.id} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
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
`;
fs.writeFileSync('src/app/components/SpotlightSearch.tsx', spotlightContent);

// --- 2. AnalyticsModal ---
const analyticsContent = `import React from 'react';
import { BarChart2, Flame } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: any[];
  streak: number;
}

export default function AnalyticsModal({ isOpen, onClose, books, streak }: AnalyticsModalProps) {
  if (!isOpen) return null;

  const totalBooks = books.length;
  const totalPagesRead = books.reduce((sum, b) => sum + (b.progress || 0), 0);
  const inProgress = books.filter(b => b.progress && b.progress > 1).length;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="modal-animate-in" style={{ background: 'var(--bg-secondary)', padding: '3rem', borderRadius: '16px', minWidth: '600px', maxWidth: '90%', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><BarChart2 size={48} color="var(--accent)" /></div>
        <h2 style={{ margin: '0 0 2rem 0' }}>Reading Insights</h2>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalPagesRead}</div>
            <div style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Pages Flipped</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalBooks}</div>
            <div style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Total Books</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{inProgress}</div>
            <div style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>In Progress</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {streak} <Flame size={32} fill="#f97316" />
            </div>
            <div style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Day Streak</div>
          </div>
        </div>

        <div style={{ width: '100%', height: '250px', marginBottom: '2rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Mon', pages: Math.floor(Math.random() * 50) + 10 },
              { name: 'Tue', pages: Math.floor(Math.random() * 50) + 20 },
              { name: 'Wed', pages: Math.floor(Math.random() * 50) + 15 },
              { name: 'Thu', pages: Math.floor(Math.random() * 50) + 5 },
              { name: 'Fri', pages: Math.floor(Math.random() * 50) + 30 },
              { name: 'Sat', pages: Math.floor(Math.random() * 50) + 45 },
              { name: 'Sun', pages: Math.floor(Math.random() * 50) + 60 },
            ]}>
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
              />
              <Bar dataKey="pages" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <button className="btn" onClick={onClose} style={{ width: '100%', padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>Close Dashboard</button>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/app/components/AnalyticsModal.tsx', analyticsContent);

// Modify page.tsx
// Add imports
content = content.replace(
  "import BookCard from './components/BookCard';",
  "import BookCard from './components/BookCard';\nimport SpotlightSearch from './components/SpotlightSearch';\nimport AnalyticsModal from './components/AnalyticsModal';"
);

// Remove local state spotlightQuery & searchInputRef
content = content.replace(/const \[spotlightQuery.*?;\n?/, '');
content = content.replace(/const searchInputRef.*?;\n?/, '');

// Remove local useEffect for searchInputRef focus
const useEffectRefRegex = /useEffect\(\(\) => \{\n\s*if \(isSearchOpen && searchInputRef\.current\) {[\s\S]*?\}, \[isSearchOpen\]\);\n?/;
content = content.replace(useEffectRefRegex, '');

// Replace JSX chunks
const spotlightRegex = /{\/\* Spotlight Modal Overlay \*\/}[\s\S]*?(?={\/\* Analytics Modal \*\/})/;
const newSpotlight = `<SpotlightSearch \n          isOpen={isSearchOpen} \n          onClose={() => setIsSearchOpen(false)} \n          books={books} \n          getCoverUrl={getCoverUrl} \n          handleImageError={handleImageError} \n          formatTitle={formatTitle} \n        />\n\n        `;
content = content.replace(spotlightRegex, newSpotlight);

const analyticsRegex = /{\/\* Analytics Modal \*\/}[\s\S]*?(?=<header className="header")/
const newAnalytics = `<AnalyticsModal \n          isOpen={showAnalytics} \n          onClose={() => setShowAnalytics(false)} \n          books={books} \n          streak={streak} \n        />\n\n        `;
content = content.replace(analyticsRegex, newAnalytics);

fs.writeFileSync(pageFile, content);
console.log('Extraction complete!');
