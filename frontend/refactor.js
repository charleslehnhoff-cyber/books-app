const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add export to BookType
content = content.replace(
  'type BookType = {',
  'export type BookType = {'
);

// 2. Add BookCard import
content = content.replace(
  "import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';",
  "import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';\nimport BookCard from './components/BookCard';"
);

// 3. Replace Grid View
const gridRegex = /<div className="books-grid">[\s\S]*?(?=<\/div>\s*\) : \()/;
const gridReplacement = `<div className="books-grid">
              {displayedBooks.slice(0, visibleCount).map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  viewMode="grid"
                  isSelected={selectedBooks.includes(book.id)}
                  isActiveMenu={activeBookMenu === book.id}
                  heroColor={heroColor}
                  onToggleSelection={toggleBookSelection}
                  onToggleMenu={setActiveBookMenu}
                  onToggleShelf={handleToggleShelf}
                  onManageShelves={setActiveShelfModal}
                  onEditDetails={(id, title, author, coverUrl) => { setActiveEditModal(id); setEditForm({ title, author, coverUrl }); }}
                  onDeleteBook={handleDeleteBook}
                  getCoverUrl={getCoverUrl}
                  handleImageError={handleImageError}
                  formatTitle={formatTitle}
                />
              ))}`;
content = content.replace(gridRegex, gridReplacement);

// 4. Replace List View
const listRegex = /<div className="books-list"[\s\S]*?(?=<\/div>\s*\)\s*}\s*<\/div>\s*<\/main>)/;
const listReplacement = `<div className="books-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {displayedBooks.slice(0, visibleCount).map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  viewMode="list"
                  isSelected={selectedBooks.includes(book.id)}
                  isActiveMenu={activeBookMenu === book.id}
                  heroColor={heroColor}
                  onToggleSelection={toggleBookSelection}
                  onToggleMenu={setActiveBookMenu}
                  onToggleShelf={handleToggleShelf}
                  onManageShelves={setActiveShelfModal}
                  onEditDetails={(id, title, author, coverUrl) => { setActiveEditModal(id); setEditForm({ title, author, coverUrl }); }}
                  onDeleteBook={handleDeleteBook}
                  getCoverUrl={getCoverUrl}
                  handleImageError={handleImageError}
                  formatTitle={formatTitle}
                />
              ))}
            </div>
          )}

          {/* Manage Shelves Modal */}
          {activeShelfModal !== null && (
            <div 
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setActiveShelfModal(null)}
            >
              <div 
                style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', minWidth: '350px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>Manage Shelves</h3>
                  <button className="btn btn-icon" onClick={() => setActiveShelfModal(null)}><X size={20} /></button>
                </div>
                <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {shelves.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No shelves created yet.</p>
                  ) : (
                    shelves.map(shelf => {
                      const book = books.find(b => b.id === activeShelfModal);
                      const inShelf = book?.collections?.includes(shelf.id);
                      return (
                        <label key={shelf.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '8px', cursor: 'pointer', border: '1px solid transparent' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                          <input 
                            type="checkbox" 
                            checked={inShelf || false} 
                            onChange={() => book && handleToggleShelf(book, shelf.id)} 
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '1.1rem' }}>{shelf.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>`;
content = content.replace(listRegex, listReplacement);

fs.writeFileSync(file, content);
console.log('Done!');
