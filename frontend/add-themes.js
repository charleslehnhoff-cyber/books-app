const fs = require('fs');
const file = 'src/app/read/Reader.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Import Settings
content = content.replace(
  /import \{ ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, LayoutGrid, List, Bookmark, Play, Square, Star, FileText, BookOpen, Download \} from 'lucide-react';/,
  "import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, LayoutGrid, List, Bookmark, Play, Square, Star, FileText, BookOpen, Download, Settings, Type } from 'lucide-react';"
);

// 2. Add state
const stateInsertion = `  const [activeTab, setActiveTab] = useState('library');
  const [showSettings, setShowSettings] = useState(false);
  const [readerTheme, setReaderTheme] = useState('dark');
  const [fontFamily, setFontFamily] = useState('sans');
`;
content = content.replace(
  /  const \[activeTab, setActiveTab\] = useState\('library'\);/,
  stateInsertion
);

// 3. Add to Reader UI Header (around Zoom & Fullscreen Controls)
const headerRegex = /\{\/\* Zoom & Fullscreen Controls \*\/\}/;
const headerReplacement = `{/* Settings Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-icon"
                style={{ backgroundColor: showSettings ? 'var(--bg-secondary)' : 'rgba(15, 23, 42, 0.8)', color: '#fff', border: '1px solid var(--bg-secondary)', borderRadius: '0.5rem' }}
                onClick={() => setShowSettings(!showSettings)}
              >
                <span title="Settings"><Settings size={18} /></span>
              </button>
              
              {showSettings && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', zIndex: 100, width: '250px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Theme</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button onClick={() => setReaderTheme('dark')} style={{ flex: 1, padding: '0.5rem', background: '#0f172a', color: '#fff', border: readerTheme === 'dark' ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: '4px', cursor: 'pointer' }}>Dark</button>
                    <button onClick={() => setReaderTheme('light')} style={{ flex: 1, padding: '0.5rem', background: '#f8fafc', color: '#0f172a', border: readerTheme === 'light' ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: '4px', cursor: 'pointer' }}>Light</button>
                    <button onClick={() => setReaderTheme('sepia')} style={{ flex: 1, padding: '0.5rem', background: '#fdf6e3', color: '#5c4b37', border: readerTheme === 'sepia' ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: '4px', cursor: 'pointer' }}>Sepia</button>
                  </div>
                  
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Font</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setFontFamily('sans')} style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: fontFamily === 'sans' ? '1px solid var(--accent)' : '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'sans-serif' }}>Sans</button>
                    <button onClick={() => setFontFamily('serif')} style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: fontFamily === 'serif' ? '1px solid var(--accent)' : '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'serif' }}>Serif</button>
                    <button onClick={() => setFontFamily('opendyslexic')} style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: fontFamily === 'opendyslexic' ? '1px solid var(--accent)' : '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'OpenDyslexic, sans-serif' }}>Dyslexic</button>
                  </div>
                </div>
              )}
            </div>

            {/* Zoom & Fullscreen Controls */}`;
content = content.replace(headerRegex, headerReplacement);

// 4. Apply themes to main container
const mainRegex = /<main style=\{\{ flex: 1, overflow: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' \}\}>/;
const mainReplacement = `<main style={{ flex: 1, overflow: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: readerTheme === 'light' ? '#f8fafc' : readerTheme === 'sepia' ? '#fdf6e3' : 'transparent', fontFamily: fontFamily === 'serif' ? 'serif' : fontFamily === 'opendyslexic' ? 'OpenDyslexic, sans-serif' : 'inherit', filter: (readerTheme === 'light' || readerTheme === 'sepia') && isPdf ? 'invert(1) hue-rotate(180deg)' : 'none' }}>`;
content = content.replace(mainRegex, mainReplacement);

fs.writeFileSync(file, content);
console.log('Done!');
