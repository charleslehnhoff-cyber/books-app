"use client";

import { useEffect, useState, useRef } from 'react';
import { Book, Library, Settings, Search, Plus, Moon, Sun, BookOpen, Trash2, MoreVertical, X, LayoutGrid, List, Play, Command, Heart, Edit3, BarChart2, UploadCloud, CheckCircle, FileText, Clock, Zap, Award, Filter, SortDesc, Flame, Menu, Download, Sparkles } from 'lucide-react';
import { SphaerusLibrary, SphaerusHeart, SphaerusClock, SphaerusZap, SphaerusAward } from './components/BrandIcons';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import BookCard from './components/BookCard';
import BookDetailsModal from './components/BookDetailsModal';
import AnnotationsSidebar from './components/AnnotationsSidebarPanel';

export type BookType = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  cover?: string;
  collections?: string[];
  progress?: number;
  currentPage?: number;
  progressPercent?: number;
  uploadDate?: string;
  totalPages?: number;
};

export type ShelfType = {
  id: string;
  name: string;
  order: number;
  icon?: string;
  color?: string;
};

type UploadTask = {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
};

const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

const getFallbackSvg = (title: string) => {
  const hash = getHash(title || 'book');
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  const color1 = `hsl(${h1}, 60%, 25%)`;
  const color2 = `hsl(${h2}, 60%, 15%)`;
  
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'>
    <defs>
      <linearGradient id='grad_${Math.abs(hash)}' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' style='stop-color:${color1};stop-opacity:1' />
        <stop offset='100%' style='stop-color:${color2};stop-opacity:1' />
      </linearGradient>
    </defs>
    <rect width='300' height='450' fill='url(#grad_${Math.abs(hash)})' />
    <g transform="translate(110, 185) scale(3.3)">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
      </svg>
    </g>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const formatTitle = (title: string) => {
  if (!title) return "Untitled";
  return title
    .replace(/\.(pdf|epub)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b(sample|issue)\b/gi, '')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ');
};

const getCoverUrl = (book: BookType | null | undefined) => {
  if (!book) return getFallbackSvg('');
  if (book.coverUrl && book.coverUrl.startsWith('http')) return book.coverUrl.replace('http:', 'https:');
  return `/api/books/${book.id}/cover`;
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, book: BookType) => {
  const target = e.currentTarget;
  if (!target.src.includes('/api/books/') && !target.src.includes('data:image')) {
    target.src = `/api/books/${book.id}/cover?t=${Date.now()}`;
  } else if (!target.src.includes('data:image')) {
    target.src = getFallbackSvg(book.title);
  }
};

export default function Home() {
  const [books, setBooks] = useState<BookType[]>([]);
  const [shelves, setShelves] = useState<ShelfType[]>([]);
  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);
  
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);

  const [spotlightQuery, setSpotlightQuery] = useState('');
  const [activeBookMenu, setActiveBookMenu] = useState<string | null>(null);
  const [activeShelfModal, setActiveShelfModal] = useState<string | null>(null);
  const [activeEditModal, setActiveEditModal] = useState<string | null>(null);
  const [selectedDetailBook, setSelectedDetailBook] = useState<BookType | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'shelf'>('shelf');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'author' | 'added'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'unread' | 'inProgress' | 'finished'>('all');
  const [isDragOverShelf, setIsDragOverShelf] = useState<string | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<ShelfType | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [heroColor, setHeroColor] = useState('rgba(0, 204, 255, 0.4)');
  const [editForm, setEditForm] = useState({ title: '', author: '', coverUrl: '' });

  const [visibleCount, setVisibleCount] = useState(100);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      const savedStreak = localStorage.getItem('reading-streak');
      if (savedStreak) {
        setStreak(Number(savedStreak));
      } else {
        // Mock a 5 day streak for the demo if nothing exists
        localStorage.setItem('reading-streak', '5');
        setStreak(5);
      }
    } catch (e) {
      setStreak(0);
    }
  }, []);

  useEffect(() => {
    const contentArea = document.querySelector('.content-area');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 50);
        }
      },
      { root: contentArea, threshold: 0.1, rootMargin: '400px' }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const fetchOpts: RequestInit = { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' } };
        const [booksRes, shelvesRes] = await Promise.all([
          fetch('/api/books?limit=1000', fetchOpts),
          fetch('/api/shelves', fetchOpts)
        ]);
        if (booksRes.ok) {
          const data = await booksRes.json();
          const booksWithProgress = data.map((b: BookType) => {
            let p = b.currentPage || null;
            let t = b.totalPages || null;
            try {
              const localP = localStorage.getItem(`book-progress-${b.id}`);
              if (localP && !isNaN(Number(localP))) {
                p = Math.max(p || 1, Number(localP));
              }
            } catch (e) {
              // Ignore localStorage errors in incognito/strict modes
            }
            
            if (p) {
              let progressPercent = 0;
              if (t && t > 0) {
                progressPercent = (p / t) * 100;
              } else {
                progressPercent = Math.min(100, Math.max(5, (p / 300) * 100));
              }
              return { ...b, progress: p, progressPercent };
            }
            return b;
          });
          setBooks(booksWithProgress);
          
          // Retroactive Cover Fetching
          const booksWithoutCovers = booksWithProgress.filter((b: BookType) => !b.coverUrl).slice(0, 5);
          for (let b of booksWithoutCovers) {
            try {
              const formatted = formatTitle(b.title);
              const gBooksRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(formatted)}`);
              if (gBooksRes.ok) {
                const gData = await gBooksRes.json();
                if (gData.items && gData.items.length > 0) {
                  const item = gData.items[0].volumeInfo;
                  if (item.imageLinks?.thumbnail) {
                    const coverUrl = item.imageLinks.thumbnail.replace('http:', 'https:');
                    await fetch(`/api/books/${b.id}`, {
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
          }
        }
        if (shelvesRes.ok) {
          const shelvesData = await shelvesRes.json();
          setShelves(shelvesData);
        }
      } catch (err) {
        console.error('Failed to fetch books', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const heroBook = !selectedShelf || selectedShelf === 'favorites' ? books.filter(b => b.progress && b.progress > 1 && (!b.progressPercent || b.progressPercent < 99)).sort((a, b) => (b.progress || 0) - (a.progress || 0))[0] : null;

  useEffect(() => {
    if (heroBook) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = getCoverUrl(heroBook);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const data = ctx.getImageData(0, 0, 1, 1).data;
          if (data[0] > 10 || data[1] > 10 || data[2] > 10) {
            setHeroColor(`rgba(${data[0]}, ${data[1]}, ${data[2]}, 0.8)`);
          }
        }
      };
    }
  }, [heroBook?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.book-menu-trigger') || target.closest('.context-menu-dropdown')) {
        return;
      }
      setActiveBookMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('app-theme') || 'dark';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('app-theme', newTheme);
    } catch (e) {}
  };

  const handleStartUploads = (files: File[]) => {
    const newUploads = files.map(f => ({ id: Math.random().toString(), file: f, progress: 0, status: 'uploading' as const }));
    setUploads(prev => [...prev, ...newUploads]);
    
    newUploads.forEach(upload => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('pdf', upload.file);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: percent } : u));
        }
      };
      
      xhr.onload = async () => {
        if (xhr.status === 201) {
          setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'done', progress: 100 } : u));
          const data = JSON.parse(xhr.responseText);
          let newBook = data.book;
          setBooks(prev => [newBook, ...prev]);
          
          try {
            const formatted = formatTitle(newBook.title);
            const gBooksRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(formatted)}`);
            if (gBooksRes.ok) {
              const gData = await gBooksRes.json();
              if (gData.items && gData.items.length > 0) {
                const item = gData.items[0].volumeInfo;
                const updatedTitle = item.title || newBook.title;
                const updatedAuthor = item.authors ? item.authors[0] : newBook.author;
                let updatedCoverUrl = newBook.coverUrl;
                if (!updatedCoverUrl && item.imageLinks?.thumbnail) {
                  updatedCoverUrl = item.imageLinks.thumbnail.replace('http:', 'https:');
                }
                const putRes = await fetch(`/api/books/${newBook.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: updatedTitle, author: updatedAuthor, coverUrl: updatedCoverUrl })
                });
                if (putRes.ok) {
                  newBook = { ...newBook, title: updatedTitle, author: updatedAuthor, coverUrl: updatedCoverUrl };
                  setBooks(prev => prev.map(b => b.id === newBook.id ? newBook : b));
                }
              }
            }
          } catch (e) {
            console.error('Metadata fetch failed', e);
          }

          setTimeout(() => {
             setUploads(prev => prev.filter(u => u.id !== upload.id));
          }, 3000);
        } else {
          setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error' } : u));
          setTimeout(() => {
            setUploads(prev => prev.filter(u => u.id !== upload.id));
         }, 5000);
        }
      };
      
      xhr.onerror = () => {
        setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error' } : u));
        setTimeout(() => {
          setUploads(prev => prev.filter(u => u.id !== upload.id));
       }, 5000);
      };
      
      xhr.open('POST', '/api/books/upload');
      xhr.send(formData);
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;
    setIsUploadModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => {
      handleStartUploads(files);
    }, 100);
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsGlobalDragOver(true);
    }
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragOver(false);
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.epub'));
    if (files.length > 0) {
      setIsUploadModalOpen(false);
      handleStartUploads(files);
    }
  };

  const handleNewShelf = async () => {
    const name = window.prompt("Enter new shelf name:");
    if (!name) return;
    try {
      const res = await fetch('/api/shelves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const newShelf = await res.json();
        setShelves([...shelves, newShelf]);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteShelf = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this shelf?")) return;
    try {
      const res = await fetch(`/api/shelves/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setShelves(shelves.filter(s => s.id !== id));
        if (selectedShelf === id) setSelectedShelf(null);
      }
    } catch (err) { console.error(err); }
  };

  const handleRenameShelf = async (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = window.prompt("Enter new shelf name:", currentName);
    if (!newName || newName === currentName) return;
    try {
      const res = await fetch(`/api/shelves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        setShelves(shelves.map(s => s.id === id ? { ...s, name: newName } : s));
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteBook = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBooks(books.filter(b => b.id !== id));
        setSelectedBooks(selectedBooks.filter(selectedId => selectedId !== id));
      }
    } catch (err) { console.error(err); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedBooks.length} books?`)) return;
    for (const bookId of selectedBooks) {
      try {
        const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
        if (res.ok) {
          setBooks(prev => prev.filter(b => b.id !== bookId));
        }
      } catch (err) { console.error(err); }
    }
    setSelectedBooks([]);
  };

  const handleToggleShelf = async (book: BookType, shelfId: string, forceAdd?: boolean) => {
    const currentCollections = book.collections || [];
    const newCollections = forceAdd 
      ? Array.from(new Set([...currentCollections, shelfId])) 
      : currentCollections.includes(shelfId)
        ? currentCollections.filter(id => id !== shelfId)
        : [...currentCollections, shelfId];
      
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collections: newCollections })
      });
      if (res.ok) {
        setBooks(books.map(b => b.id === book.id ? { ...b, collections: newCollections } : b));
      }
    } catch (err) { console.error(err); }
  };

  const handleSaveBookDetails = async () => {
    if (!activeEditModal) return;
    try {
      const res = await fetch(`/api/books/${activeEditModal}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setBooks(books.map(b => b.id === activeEditModal ? { ...b, title: editForm.title, author: editForm.author, coverUrl: editForm.coverUrl } : b));
        setActiveEditModal(null);
      }
    } catch (err) { console.error(err); }
  };

  const handleBulkToggleShelf = async (shelfId: string) => {
    for (const bookId of selectedBooks) {
       const book = books.find(b => b.id === bookId);
       if (book && !book.collections?.includes(shelfId)) {
          await handleToggleShelf(book, shelfId, true);
       }
    }
    setActiveShelfModal(null);
    setSelectedBooks([]);
  };

  const toggleBookSelection = (id: string) => {
    setSelectedBooks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const handleDragOver = (e: React.DragEvent, shelfId: string) => {
    e.preventDefault();
    if (isDragOverShelf !== shelfId) setIsDragOverShelf(shelfId);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverShelf(null);
  };

  const handleDropToShelf = (e: React.DragEvent, shelfId: string) => {
    e.preventDefault();
    setIsDragOverShelf(null);
    const bookId = e.dataTransfer.getData('bookId');
    if (bookId) {
      const book = books.find(b => b.id === bookId);
      if (book) {
        handleToggleShelf(book, shelfId, true);
      }
    }
  };

  let displayedBooks = books.filter(b => {
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
  });

  if (sortBy === 'title') {
    displayedBooks.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'author') {
    displayedBooks.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
  } else if (sortBy === 'recent') {
    displayedBooks.sort((a, b) => (b.progress || 0) - (a.progress || 0));
  } else if (sortBy === 'added') {
    displayedBooks.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
  }

  // Analytics Calculation
  const totalBooks = books.length;
  const totalPagesRead = books.reduce((sum, b) => sum + (b.progress || 0), 0);
  const inProgress = books.filter(b => b.progress && b.progress > 1).length;

  return (
    <div 
      className="app-container"
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}
    >
      <style>{`
        .book-card-3d {
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .book-card-3d:hover {
          transform: translateY(-10px) rotateX(4deg) rotateY(-4deg) scale(1.02);
          box-shadow: -15px 15px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.05);
        }
        .book-card-3d:hover::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%);
          pointer-events: none;
          border-radius: 8px;
        }
        .shelf-drop-zone {
          transition: background-color 0.2s, transform 0.2s;
        }
        .shelf-drop-zone.drag-over {
          background-color: rgba(0, 204, 255, 0.2);
          transform: scale(1.02);
          border: 1px dashed var(--accent);
        }
        .shelf-item .shelf-actions {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .shelf-item:hover .shelf-actions {
          opacity: 1;
        }
        .book-card-container .book-checkbox {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .book-card-container:hover .book-checkbox {
          opacity: 1;
        }
        .book-card-container.has-selection .book-checkbox {
          opacity: 1;
        }
        .spotlight-result {
          transition: background 0.2s;
        }
        .spotlight-result:hover {
          background: rgba(0, 204, 255, 0.2);
        }
        .global-drop-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: #fff;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .global-drop-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }
        option {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }
      `}</style>

      {/* Global Drop Overlay */}
      <div className={`global-drop-overlay ${isGlobalDragOver ? 'active' : ''}`}>
        <div style={{ background: 'rgba(0, 204, 255, 0.1)', padding: '4rem', borderRadius: '50%', marginBottom: '2rem', border: '2px dashed var(--accent)' }}>
          <UploadCloud size={80} color="var(--accent)" />
        </div>
        <h1 style={{ fontSize: '3rem', margin: 0, textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>Drop to Upload</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>PDF and EPUB files supported</p>
      </div>

      {/* Upload Progress Toasts */}
      {uploads.length > 0 && (
        <div className="upload-manager-toast">
          {uploads.map(upload => (
          <div key={upload.id} className="upload-toast">
            <div style={{ background: upload.status === 'done' ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px' }}>
              {upload.status === 'done' ? (
                <CheckCircle size={24} color="#22c55e" />
              ) : upload.status === 'error' ? (
                <X size={24} color="#ef4444" />
              ) : (
                <FileText size={24} color="var(--text-secondary)" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.25rem' }}>
                {upload.file.name}
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${upload.progress}%`, height: '100%', background: upload.status === 'error' ? '#ef4444' : 'var(--accent)', transition: 'width 0.2s' }} />
              </div>
            </div>
            {upload.status === 'uploading' && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{upload.progress}%</div>
            )}
          </div>
        ))}
        </div>
      )}

      {/* 100% FULL-WIDTH UNCOLLAPSIBLE TOP NAVIGATION HEADER */}
      <header className="header" style={{ width: '100%', minHeight: '64px', zIndex: 1000, flexShrink: 0, borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1.5rem' }}>
        <button 
          className="btn btn-icon" 
          onClick={() => setIsSidebarOpen(prev => !prev)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0.25rem' }}
          title="Toggle Menu"
        >
          <Menu size={24} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginRight: '0.5rem' }}>
          <img 
            src="/logo.png" 
            alt="BOOKS Logo" 
            style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 0 10px rgba(0, 204, 255, 0.4)', border: '1px solid rgba(0, 204, 255, 0.3)' }} 
          />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
            BOOKS
          </span>
        </div>

        <div className="search-bar" style={{ flex: 1, maxWidth: '400px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setIsSearchOpen(true)}>
          <Search size={20} color="var(--text-secondary)" />
          <div style={{ color: 'var(--text-secondary)', paddingLeft: '0.5rem', flex: 1 }}>Search...</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Command size={12} /> K
          </div>
        </div>
        
        <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', padding: '0 0.5rem' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', padding: '0 0.5rem' }}>
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <button 
              className={`btn btn-icon`}
              style={{ backgroundColor: viewMode === 'shelf' ? 'var(--hover-color)' : 'transparent', border: 'none' }}
              onClick={() => setViewMode('shelf')}
            >
              <span title="3D Bookshelf View"><Library size={18} /></span>
            </button>
            <button 
              className={`btn btn-icon`}
              style={{ backgroundColor: viewMode === 'grid' ? 'var(--hover-color)' : 'transparent', border: 'none' }}
              onClick={() => setViewMode('grid')}
            >
              <span title="Grid View"><LayoutGrid size={18} /></span>
            </button>
            <button 
              className={`btn btn-icon`}
              style={{ backgroundColor: viewMode === 'list' ? 'var(--hover-color)' : 'transparent', border: 'none' }}
              onClick={() => setViewMode('list')}
            >
              <span title="List View"><List size={18} /></span>
            </button>
          </div>

          <div style={{ width: '1px', height: '2rem', backgroundColor: 'var(--border-color)' }}></div>

          <button className="btn btn-icon hidden-mobile" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <input 
            type="file"
            multiple
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".pdf,.epub" 
            onChange={handleFileUpload} 
          />
          <button className="btn btn-premium-gradient hidden-mobile" onClick={() => setIsUploadModalOpen(true)}>
            <Plus size={18} /> Upload Books
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Mobile Sidebar Overlay */}
        <div className={`mobile-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

        {/* Sidebar (Sits BELOW full-width top header) */}
        <aside className={`sidebar ${isSidebarOpen ? 'open mobile-open' : 'collapsed'}`} style={{ zIndex: 900 }}>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div className={`shelf-item ${selectedShelf === null ? 'active' : ''}`} onClick={() => setSelectedShelf(null)}>
            <BookOpen size={20} />
            <span style={{ flex: 1 }}>All Books</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{books.length}</span>
          </div>

          <div 
            className={`shelf-item shelf-drop-zone ${selectedShelf === 'favorites' ? 'active' : ''} ${isDragOverShelf === 'favorites' ? 'drag-over' : ''}`} 
            onClick={() => setSelectedShelf('favorites')}
            onDragOver={(e) => handleDragOver(e, 'favorites')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropToShelf(e, 'favorites')}
          >
            <SphaerusHeart size={20} color="#ef4444" fill={selectedShelf === 'favorites' ? '#ef4444' : 'none'} />
            <span style={{ fontWeight: 600, flex: 1 }}>Favorites</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{books.filter(b => b.collections?.includes('favorites')).length}</span>
          </div>

          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>
            Smart Collections
          </div>

          <div className={`shelf-item ${isAnnotationsOpen ? 'active' : ''}`} onClick={() => setIsAnnotationsOpen(true)}>
            <FileText size={20} color="#f472b6" />
            <span>Annotations Hub</span>
          </div>

          <div className={`shelf-item ${selectedShelf === 'recently_added' ? 'active' : ''}`} onClick={() => setSelectedShelf('recently_added')}>
            <SphaerusClock size={20} color="var(--accent)" />
            <span>Recently Added</span>
          </div>

          <div className={`shelf-item ${selectedShelf === 'quick_reads' ? 'active' : ''}`} onClick={() => setSelectedShelf('quick_reads')}>
            <SphaerusZap size={20} color="#eab308" />
            <span>Quick Reads</span>
          </div>

          <div className={`shelf-item ${selectedShelf === 'epics' ? 'active' : ''}`} onClick={() => setSelectedShelf('epics')}>
            <SphaerusAward size={20} color="#8b5cf6" />
            <span>Epics</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>
              Shelves
            </span>
            <button 
              onClick={handleNewShelf}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <Plus size={14} /> Create
            </button>
          </div>
          
          {shelves.map(shelf => {
            const count = books.filter(b => b.collections?.includes(shelf.id)).length;
            return (
              <div 
                key={shelf.id} 
                className={`shelf-item shelf-drop-zone ${selectedShelf === shelf.id ? 'active' : ''} ${isDragOverShelf === shelf.id ? 'drag-over' : ''}`}
                onClick={() => setSelectedShelf(shelf.id)}
                onDragOver={(e) => handleDragOver(e, shelf.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDropToShelf(e, shelf.id)}
                style={{ borderLeft: shelf.color ? `3px solid ${shelf.color}` : 'none' }}
              >
                <span style={{ fontSize: '1.1rem', minWidth: '22px', textAlign: 'center' }}>{shelf.icon || '📚'}</span>
                <span title={shelf.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: selectedShelf === shelf.id ? 600 : 400 }}>{shelf.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginRight: '0.25rem' }}>{count}</span>
                <div className="shelf-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                  <span title="Customize Shelf Style & Icon" onClick={(e) => { e.stopPropagation(); setEditingShelf(shelf); }} style={{ display: 'flex', cursor: 'pointer' }}>
                    <Settings size={14} className="shelf-action-icon" />
                  </span>
                  <span title="Delete Shelf" onClick={(e) => handleDeleteShelf(shelf.id, e)} style={{ display: 'flex', cursor: 'pointer' }}>
                    <Trash2 size={14} className="shelf-action-icon text-danger" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn" onClick={() => setShowAnalytics(true)} style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          <BarChart2 size={18} /> Reading Insights
        </button>

        <div className="mobile-only" style={{ display: 'none', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button className="btn" onClick={toggleTheme} style={{ width: '100%', justifyContent: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            {theme === 'dark' ? <><Sun size={18} style={{ marginRight: '0.5rem' }} /> Light Mode</> : <><Moon size={18} style={{ marginRight: '0.5rem' }} /> Dark Mode</>}
          </button>
          <button className="btn btn-premium-gradient" onClick={() => setIsUploadModalOpen(true)} style={{ width: '100%', justifyContent: 'center' }}>
            <Plus size={18} style={{ marginRight: '0.5rem' }} /> Upload Books
          </button>
        </div>

        <button className="btn" onClick={handleNewShelf} style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', border: '1px dashed var(--border-color)', color: 'inherit', marginTop: '1rem' }}>
          <Plus size={18} /> New Shelf
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        
        {/* Spotlight Modal Overlay */}
        {isSearchOpen && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', paddingTop: '10vh' }} onClick={() => setIsSearchOpen(false)}>
            <div style={{ width: '90%', maxWidth: '650px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '70vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <Search size={24} color="var(--text-secondary)" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search books, authors..." 
                  value={spotlightQuery}
                  onChange={(e) => setSpotlightQuery(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', outline: 'none', marginLeft: '1rem' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>ESC</div>
              </div>
              <div style={{ overflowY: 'auto', padding: '1rem' }}>
                {spotlightQuery ? (
                  books.filter(b => b.title.toLowerCase().includes(spotlightQuery.toLowerCase()) || b.author.toLowerCase().includes(spotlightQuery.toLowerCase())).length > 0 ? (
                     books.filter(b => b.title.toLowerCase().includes(spotlightQuery.toLowerCase()) || b.author.toLowerCase().includes(spotlightQuery.toLowerCase())).map(book => (
                       <Link href={`/read?id=${book.id}`} key={book.id} onClick={() => setIsSearchOpen(false)} style={{ textDecoration: 'none', color: 'inherit' }}>
                         <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }} className="spotlight-result">
                            <img src={getCoverUrl(book)} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginRight: '1rem' }} onError={(e) => handleImageError(e, book)} />
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
        )}

        {/* Analytics Modal */}
        {showAnalytics && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAnalytics(false)}>
             <div style={{ background: 'var(--bg-secondary)', padding: '3rem', borderRadius: '16px', minWidth: '600px', maxWidth: '90%', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
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
                   <BarChart data={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                     const totalForDay = books.reduce((acc, b) => {
                       const d = new Date(b.uploadDate || Date.now());
                       const dayIdx = (d.getDay() + 6) % 7; // Map Sun=0 to index 6
                       return dayIdx === i ? acc + (b.currentPage || b.progress || 12) : acc;
                     }, 0);
                     return { name: day, pages: totalForDay > 0 ? totalForDay : (i * 15 + 10) };
                   })}>
                     <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                     <Tooltip 
                       cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                       contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                     />
                     <Bar dataKey="pages" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>

               <button className="btn" onClick={() => setShowAnalytics(false)} style={{ width: '100%', padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>Close Dashboard</button>
             </div>
          </div>
        )}

        <div className="content-area" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem 2rem 2rem' }}>
          
          {/* Bespoke Editorial Hero Spotlight */}
          {heroBook && (
            <div style={{ 
              marginBottom: '3rem', 
              borderRadius: '20px', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              gap: '2rem',
              alignItems: 'center',
              boxShadow: `0 25px 70px ${heroColor}, inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
              position: 'relative',
              overflow: 'hidden',
              backgroundImage: `url('${getCoverUrl(heroBook)}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'box-shadow 0.5s ease'
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backdropFilter: 'blur(45px)',
                background: theme === 'dark' 
                  ? 'linear-gradient(110deg, #010105 0%, rgba(7, 13, 24, 0.92) 50%, rgba(1, 1, 5, 0.6) 100%)'
                  : 'linear-gradient(110deg, #ffffff 0%, rgba(248, 250, 252, 0.92) 50%, rgba(255, 255, 255, 0.6) 100%)',
                zIndex: 0
              }} />

              <div className="hero-book-container" style={{ zIndex: 1, display: 'flex', gap: '2.5rem', alignItems: 'center', padding: '2.5rem 3rem', width: '100%' }}>
                {/* Book Cover with Ambient Backlight Glow */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '-10px',
                    right: '-10px',
                    bottom: '-10px',
                    borderRadius: '16px',
                    background: `radial-gradient(circle, ${heroColor} 0%, transparent 70%)`,
                    filter: 'blur(20px)',
                    zIndex: 0
                  }} />
                  <img 
                    src={getCoverUrl(heroBook)} 
                    alt={heroBook.title} 
                    className="hero-book-cover"
                    style={{ position: 'relative', zIndex: 1, maxHeight: '220px', width: 'auto', maxWidth: '160px', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onError={(e) => handleImageError(e, heroBook)}
                  />
                </div>

                <div className="hero-book-info" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', background: 'rgba(0, 204, 255, 0.1)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem', border: '1px solid rgba(0, 204, 255, 0.2)' }}>
                    <Sparkles size={14} /> Editor's Spotlight • Continue Reading
                  </div>
                  <h2 className="hero-book-title" style={{ fontSize: '2.4rem', margin: '0 0 0.6rem 0', color: 'var(--text-primary)', textShadow: '0 2px 8px rgba(0,0,0,0.3)', lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.03em' }}>{formatTitle(heroBook.title)}</h2>
                  
                  <div style={{ marginBottom: '1.75rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.6rem', fontWeight: 500 }}>Currently at Page {heroBook.progress}</div>
                    <div style={{ width: '100%', maxWidth: '320px', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
                      <div style={{ width: `${heroBook.progressPercent || Math.min(100, Math.max(5, ((heroBook.progress || 0) / 300) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent-hover) 100%)', borderRadius: '3px', boxShadow: '0 0 10px var(--accent)' }}></div>
                    </div>
                  </div>

                  <Link href={`/read?id=${heroBook.id}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
                    <button className="btn btn-primary" style={{ padding: '0.85rem 2.2rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '10px', display: 'flex', gap: '0.6rem', alignItems: 'center', backgroundColor: 'var(--accent)', color: '#000', border: 'none', boxShadow: '0 8px 25px rgba(0, 204, 255, 0.4)', transition: 'transform 0.2s ease' }}>
                      <Play size={18} fill="#000" /> Resume Reading
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem' }}>
              {selectedShelf === null ? "All Books" : 
               selectedShelf === 'favorites' ? 'Favorites' : 
               selectedShelf === 'recently_added' ? 'Recently Added' :
               selectedShelf === 'quick_reads' ? 'Quick Reads' :
               selectedShelf === 'epics' ? 'Epics' :
               shelves.find(s => s.id === selectedShelf)?.name || "Shelf"}
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'recent'|'title')}
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-primary)', 
                  padding: '0.5rem', 
                  borderRadius: '0.5rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="recent">Recently Read</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading books...</div>
          ) : displayedBooks.length === 0 ? (
            <div className="empty-state-container">
              <BookOpen className="empty-state-icon" />
              <div className="empty-state-title">No books found</div>
              <p>Upload a PDF or EPUB to get started.</p>
              <button className="btn btn-premium-gradient" style={{ marginTop: '1.5rem' }} onClick={() => setIsUploadModalOpen(true)}>
                <Plus size={18} /> Upload Books
              </button>
            </div>
          ) : viewMode === 'shelf' ? (
            <div className="bookshelf-3d-container">
              {displayedBooks.slice(0, visibleCount).map(book => (
                <div key={book.id} className="bookshelf-3d-item">
                  <BookCard
                    book={book}
                    viewMode="shelf"
                    onShowDetails={(b) => setSelectedDetailBook(b)}
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
                  <div className="bookshelf-ledge" />
                  <div className="bookshelf-reflection" />
                </div>
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="books-grid">
              {displayedBooks.slice(0, visibleCount).map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  viewMode="grid"
                  onShowDetails={(b) => setSelectedDetailBook(b)}
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
              ))}</div>
          ) : (
            // LIST VIEW
            <div className="books-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {displayedBooks.slice(0, visibleCount).map(book => (
                <div key={book.id} className={`book-card-container ${selectedBooks.length > 0 ? 'has-selection' : ''}`} draggable={true} onDragStart={(e) => e.dataTransfer.setData('bookId', book.id)} style={{ position: 'relative' }}>
                  <Link href={`/read?id=${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'} onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}>
                      
                      <div className="book-checkbox" style={{ marginRight: '1rem' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedBooks.includes(book.id)} 
                          onChange={(e) => { e.stopPropagation(); toggleBookSelection(book.id); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--accent)' }}
                        />
                      </div>

                      <div style={{ position: 'relative' }}>
                        <img 
                          src={getCoverUrl(book)} 
                          alt={book.title} 
                          style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginRight: '1rem' }}
                          onError={(e) => handleImageError(e, book)}
                        />
                        {book.collections?.includes('favorites') && (
                          <div style={{ position: 'absolute', top: '-0.25rem', right: '0.75rem', zIndex: 4, background: 'rgba(0,0,0,0.8)', borderRadius: '50%', padding: '0.15rem' }}>
                            <SphaerusHeart size={10} fill="#ef4444" color="#ef4444" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="book-card-title" style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{formatTitle(book.title)}</div>
                        {book.author && book.author !== 'Unknown Author' && (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{book.author}</div>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', width: '150px', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        {book.progress && book.progress > 1 ? (
                           <span style={{ background: 'rgba(0, 204, 255, 0.1)', color: 'var(--accent)', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>Page {book.progress}</span>
                        ) : null}
                      </div>
                      
                      <button 
                        className="btn btn-icon book-menu-trigger"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveBookMenu(activeBookMenu === book.id ? null : book.id);
                        }}
                        style={{ marginLeft: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </Link>

                  {/* Context Menu Dropdown */}
                  {activeBookMenu === book.id && (
                    <div 
                      className="context-menu-dropdown"
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: 'absolute', top: '2.5rem', right: '0', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', zIndex: 20, minWidth: '160px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                    >
                      <button 
                        onClick={() => { setActiveBookMenu(null); handleToggleShelf(book, 'favorites'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <SphaerusHeart size={16} fill={book.collections?.includes('favorites') ? '#ef4444' : 'none'} color={book.collections?.includes('favorites') ? '#ef4444' : 'currentColor'} /> Favorite
                      </button>
                      <button 
                        onClick={() => { setActiveBookMenu(null); setActiveShelfModal(book.id); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <SphaerusLibrary size={16} /> Manage Shelves
                      </button>
                      <button 
                        onClick={() => { 
                          setActiveBookMenu(null); 
                          setActiveEditModal(book.id); 
                          setEditForm({ title: book.title, author: book.author || '', coverUrl: book.coverUrl || '' });
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Edit3 size={16} /> Edit Details
                      </button>
                      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.25rem 0' }} />
                      <button 
                        onClick={() => { setActiveBookMenu(null); handleDeleteBook(book.id); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '4px' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-color)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Trash2 size={16} /> Delete Book
                      </button>
                    </div>
                  )}
                  {/* Manage Shelves Modal */}
                  {activeShelfModal === book.id && (
                    <div 
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                              const inShelf = book.collections?.includes(shelf.id);
                              return (
                                <label key={shelf.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '8px', cursor: 'pointer', border: '1px solid transparent' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                                  <input 
                                    type="checkbox" 
                                    checked={inShelf || false} 
                                    onChange={() => handleToggleShelf(book, shelf.id)} 
                                    style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                  />
                                  <span style={{ fontSize: '1.1rem' }}>{shelf.name}</span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {visibleCount < displayedBooks.length && (
            <div ref={loadMoreRef} style={{ height: '20px', margin: '2rem 0', display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          )}
        </div>

        {/* Floating Action Bar for Bulk Selection */}
        {selectedBooks.length > 0 && (
          <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '32px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100 }}>
            <span style={{ fontWeight: 600, paddingLeft: '0.5rem' }}>{selectedBooks.length} Selected</span>
            <div style={{ width: '1px', height: '1.5rem', backgroundColor: 'var(--border-color)' }} />
            <button className="btn" onClick={() => setActiveShelfModal('bulk')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '20px' }}>Add to Shelf</button>
            <button className="btn" onClick={handleBulkDelete} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '20px' }}>Delete</button>
            <div style={{ width: '1px', height: '1.5rem', backgroundColor: 'var(--border-color)' }} />
            <button className="btn btn-icon" onClick={() => setSelectedBooks([])}><X size={18} /></button>
          </div>
        )}

        {/* Bulk Shelf Modal */}
        {activeShelfModal === 'bulk' && (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setActiveShelfModal(null)}
          >
            <div 
              style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', minWidth: '350px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Add {selectedBooks.length} Books to Shelf</h3>
                <button className="btn btn-icon" onClick={() => setActiveShelfModal(null)}><X size={20} /></button>
              </div>
              <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {shelves.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No shelves created yet.</p>
                ) : (
                  shelves.map(shelf => (
                    <div 
                      key={shelf.id} 
                      onClick={() => handleBulkToggleShelf(shelf.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', cursor: 'pointer', border: '1px solid transparent' }} 
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'} 
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <Book size={18} color="var(--text-secondary)" />
                      <span style={{ fontSize: '1.1rem' }}>{shelf.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Details Modal */}
        {activeEditModal && (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setActiveEditModal(null)}
          >
            <div 
              style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', minWidth: '400px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Edit Book Details</h3>
                <button className="btn btn-icon" onClick={() => setActiveEditModal(null)}><X size={20} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Title</label>
                  <input 
                    type="text" 
                    value={editForm.title} 
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Author</label>
                  <input 
                    type="text" 
                    value={editForm.author} 
                    onChange={e => setEditForm({...editForm, author: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Custom Cover Image URL</label>
                  <input 
                    type="text" 
                    placeholder="https://example.com/cover.jpg"
                    value={editForm.coverUrl} 
                    onChange={e => setEditForm({...editForm, coverUrl: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Paste a link to an image to override the default cover.</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn" onClick={() => setActiveEditModal(null)} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveBookDetails}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {isUploadModalOpen && (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setIsUploadModalOpen(false)}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsGlobalDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsGlobalDragOver(false); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleGlobalDrop(e as any); }}
          >
            <div 
              style={{ background: 'var(--bg-secondary)', padding: '2.5rem', borderRadius: '16px', width: '500px', maxWidth: '90vw', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s ease', transform: isGlobalDragOver ? 'scale(1.02)' : 'scale(1)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1.5rem', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Upload Books</h3>
                <button className="btn btn-icon" onClick={() => setIsUploadModalOpen(false)}><X size={24} /></button>
              </div>
              
              <div 
                style={{ 
                  width: '100%', 
                  border: `2px dashed ${isGlobalDragOver ? 'var(--accent)' : 'var(--border-color)'}`, 
                  borderRadius: '12px', 
                  padding: '4rem 2rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: isGlobalDragOver ? 'rgba(0, 204, 255, 0.05)' : 'var(--bg-primary)', 
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Plus size={32} color="var(--accent)" />
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', textAlign: 'center' }}>Drag & drop your files here</h4>
                <p style={{ color: 'var(--text-secondary)', margin: 0, textAlign: 'center', marginBottom: '2rem' }}>Supports EPUB and PDF format</p>
                <button className="btn btn-premium-gradient" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Browse Files
                </button>
              </div>
            </div>
          </div>
        )}

        {isAnnotationsOpen && (
          <AnnotationsSidebar books={books} onClose={() => setIsAnnotationsOpen(false)} />
        )}

        {selectedDetailBook && (
          <BookDetailsModal 
            book={selectedDetailBook}
            onClose={() => setSelectedDetailBook(null)}
            getCoverUrl={getCoverUrl}
            formatTitle={formatTitle}
          />
        )}

        {/* Shelf Style & Icon Customization Modal */}
        {editingShelf && (
          <div className="modal-overlay" onClick={() => setEditingShelf(null)} style={{ zIndex: 1100 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', flexDirection: 'column', padding: '1.5rem', gap: '1.25rem', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Customize Shelf</h3>
                <button className="btn btn-icon" onClick={() => setEditingShelf(null)} style={{ background: 'transparent', border: 'none', color: '#fff' }}><X size={18} /></button>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Shelf Name</label>
                <input
                  type="text"
                  value={editingShelf.name}
                  onChange={(e) => setEditingShelf({ ...editingShelf, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Choose Icon</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                  {['📚', '🚀', '🧠', '🎨', '⚡', '💼', '🔬', '💡', '🔥', '🏆', '🎧', '🌟'].map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setEditingShelf({ ...editingShelf, icon })}
                      style={{
                        fontSize: '1.3rem',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        border: editingShelf.icon === icon ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                        background: editingShelf.icon === icon ? 'rgba(0, 204, 255, 0.15)' : 'var(--bg-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Accent Color Badge</label>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                  {['#00ccff', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6366f1'].map(color => (
                    <div
                      key={color}
                      onClick={() => setEditingShelf({ ...editingShelf, color })}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: editingShelf.color === color ? '3px solid #fff' : '2px solid transparent',
                        boxShadow: editingShelf.color === color ? `0 0 12px ${color}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button className="btn" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={() => setEditingShelf(null)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    if (!editingShelf) return;
                    try {
                      await fetch(`/api/shelves/${editingShelf.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: editingShelf.name, icon: editingShelf.icon, color: editingShelf.color })
                      });
                      setShelves(shelves.map(s => s.id === editingShelf.id ? editingShelf : s));
                      setEditingShelf(null);
                    } catch (e) { console.error(e); }
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  </div>
  );
}
