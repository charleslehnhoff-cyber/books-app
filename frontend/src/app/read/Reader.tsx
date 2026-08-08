"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, BookOpen, Maximize, LayoutGrid, List, Play, Square, Star, Bookmark, Download, Settings, Search, RotateCw, AlignJustify, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ArticleReaderModal from './ArticleReaderModal';
import AudiobookPlayerModal from './AudiobookPlayerModal';
import { useSearchParams } from 'next/navigation';

// react-pdf
import { pdfjs, Document, Page, Outline } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// react-reader
import { ReactReader } from 'react-reader';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function Reader() {
  const [showSettings, setShowSettings] = useState(false);
  const [readerTheme, setReaderTheme] = useState('dark');
  const [fontFamily, setFontFamily] = useState('sans');
  const [fontSize, setFontSize] = useState(100);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [readerMargin, setReaderMargin] = useState(15);
  const [scrollMode, setScrollMode] = useState(false);
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // View Mode State: 'single' | 'spread' | 'continuous'
  const [viewMode, setViewMode] = useState<'single' | 'spread' | 'continuous'>('single');
  const [widePages, setWidePages] = useState<Record<number, boolean>>({});
  const [cropHalf, setCropHalf] = useState<'left' | 'right'>('left');
  const [navDirection, setNavDirection] = useState<'forward' | 'backward'>('forward');
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [rotation, setRotation] = useState<number>(0);
  const [showArticleReader, setShowArticleReader] = useState(false);
  const [showAudiobookPlayer, setShowAudiobookPlayer] = useState(false);

  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pageWidth, setPageWidth] = useState<number | undefined>(undefined);
  const [outline, setOutline] = useState<any[]>([]);
  const [showOutline, setShowOutline] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // In-Book Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ pageNumber: number; snippet: string }[]>([]);
  const [currentSearchIdx, setCurrentSearchIdx] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 768) {
          setScale(1.0);
          setPageWidth(window.innerWidth - 32);
        } else {
          setPageWidth(undefined);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Spread Layout State
  const [spreadLayout, setSpreadLayout] = useState<number[][]>([]);
  const [spreadIndex, setSpreadIndex] = useState<number>(0);
  const [calculatingLayout, setCalculatingLayout] = useState<boolean>(false);

  // EPUB State
  const [location, setLocation] = useState<string | number>(0);
  const [rendition, setRendition] = useState<any>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [selection, setSelection] = useState<any>(null);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightMenuPos, setHighlightMenuPos] = useState({ x: 0, y: 0 });

  // Touch State
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const pinchScaleRef = useRef<number>(1);

  const getPinchDist = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartDistRef.current = getPinchDist(e.touches);
      pinchScaleRef.current = scale;
      setTouchStart(null);
    } else if (e.touches.length === 1) {
      touchStartDistRef.current = null;
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const currentDist = getPinchDist(e.touches);
      if (currentDist) {
        const ratio = currentDist / touchStartDistRef.current;
        pinchScaleRef.current = scale * ratio;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartDistRef.current !== null) {
      const newScale = Math.min(3, Math.max(0.5, pinchScaleRef.current));
      setScale(newScale);
      touchStartDistRef.current = null;
      return;
    }

    if (!touchStart) return;
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const xDiff = touchStart.x - touchEnd.x;
    const yDiff = touchStart.y - touchEnd.y;

    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
      if (xDiff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    } else if (Math.abs(xDiff) < 10 && Math.abs(yDiff) < 10) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      if (
        touchEnd.x > screenWidth * 0.2 &&
        touchEnd.x < screenWidth * 0.8 &&
        touchEnd.y > screenHeight * 0.2 &&
        touchEnd.y < screenHeight * 0.8
      ) {
        setShowUI(prev => !prev);
      }
    }
    setTouchStart(null);
  };

  useEffect(() => {
    if (rendition) {
      rendition.on('selected', (cfiRange: string, contents: any) => {
        rendition.annotations.highlight(cfiRange, {}, (e: any) => {
          console.log('highlight clicked', e);
        });

        const selectionText = rendition.getRange(cfiRange).toString();
        setSelection({ cfi: cfiRange, text: selectionText });
        setHighlightMenuPos({ x: 0, y: 0 });
        setShowHighlightMenu(true);
      });

      rendition.on('relocated', () => {
        if (highlights) {
          highlights.forEach((h: any) => {
            try {
              rendition.annotations.highlight(h.cfi, {}, (e: any) => {
                console.log('highlight clicked', h.id);
              });
            } catch (e) {}
          });
        }
      });
    }
  }, [rendition, highlights]);

  useEffect(() => {
    if (rendition) {
      const getFont = () => fontFamily === 'sans' ? 'sans-serif' : fontFamily === 'serif' ? 'serif' : 'OpenDyslexic, sans-serif';

      const applyStyles = (color: string, bg: string) => ({
        body: { background: 'transparent', color: color, padding: `0 ${readerMargin}px` },
        p: { 'font-family': getFont(), 'line-height': `${lineHeight}` },
        h1: { 'font-family': getFont(), color: color },
        h2: { 'font-family': getFont(), color: color }
      });

      rendition.themes.register('dark', applyStyles('#e2e8f0', 'transparent'));
      rendition.themes.register('light', applyStyles('#0f172a', 'transparent'));
      rendition.themes.register('sepia', applyStyles('#5c4b37', 'transparent'));
      rendition.themes.register('amoled', applyStyles('#e2e8f0', 'transparent'));

      rendition.themes.select(readerTheme);
      rendition.themes.fontSize(`${fontSize}%`);
    }
  }, [rendition, readerTheme, fontFamily, fontSize, lineHeight, readerMargin]);

  const saveHighlight = async (color: string, note: string = '') => {
    if (!selection || !book) return;
    const newHighlight = {
      id: Math.random().toString(36).substring(2, 9),
      text: selection.text,
      cfi: selection.cfi,
      color,
      note
    };

    const newHighlights = [...highlights, newHighlight];
    setHighlights(newHighlights);
    setShowHighlightMenu(false);

    try {
      await fetch('/api/books/' + book.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highlights: newHighlights })
      });
    } catch (e) {}
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const hideUITimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch('/api/books/' + id)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setBook(data);
        if (data.highlights) setHighlights(data.highlights);

        try {
          if (data.type === 'pdf') {
            const savedPage = localStorage.getItem(`reader_progress_pdf_${id}`);
            if (savedPage) setPageNumber(parseInt(savedPage, 10));
          } else if (data.type === 'epub') {
            const savedLoc = localStorage.getItem(`reader_progress_epub_${id}`);
            if (savedLoc) setLocation(savedLoc);
          }
        } catch (e) {}

        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    try {
      const savedBookmarks = localStorage.getItem(`bookmarks-${id}`);
      if (savedBookmarks) {
        try { setBookmarks(JSON.parse(savedBookmarks)); } catch (e) {}
      }
    } catch (e) {}
  }, [id]);

  useEffect(() => {
    if (id && book?.type === 'pdf') {
      try { localStorage.setItem(`reader_progress_pdf_${id}`, pageNumber.toString()); } catch (e) {}
    }
  }, [pageNumber, id, book]);

  useEffect(() => {
    if (id && book?.type === 'epub' && location !== 0 && location !== '') {
      try { localStorage.setItem(`reader_progress_epub_${id}`, location.toString()); } catch (e) {}
    }
  }, [location, id, book]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowUI(true);
      if (hideUITimeoutRef.current) clearTimeout(hideUITimeoutRef.current);
      hideUITimeoutRef.current = setTimeout(() => {
        setShowUI(false);
      }, 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    handleMouseMove();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideUITimeoutRef.current) clearTimeout(hideUITimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  };

  useEffect(() => {
    if (viewMode === 'spread' && spreadLayout.length > 0) {
      const idx = spreadLayout.findIndex(s => s.includes(pageNumber));
      if (idx !== -1) setSpreadIndex(idx);
    }
    if (id && pageNumber > 0) {
      try {
        localStorage.setItem(`book-progress-${id}`, pageNumber.toString());
      } catch (e) {}

      const syncTimeout = setTimeout(() => {
        fetch(`/api/books/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPage: pageNumber,
            totalPages: numPages || 0,
            lastOpened: new Date().toISOString()
          })
        }).catch(err => console.error("Failed to sync progress:", err));
      }, 1000);

      return () => clearTimeout(syncTimeout);
    }
  }, [viewMode, pageNumber, spreadLayout, id, numPages]);

  const isPdf = book?.filename?.toLowerCase().endsWith('.pdf') || book?.originalName?.toLowerCase().endsWith('.pdf');
  const isEpub = book?.filename?.toLowerCase().endsWith('.epub') || book?.originalName?.toLowerCase().endsWith('.epub');

  // Non-blocking layout computation for spread mode
  const computeSpreadLayout = useCallback((pdf: any) => {
    setCalculatingLayout(true);
    setTimeout(async () => {
      try {
        const layout: number[][] = [];
        let i = 1;
        while (i <= pdf.numPages) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          const isWide = viewport.width > viewport.height * 1.2;

          if (isWide) {
            layout.push([i]);
            i++;
          } else {
            if (i < pdf.numPages) {
              const nextPage = await pdf.getPage(i + 1);
              const nextViewport = nextPage.getViewport({ scale: 1 });
              const nextIsWide = nextViewport.width > nextViewport.height * 1.2;

              if (!nextIsWide) {
                layout.push([i, i + 1]);
                i += 2;
              } else {
                layout.push([i]);
                i++;
              }
            } else {
              layout.push([i]);
              i++;
            }
          }

          if (i % 20 === 0) {
            await new Promise(res => setTimeout(res, 0));
          }
        }
        setSpreadLayout(layout);
      } catch (e) {
        console.error("Error calculating layout", e);
      } finally {
        setCalculatingLayout(false);
      }
    }, 50);
  }, []);

  async function onDocumentLoadSuccess(pdf: any) {
    setPdfDoc(pdf);
    setNumPages(pdf.numPages);

    let startPage = book?.currentPage && book.currentPage > 1 ? book.currentPage : 1;
    try {
      const savedPage = localStorage.getItem(`book-progress-${id}`);
      if (savedPage && !isNaN(Number(savedPage))) {
        startPage = Math.max(startPage, Number(savedPage));
      }
    } catch (e) {}
    startPage = Math.min(Math.max(1, startPage), pdf.numPages);
    setPageNumber(startPage);

    try {
      const outlineData = await pdf.getOutline();
      if (outlineData) setOutline(outlineData);
    } catch (e) {
      console.log("Could not extract outline", e);
    }

    computeSpreadLayout(pdf);
  }

  const handlePrev = useCallback(() => {
    setNavDirection('backward');
    if (viewMode === 'spread') {
      const newIdx = Math.max(0, spreadIndex - 1);
      setSpreadIndex(newIdx);
      if (spreadLayout[newIdx]) setPageNumber(spreadLayout[newIdx][0]);
    } else {
      if (widePages[pageNumber] && cropHalf === 'right') {
        setCropHalf('left');
      } else {
        setPageNumber(p => {
          const prevPage = Math.max(1, p - 1);
          setCropHalf('right');
          return prevPage;
        });
      }
    }
  }, [viewMode, spreadIndex, spreadLayout, widePages, pageNumber, cropHalf]);

  const handleNext = useCallback(() => {
    setNavDirection('forward');
    if (viewMode === 'spread') {
      const newIdx = Math.min(spreadLayout.length - 1, spreadIndex + 1);
      setSpreadIndex(newIdx);
      if (spreadLayout[newIdx]) setPageNumber(spreadLayout[newIdx][0]);
    } else {
      if (widePages[pageNumber] && cropHalf === 'left') {
        setCropHalf('right');
      } else {
        setPageNumber(p => {
          const nextPg = Math.min(numPages || 1, p + 1);
          setCropHalf('left');
          return nextPg;
        });
      }
    }
  }, [viewMode, spreadIndex, spreadLayout, numPages, widePages, pageNumber, cropHalf]);

  const rotatePage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const fitToWidth = () => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth - 64;
      setPageWidth(Math.max(300, width));
      setScale(1.0);
    }
  };

  const fitToPage = () => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight - 160;
      const calculatedScale = Math.max(0.6, height / 800);
      setPageWidth(undefined);
      setScale(calculatedScale);
    }
  };

  // Full-Text In-Book Search
  const performSearch = async (query: string) => {
    if (!query.trim() || !pdfDoc) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results: { pageNumber: number; snippet: string }[] = [];
    const q = query.toLowerCase();

    try {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        const matchIdx = pageText.toLowerCase().indexOf(q);
        if (matchIdx !== -1) {
          const start = Math.max(0, matchIdx - 30);
          const end = Math.min(pageText.length, matchIdx + query.length + 30);
          const snippet = (start > 0 ? '...' : '') + pageText.slice(start, end) + (end < pageText.length ? '...' : '');
          results.push({ pageNumber: i, snippet });
        }
      }
      setSearchResults(results);
      setCurrentSearchIdx(0);
      if (results.length > 0) {
        goToPage(results[0].pageNumber);
      }
    } catch (e) {
      console.error("Search error", e);
    } finally {
      setIsSearching(false);
    }
  };

  const goToMatch = (index: number) => {
    if (searchResults.length === 0) return;
    const newIdx = (index + searchResults.length) % searchResults.length;
    setCurrentSearchIdx(newIdx);
    goToPage(searchResults[newIdx].pageNumber);
  };

  // Keyboard navigation & Smart Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setShowSearch(prev => !prev);
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          handlePrev();
          break;
        case 'ArrowRight':
        case 'PageDown':
          handleNext();
          break;
        case ' ':
          e.preventDefault();
          if (e.shiftKey) {
            handlePrev();
          } else {
            handleNext();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          setViewMode(prev => prev === 'single' ? 'spread' : prev === 'spread' ? 'continuous' : 'single');
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          rotatePage();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setShowOutline(prev => !prev);
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          setShowBookmarks(prev => !prev);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleBookmark();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  function goToPage(p: number) {
    setPageNumber(p);
    if (viewMode === 'spread') {
      const idx = spreadLayout.findIndex(s => s.includes(p));
      if (idx !== -1) setSpreadIndex(idx);
    } else if (viewMode === 'continuous') {
      const pageEl = document.getElementById(`pdf-page-${p}`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  const toggleBookmark = () => {
    setBookmarks(prev => {
      const isBookmarked = prev.includes(pageNumber);
      const next = isBookmarked ? prev.filter(p => p !== pageNumber) : [...prev, pageNumber].sort((a, b) => a - b);
      try {
        localStorage.setItem(`bookmarks-${id}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const exportBookmarks = () => {
    if (bookmarks.length === 0) return;
    const content = `# Bookmarks for ${book?.title}\n\n` + bookmarks.sort((a, b) => a - b).map(p => `- Page ${p}`).join('\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book?.title || 'book'}-bookmarks.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const playText = async () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    if (!pdfDoc && !rendition) return;

    setIsPlaying(true);
    try {
      let text = "";

      if (pdfDoc) {
        const pagesToRead = viewMode === 'spread' && spreadLayout[spreadIndex] ? spreadLayout[spreadIndex] : [pageNumber];
        for (const pNum of pagesToRead) {
          const page = await pdfDoc.getPage(pNum);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item: any) => item.str).join(' ') + " ";
        }
      } else if (rendition) {
        const contents = rendition.getContents();
        if (contents && contents.length > 0) {
          contents.forEach((c: any) => {
            if (c.document && c.document.body) {
              text += c.document.body.textContent + " ";
            }
          });
        }
      }

      if (!text.trim()) {
        setIsPlaying(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!id) return <div style={{ padding: '2rem' }}>Invalid Book ID</div>;
  if (loading) return <div style={{ padding: '2rem' }}>Loading book viewer...</div>;
  if (!book) return <div style={{ padding: '2rem' }}>Book not found.</div>;

  const isPrevDisabled = viewMode === 'spread' ? spreadIndex <= 0 : pageNumber <= 1;
  const isNextDisabled = viewMode === 'spread' ? spreadIndex >= spreadLayout.length - 1 : pageNumber >= (numPages || 1);
  const isBookmarked = bookmarks.includes(pageNumber);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#000', color: '#fff', overflow: 'hidden', position: 'relative' }}
    >
      {/* Ambient Background Glow */}
      {book?.coverUrl && (
        <div style={{
          position: 'absolute',
          top: '-10%', left: '-10%', right: '-10%', bottom: '-10%',
          backgroundImage: `url(${book.coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px) saturate(150%) opacity(0.35)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
      )}
      <style>{`
        @keyframes pageFadeIn {
          from { opacity: 0.3; transform: scale(0.99); }
          to { opacity: 1; transform: scale(1); }
        }
        .page-fade {
          animation: pageFadeIn 0.3s ease-out;
        }
        .auto-hide {
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .auto-hide-header {
          transform: translateY(0);
        }
        .auto-hide-header.hidden {
          transform: translateY(-100%);
        }
        .auto-hide-footer {
          transform: translateY(0);
        }
        .auto-hide-footer.hidden {
          transform: translateY(100%);
        }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          margin-top: -6px;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: var(--bg-secondary);
          border-radius: 2px;
        }
      `}</style>

      {/* HEADER */}
      <header
        className={`reader-header auto-hide auto-hide-header ${!showUI ? 'hidden' : ''}`}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(7, 13, 24, 0.9)',
          backdropFilter: 'blur(12px)', zIndex: 50, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <Link href="/" className="btn btn-icon" style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
            <span title="Back to Library"><ArrowLeft size={18} /></span>
          </Link>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
              {book?.title || 'Loading Document...'}
            </h1>
            {book?.author && book.author !== 'Unknown Author' && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
                {book.author}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isPdf && !isEpub && (
            <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--bg-secondary)' }}>
              <button
                className={`btn btn-icon`}
                style={{ backgroundColor: showThumbnails ? 'var(--bg-secondary)' : 'transparent', color: '#fff', border: 'none' }}
                onClick={() => { setShowThumbnails(!showThumbnails); setShowOutline(false); setShowBookmarks(false); setShowSearch(false); }}
              >
                <span title="Thumbnails"><LayoutGrid size={18} /></span>
              </button>
              <button
                className={`btn btn-icon`}
                style={{ backgroundColor: showOutline ? 'var(--bg-secondary)' : 'transparent', color: '#fff', border: 'none', opacity: (!outline || outline.length === 0) ? 0.3 : 1 }}
                onClick={() => { setShowOutline(!showOutline); setShowThumbnails(false); setShowBookmarks(false); setShowSearch(false); }}
                disabled={!outline || outline.length === 0}
              >
                <span title="Table of Contents"><List size={18} /></span>
              </button>
              <button
                className={`btn btn-icon`}
                style={{ backgroundColor: showBookmarks ? 'var(--bg-secondary)' : 'transparent', color: '#fff', border: 'none' }}
                onClick={() => { setShowBookmarks(!showBookmarks); setShowThumbnails(false); setShowOutline(false); setShowSearch(false); }}
              >
                <span title="Bookmarks"><Bookmark size={18} /></span>
              </button>
              <button
                className={`btn btn-icon`}
                style={{ backgroundColor: showSearch ? 'var(--bg-secondary)' : 'transparent', color: '#fff', border: 'none' }}
                onClick={() => { setShowSearch(!showSearch); setShowThumbnails(false); setShowOutline(false); setShowBookmarks(false); }}
              >
                <span title="Search Book (Ctrl+F)"><Search size={18} /></span>
              </button>
            </div>
          )}

          {/* Article View, Read Aloud & Bookmark Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--bg-secondary)' }}>
            <button
              className="btn btn-icon"
              style={{ backgroundColor: showArticleReader ? 'rgba(0, 204, 255, 0.2)' : 'transparent', color: showArticleReader ? 'var(--accent)' : '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.6rem' }}
              onClick={() => setShowArticleReader(true)}
              title="Smart Clean Article Extractor View"
            >
              <Sparkles size={18} color="var(--accent)" />
              <span className="hidden-mobile" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Article View</span>
            </button>
            <div style={{ width: '1px', height: '1.5rem', backgroundColor: 'var(--bg-secondary)', margin: '0 2px' }} />
            <button
              className={`btn btn-icon`}
              style={{ color: showAudiobookPlayer || isPlaying ? 'var(--accent)' : '#fff', border: 'none' }}
              onClick={() => setShowAudiobookPlayer(true)}
            >
              <span title="AI Voice Audiobook Player">
                <Play size={18} fill={showAudiobookPlayer || isPlaying ? "var(--accent)" : "none"} />
              </span>
            </button>
            <div style={{ width: '1px', height: '1.5rem', backgroundColor: 'var(--bg-secondary)', margin: '0 2px' }} />
            <button
              className={`btn btn-icon`}
              style={{ color: isBookmarked ? '#eab308' : '#fff', border: 'none' }}
              onClick={toggleBookmark}
            >
              <span title="Bookmark Page">
                <Star size={18} fill={isBookmarked ? "#eab308" : "none"} />
              </span>
            </button>
          </div>

          {/* View Modes (Single / Spread / Continuous) */}
          {isPdf && !isEpub && (
            <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--bg-secondary)' }}>
              <button
                className={`btn btn-icon`}
                style={{ backgroundColor: viewMode === 'single' ? 'var(--bg-secondary)' : 'transparent', color: '#fff', border: 'none' }}
                onClick={() => setViewMode('single')}
              >
                <span title="Single Page Mode"><FileText size={18} /></span>
              </button>
              <button
                className={`btn btn-icon`}
                style={{ backgroundColor: viewMode === 'spread' ? 'var(--bg-secondary)' : 'transparent', color: '#fff', border: 'none' }}
                onClick={() => setViewMode('spread')}
              >
                <span title="Smart Spread Mode"><BookOpen size={18} /></span>
              </button>
              <button
                className={`btn btn-icon`}
                style={{ backgroundColor: viewMode === 'continuous' ? 'var(--bg-secondary)' : 'transparent', color: '#fff', border: 'none' }}
                onClick={() => setViewMode('continuous')}
              >
                <span title="Continuous Vertical Scroll Mode"><AlignJustify size={18} /></span>
              </button>
            </div>
          )}

          {/* Rotation & Fit Controls */}
          {isPdf && !isEpub && (
            <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--bg-secondary)' }}>
              <button className="btn btn-icon" style={{ color: '#fff', border: 'none' }} onClick={rotatePage}>
                <span title="Rotate 90°"><RotateCw size={18} /></span>
              </button>
              <button className="btn btn-icon" style={{ color: '#fff', border: 'none', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} onClick={fitToWidth}>
                Width
              </button>
              <button className="btn btn-icon" style={{ color: '#fff', border: 'none', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} onClick={fitToPage}>
                Fit
              </button>
            </div>
          )}

          {/* Settings Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-icon"
              style={{ backgroundColor: showSettings ? 'var(--bg-secondary)' : 'rgba(15, 23, 42, 0.8)', color: '#fff', border: '1px solid var(--bg-secondary)', borderRadius: '0.5rem' }}
              onClick={() => setShowSettings(!showSettings)}
            >
              <span title="Settings"><Settings size={18} /></span>
            </button>

            {showSettings && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', zIndex: 100, width: '280px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Theme</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button onClick={() => setReaderTheme('dark')} style={{ padding: '0.5rem', background: '#0f172a', color: '#fff', border: readerTheme === 'dark' ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Dark</button>
                    <button onClick={() => setReaderTheme('light')} style={{ padding: '0.5rem', background: '#f8fafc', color: '#0f172a', border: readerTheme === 'light' ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Light</button>
                    <button onClick={() => setReaderTheme('sepia')} style={{ padding: '0.5rem', background: '#fdf6e3', color: '#5c4b37', border: readerTheme === 'sepia' ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Sepia</button>
                    <button onClick={() => setReaderTheme('amoled')} style={{ padding: '0.5rem', background: '#000000', color: '#e2e8f0', border: readerTheme === 'amoled' ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>AMOLED</button>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Font</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setFontFamily('sans')} style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: fontFamily === 'sans' ? '1px solid var(--accent)' : '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '0.85rem' }}>Sans</button>
                    <button onClick={() => setFontFamily('serif')} style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: fontFamily === 'serif' ? '1px solid var(--accent)' : '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'serif', fontSize: '0.85rem' }}>Serif</button>
                    <button onClick={() => setFontFamily('opendyslexic')} style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: fontFamily === 'opendyslexic' ? '1px solid var(--accent)' : '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'OpenDyslexic, sans-serif', fontSize: '0.85rem' }}>Dyslexic</button>
                  </div>
                </div>

                {isEpub && (
                  <>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Line Height</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lineHeight}</span>
                      </div>
                      <input type="range" min="1.0" max="2.5" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Font Size</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fontSize}%</span>
                      </div>
                      <input type="range" min="50" max="250" step="10" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Side Margins</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{readerMargin}px</span>
                      </div>
                      <input type="range" min="0" max="100" step="5" value={readerMargin} onChange={(e) => setReaderMargin(parseInt(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Continuous Scroll</h4>
                      <button onClick={() => setScrollMode(!scrollMode)} style={{ padding: '0.25rem 0.5rem', background: scrollMode ? 'var(--accent)' : 'var(--bg-primary)', color: scrollMode ? '#fff' : 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        {scrollMode ? 'On' : 'Off'}
                      </button>
                    </div>
                  </>
                )}

              </div>
            )}
          </div>

          {/* Zoom & Fullscreen Controls */}
          <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button className="btn btn-icon" style={{ color: '#fff', border: 'none' }} onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>
              <span title="Zoom Out"><ZoomOut size={18} /></span>
            </button>
            <span style={{ fontSize: '0.9rem', width: '3rem', textAlign: 'center', color: '#fff' }}>{Math.round(scale * 100)}%</span>
            <button className="btn btn-icon" style={{ color: '#fff', border: 'none' }} onClick={() => setScale(s => Math.min(3, s + 0.2))}>
              <span title="Zoom In"><ZoomIn size={18} /></span>
            </button>
            <div style={{ width: '1px', height: '1.5rem', backgroundColor: 'var(--bg-secondary)', margin: '0 4px' }} />
            <button className="btn btn-icon" style={{ color: '#fff', border: 'none' }} onClick={toggleFullscreen}>
              <span title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}><Maximize size={18} /></span>
            </button>
          </div>
        </div>
      </header>

      {/* SINGLE ROOT DOCUMENT CONTAINER FOR ALL SIDEBARS AND MAIN VIEW */}
      <Document
        file={`/api/books/${id}/download`}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div style={{ padding: '4rem', textAlign: 'center', color: '#fff' }}>Loading PDF Document...</div>}
        error={<div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>Failed to load PDF document.</div>}
      >
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', paddingTop: '72px', paddingBottom: '72px', height: 'calc(100vh - 144px)' }}>

          {/* Thumbnails Sidebar */}
          {isPdf && !isEpub && showThumbnails && (
            <aside className="thumbnails-sidebar" style={{ width: '240px', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRight: '1px solid var(--bg-secondary)', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 40 }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--bg-secondary)', paddingBottom: '0.5rem' }}>Page Thumbnails</h3>
              {Array.from(new Array(numPages || 0), (_, index) => (
                <div
                  key={`thumb-${index + 1}`}
                  onClick={() => goToPage(index + 1)}
                  style={{
                    cursor: 'pointer',
                    padding: '0.5rem',
                    backgroundColor: pageNumber === index + 1 ? 'var(--accent)' : 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    border: pageNumber === index + 1 ? '1px solid var(--accent)' : '1px solid transparent'
                  }}
                >
                  <Page
                    pageNumber={index + 1}
                    width={180}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#fff' }}>Page {index + 1}</div>
                </div>
              ))}
            </aside>
          )}

          {/* Outline / TOC Sidebar */}
          {isPdf && !isEpub && showOutline && (
            <aside className="outline-sidebar" style={{ width: '260px', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRight: '1px solid var(--bg-secondary)', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 40 }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--bg-secondary)', paddingBottom: '0.5rem' }}>Table of Contents</h3>
              <Outline onItemClick={({ pageNumber }) => { if (pageNumber) goToPage(Number(pageNumber)) }} />
            </aside>
          )}

          {/* Bookmarks Sidebar */}
          {isPdf && !isEpub && showBookmarks && (
            <aside className="bookmarks-sidebar" style={{ width: '240px', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRight: '1px solid var(--bg-secondary)', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--bg-secondary)' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem' }}>My Bookmarks</h3>
                {bookmarks.length > 0 && (
                  <button
                    className="btn btn-icon"
                    onClick={exportBookmarks}
                    style={{ color: 'var(--accent)', border: 'none', background: 'transparent' }}
                    title="Export to Markdown"
                  >
                    <Download size={18} />
                  </button>
                )}
              </div>
              {bookmarks.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>No bookmarks yet. Click star icon or press 'M' to save pages.</p>
              ) : (
                bookmarks.map((pageNum) => (
                  <div
                    key={`bookmark-${pageNum}`}
                    onClick={() => goToPage(pageNum)}
                    style={{
                      cursor: 'pointer',
                      padding: '0.5rem',
                      backgroundColor: pageNumber === pageNum ? 'var(--accent)' : 'rgba(30, 41, 59, 0.5)',
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      border: pageNumber === pageNum ? '1px solid var(--accent)' : '1px solid transparent'
                    }}
                  >
                    <Page
                      pageNumber={pageNum}
                      width={180}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#fff' }}>Page {pageNum}</div>
                  </div>
                ))
              )}
            </aside>
          )}

          {/* In-Book Search Sidebar */}
          {isPdf && !isEpub && showSearch && (
            <aside className="search-sidebar" style={{ width: '280px', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRight: '1px solid var(--bg-secondary)', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-secondary)', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem' }}>In-Book Search</h3>
                <button className="btn btn-icon" style={{ border: 'none', background: 'transparent', color: '#fff' }} onClick={() => setShowSearch(false)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Search in book..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') performSearch(searchQuery); }}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(30, 41, 59, 0.8)', color: '#fff', fontSize: '0.85rem' }}
                />
                <button className="btn btn-primary" onClick={() => performSearch(searchQuery)} style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                  Search
                </button>
              </div>

              {isSearching && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '1rem 0' }}>
                  Searching pages...
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Matches ({searchResults.length})</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-icon" style={{ padding: '2px', border: 'none', background: 'transparent', color: '#fff' }} onClick={() => goToMatch(currentSearchIdx - 1)}>
                        <ChevronLeft size={16} />
                      </button>
                      <span>{currentSearchIdx + 1} / {searchResults.length}</span>
                      <button className="btn btn-icon" style={{ padding: '2px', border: 'none', background: 'transparent', color: '#fff' }} onClick={() => goToMatch(currentSearchIdx + 1)}>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {searchResults.map((res, idx) => (
                    <div
                      key={`search-res-${idx}`}
                      onClick={() => { setCurrentSearchIdx(idx); goToPage(res.pageNumber); }}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '4px',
                        backgroundColor: currentSearchIdx === idx ? 'var(--accent)' : 'rgba(30, 41, 59, 0.6)',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '2px', color: '#38bdf8' }}>Page {res.pageNumber}</div>
                      <div style={{ color: 'var(--text-secondary)', lineHeight: '1.3' }}>{res.snippet}</div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          )}

          {/* MAIN READER AREA */}
          <main
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ flex: 1, overflow: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: readerTheme === 'light' ? '#f8fafc' : readerTheme === 'sepia' ? '#fdf6e3' : 'transparent', fontFamily: fontFamily === 'serif' ? 'serif' : fontFamily === 'opendyslexic' ? 'OpenDyslexic, sans-serif' : 'inherit', filter: (readerTheme === 'light' || readerTheme === 'sepia') && isPdf ? 'invert(1) hue-rotate(180deg)' : 'none' }}>

            {isPdf && !isEpub && (
              <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

                {calculatingLayout && viewMode === 'spread' && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Calculating spread layout...</div>
                )}

                {/* SINGLE PAGE MODE */}
                {!calculatingLayout && viewMode === 'single' && (
                  <div key={`single-${pageNumber}`} className="page-fade" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.5))' }}>
                    {widePages[pageNumber] ? (
                      <div style={{ width: pageWidth, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          width: (pageWidth || 0) * 2,
                          transform: cropHalf === 'right' ? 'translateX(-50%)' : 'translateX(0)',
                          transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                        }}>
                          <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            rotate={rotation}
                            width={(pageWidth || 0) * 2}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                          />
                        </div>
                      </div>
                    ) : (
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        rotate={rotation}
                        width={pageWidth}
                        onLoadSuccess={(page: any) => {
                          const isWide = page.originalWidth > page.originalHeight * 1.2;
                          if (isWide) {
                            setWidePages(prev => ({ ...prev, [page.pageNumber]: true }));
                            if (navDirection === 'backward') {
                              setCropHalf('right');
                            } else {
                              setCropHalf('left');
                            }
                          }
                        }}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    )}
                  </div>
                )}

                {/* SPREAD MODE */}
                {!calculatingLayout && viewMode === 'spread' && spreadLayout[spreadIndex] && (
                  <div key={`spread-${spreadIndex}`} className="page-fade" style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '2rem', filter: 'drop-shadow(0 30px 40px rgba(0, 0, 0, 0.7))', borderRadius: '4px', overflow: 'hidden' }}>
                    {spreadLayout[spreadIndex].map((pageNum, idx) => (
                      <div key={`spread-page-${pageNum}`} style={{ position: 'relative' }}>
                        <Page
                          pageNumber={pageNum}
                          scale={scale}
                          rotate={rotation}
                          width={pageWidth ? pageWidth / 2 : undefined}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                        />
                        {/* Realistic Book Spine Crease Shadow */}
                        {spreadLayout[spreadIndex].length === 2 && (
                          <div style={{
                            position: 'absolute',
                            top: 0, bottom: 0,
                            width: '45px',
                            left: idx === 0 ? 'auto' : 0,
                            right: idx === 0 ? 0 : 'auto',
                            pointerEvents: 'none',
                            zIndex: 10,
                            background: idx === 0 
                              ? 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.45) 100%)' 
                              : 'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.45) 100%)'
                          }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* CONTINUOUS SCROLL MODE */}
                {viewMode === 'continuous' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', width: '100%' }}>
                    {Array.from(new Array(numPages || 0), (_, index) => (
                      <div key={`cont-page-${index + 1}`} id={`pdf-page-${index + 1}`} style={{ filter: 'drop-shadow(0 20px 20px rgb(0 0 0 / 0.4))' }}>
                        <Page
                          pageNumber={index + 1}
                          scale={scale}
                          rotate={rotation}
                          width={pageWidth}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                        />
                        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Page {index + 1}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* OFF-SCREEN PRE-RENDERING FOR ZERO-LATENCY PAGE TURNS */}
                {viewMode === 'single' && (
                  <div style={{ display: 'none' }}>
                    {pageNumber > 1 && (
                      <Page pageNumber={pageNumber - 1} scale={scale} rotate={rotation} renderTextLayer={false} renderAnnotationLayer={false} />
                    )}
                    {pageNumber < (numPages || 1) && (
                      <Page pageNumber={pageNumber + 1} scale={scale} rotate={rotation} renderTextLayer={false} renderAnnotationLayer={false} />
                    )}
                  </div>
                )}

              </div>
            )}

            {isEpub && (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <ReactReader
                  url={`/api/books/${id}/download`}
                  title={book.title}
                  location={location}
                  locationChanged={(epubcifi: string) => setLocation(epubcifi)}
                  getRendition={(r) => setRendition(r)}
                  epubOptions={{ flow: scrollMode ? "scrolled-doc" : "paginated" }}
                />
              </div>
            )}

            {!isPdf && !isEpub && (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <h2>Unsupported file format</h2>
                <p>We could not determine if this book is a PDF or an EPUB.</p>
                <a href={`/api/books/${id}/download`} className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }} download>Download File Directly</a>
              </div>
            )}

            {/* Minimal Sticky Progress Bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              zIndex: 100
            }}>
              <div style={{
                height: '100%',
                width: `${isPdf && numPages ? (pageNumber / numPages) * 100 : (book?.progressPercent || 0)}%`,
                backgroundColor: 'var(--accent-color)',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* HIGHLIGHT MENU */}
            {showHighlightMenu && (
              <div style={{
                position: 'absolute',
                bottom: '100px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem',
                display: 'flex',
                gap: '0.5rem',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                zIndex: 100
              }}>
                <button className="btn" style={{ padding: '0.25rem 0.75rem', backgroundColor: '#fbbf24', color: '#000' }} onClick={() => saveHighlight('#fbbf24')}>Highlight</button>
                <button className="btn" style={{ padding: '0.25rem 0.75rem', backgroundColor: '#38bdf8', color: '#000' }} onClick={() => saveHighlight('#38bdf8')}>Blue</button>
                <button className="btn" style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f472b6', color: '#000' }} onClick={() => saveHighlight('#f472b6')}>Pink</button>
                <button className="btn" style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} onClick={() => setShowHighlightMenu(false)}>Cancel</button>
              </div>
            )}

          </main>
        </div>
      </Document>

      {/* FOOTER SCRUBBER */}
      {isPdf && !isEpub && (
        <footer
          className={`auto-hide auto-hide-footer ${!showUI ? 'hidden' : ''}`}
          style={{
            position: 'absolute', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
            padding: '0.75rem 1.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(7, 13, 24, 0.9)',
            backdropFilter: 'blur(16px)', zIndex: 50, borderRadius: '2rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            width: 'calc(100% - 3rem)', maxWidth: '750px'
          }}
        >
          <button
            className="btn btn-icon"
            style={{ color: '#fff', border: 'none', opacity: isPrevDisabled ? 0.4 : 1, background: 'rgba(255,255,255,0.05)' }}
            onClick={handlePrev}
            disabled={isPrevDisabled}
          >
            <ChevronLeft size={18} />
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '28px', fontWeight: 600, textAlign: 'right' }}>{pageNumber}</span>
            <input
              type="range"
              min={1}
              max={numPages || 1}
              value={pageNumber}
              onChange={(e) => goToPage(Number(e.target.value))}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '28px', fontWeight: 600 }}>{numPages || '-'}</span>
          </div>

          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', background: 'rgba(0, 204, 255, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '1rem', whiteSpace: 'nowrap' }}>
            {numPages ? `${Math.round((pageNumber / numPages) * 100)}%` : '0%'}
          </div>

          <button
            className="btn btn-icon"
            style={{ color: '#fff', border: 'none', opacity: isNextDisabled ? 0.4 : 1, background: 'rgba(255,255,255,0.05)' }}
            onClick={handleNext}
            disabled={isNextDisabled}
          >
            <ChevronRight size={18} />
          </button>
        </footer>
      )}

      {/* Smart Article Extractor & Clean Reader View Modal */}
      {showArticleReader && (
        <ArticleReaderModal
          text={selection?.text || highlights?.[0]?.text || book?.title || 'Extracted page content ready for Bionic typography reading.'}
          title={book?.title || 'Article View'}
          onClose={() => setShowArticleReader(false)}
        />
      )}

      {/* AI Voice Audiobook Narration Modal */}
      {showAudiobookPlayer && (
        <AudiobookPlayerModal
          text={selection?.text || highlights?.[0]?.text || book?.description || book?.title || 'Welcome to BOOKS AI Voice Audiobook Player.'}
          title={book?.title || 'Audiobook Player'}
          author={book?.author || 'BOOKS Reader'}
          coverUrl={book?.coverUrl}
          onClose={() => setShowAudiobookPlayer(false)}
        />
      )}
    </div>
  );
}
