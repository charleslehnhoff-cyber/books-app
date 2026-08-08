const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add filterBy state and update sortBy
content = content.replace(
  /const \[sortBy, setSortBy\] = useState<'recent' | 'title'>\('recent'\);/,
  "const [sortBy, setSortBy] = useState<'recent' | 'title' | 'author' | 'added'>('recent');\n  const [filterBy, setFilterBy] = useState<'all' | 'unread' | 'inProgress' | 'finished'>('all');"
);

// 2. Add Filter dropdown icons to lucide-react import
content = content.replace(
  /import \{ (.*?)\} from 'lucide-react';/,
  "import { $1, Filter, SortDesc, Flame } from 'lucide-react';"
);

// 3. Update displayedBooks logic
const displayedBooksRegex = /let displayedBooks = books\.filter\(b => \{[\s\S]*?\}\);/;
const displayedBooksReplacement = `let displayedBooks = books.filter(b => {
    // Advanced Filters
    if (filterBy === 'unread') { if (b.progress && b.progress > 1) return false; }
    if (filterBy === 'inProgress') { if (!b.progress || b.progress <= 1 || b.progress >= (b.totalPages || Infinity)) return false; }
    if (filterBy === 'finished') { if (!b.progress || !b.totalPages || b.progress < b.totalPages) return false; }

    if (!selectedShelf) return true;
    if (selectedShelf === 'favorites') return b.collections?.includes('favorites');
    if (selectedShelf === 'recently_added') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return b.uploadDate ? new Date(b.uploadDate) >= thirtyDaysAgo : false;
    }
    if (selectedShelf === 'quick_reads') return (b.totalPages || 0) > 0 && (b.totalPages || 0) < 150;
    if (selectedShelf === 'epics') return (b.totalPages || 0) > 500;
    
    return b.collections && b.collections.includes(selectedShelf);
  });`;
content = content.replace(displayedBooksRegex, displayedBooksReplacement);

// 4. Update sorting logic
const sortingRegex = /if \(sortBy === 'title'\) \{[\s\S]*?\} else if \(sortBy === 'recent'\) \{[\s\S]*?\}/;
const sortingReplacement = `if (sortBy === 'title') {
    displayedBooks.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'author') {
    displayedBooks.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
  } else if (sortBy === 'recent') {
    displayedBooks.sort((a, b) => (b.progress || 0) - (a.progress || 0));
  } else if (sortBy === 'added') {
    displayedBooks.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
  }`;
content = content.replace(sortingRegex, sortingReplacement);

// 5. Add Filters UI to header
const headerUiRegex = /<div style=\{\{ display: 'flex', gap: '1rem', alignItems: 'center' \}\}>/;
const headerUiReplacement = `<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', padding: '0 0.5rem' }}>
              <Filter size={14} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
              <select 
                value={filterBy} 
                onChange={(e) => setFilterBy(e.target.value as any)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', padding: '0.5rem 0', fontSize: '0.9rem' }}
              >
                <option value="all">All Books</option>
                <option value="unread">Unread</option>
                <option value="inProgress">In Progress</option>
                <option value="finished">Finished</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', padding: '0 0.5rem' }}>
              <SortDesc size={14} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', padding: '0.5rem 0', fontSize: '0.9rem' }}
              >
                <option value="recent">Last Read</option>
                <option value="added">Recently Added</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
              </select>
            </div>`;
content = content.replace(headerUiRegex, headerUiReplacement);

// 6. Retroactive Cover Fetching Logic (Metadata)
// Add a function in the fetchBooks useEffect
const fetchBooksRegex = /setBooks\(booksWithProgress\);/;
const fetchBooksReplacement = `setBooks(booksWithProgress);
          
          // Retroactive Cover Fetching
          const booksWithoutCovers = booksWithProgress.filter((b: BookType) => !b.coverUrl).slice(0, 5);
          for (let b of booksWithoutCovers) {
            try {
              const formatted = formatTitle(b.title);
              const gBooksRes = await fetch(\`https://www.googleapis.com/books/v1/volumes?q=intitle:\${encodeURIComponent(formatted)}\`);
              if (gBooksRes.ok) {
                const gData = await gBooksRes.json();
                if (gData.items && gData.items.length > 0) {
                  const item = gData.items[0].volumeInfo;
                  if (item.imageLinks?.thumbnail) {
                    const coverUrl = item.imageLinks.thumbnail.replace('http:', 'https:');
                    await fetch(\`/api/books/\${b.id}\`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ coverUrl })
                    });
                    setBooks(prev => prev.map(book => book.id === b.id ? { ...book, coverUrl } : book));
                  }
                }
              }
            } catch (e) {
              console.log('Cover fetch failed for', b.title);
            }
          }`;
content = content.replace(fetchBooksRegex, fetchBooksReplacement);


fs.writeFileSync(file, content);
console.log('Done adding advanced sorting, filtering, and cover fetching');
