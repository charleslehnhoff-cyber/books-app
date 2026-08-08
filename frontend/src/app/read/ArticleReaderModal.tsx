import React, { useState, useMemo } from 'react';
import { X, Sparkles, Type, Eye, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface ArticleReaderModalProps {
  text: string;
  title: string;
  onClose: () => void;
}

export default function ArticleReaderModal({ text, title, onClose }: ArticleReaderModalProps) {
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono' | 'dyslexic'>('serif');
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineHeight, setLineHeight] = useState<number>(1.7);
  const [isBionic, setIsBionic] = useState<boolean>(true);
  const [readerTheme, setReaderTheme] = useState<'obsidian' | 'sepia' | 'light'>('obsidian');

  // Convert plain text into Bionic Reading format (emboldening first 1-3 letters of each word)
  const formattedParagraphs = useMemo(() => {
    const paragraphs = (text || 'No article text extracted for this page. Click and drag to highlight any text block.').split('\n\n');
    
    return paragraphs.map((p, pIdx) => {
      const words = p.split(' ');
      const bionicWords = words.map((w, wIdx) => {
        if (!w || !isBionic) return w;
        const mid = Math.ceil(w.length / 2);
        const boldPart = w.slice(0, mid);
        const restPart = w.slice(mid);
        return <React.Fragment key={wIdx}><strong style={{ fontWeight: 700, color: 'var(--bionic-bold, inherit)' }}>{boldPart}</strong>{restPart}{' '}</React.Fragment>;
      });
      return <p key={pIdx} style={{ marginBottom: '1.5rem', lineHeight }}>{isBionic ? bionicWords : p}</p>;
    });
  }, [text, isBionic, lineHeight]);

  const themeStyles = {
    obsidian: { bg: '#010105', cardBg: '#070d18', text: '#ffffff', border: '#182B49', bionicBold: '#00CCFF' },
    sepia: { bg: '#fbf0d9', cardBg: '#f4e4c1', text: '#5f4b32', border: '#e2cb98', bionicBold: '#2c1d0c' },
    light: { bg: '#ffffff', cardBg: '#f8fafc', text: '#0f172a', border: '#e2e8f0', bionicBold: '#0284c7' }
  }[readerTheme];

  const fontStyles = {
    serif: 'Georgia, Merriweather, serif',
    sans: 'var(--font-secondary), -apple-system, sans-serif',
    mono: 'monospace',
    dyslexic: 'OpenDyslexic, sans-serif'
  }[fontFamily];

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{ zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          width: '900px',
          maxWidth: '95vw',
          height: '85vh',
          backgroundColor: themeStyles.bg,
          color: themeStyles.text,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          overflow: 'hidden'
        }}
      >
        {/* Top Control Bar */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${themeStyles.border}`,
          backgroundColor: themeStyles.cardBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: themeStyles.text }}>Clean Article View</h3>
          </div>

          {/* Controls: Bionic, Font Family, Font Size, Theme */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Bionic Toggle */}
            <button
              onClick={() => setIsBionic(!isBionic)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: `1px solid ${isBionic ? 'var(--accent)' : themeStyles.border}`,
                backgroundColor: isBionic ? 'rgba(0, 204, 255, 0.15)' : 'transparent',
                color: isBionic ? 'var(--accent)' : themeStyles.text,
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Eye size={16} /> <strong>Bio</strong>nic {isBionic && <Check size={14} />}
            </button>

            {/* Font Family Selector */}
            <div style={{ display: 'flex', backgroundColor: themeStyles.bg, borderRadius: '8px', border: `1px solid ${themeStyles.border}`, padding: '2px' }}>
              {(['serif', 'sans', 'mono'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFontFamily(f)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: fontFamily === f ? 'var(--accent)' : 'transparent',
                    color: fontFamily === f ? '#000' : themeStyles.text,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Font Size Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                style={{ padding: '0.3rem 0.5rem', background: 'transparent', border: `1px solid ${themeStyles.border}`, borderRadius: '6px', color: themeStyles.text, cursor: 'pointer' }}
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: '0.85rem', minWidth: '36px', textAlign: 'center', fontWeight: 600 }}>{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                style={{ padding: '0.3rem 0.5rem', background: 'transparent', border: `1px solid ${themeStyles.border}`, borderRadius: '6px', color: themeStyles.text, cursor: 'pointer' }}
              >
                <ZoomIn size={16} />
              </button>
            </div>

            {/* Theme Selector */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['obsidian', 'sepia', 'light'] as const).map(t => (
                <div
                  key={t}
                  onClick={() => setReaderTheme(t)}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: t === 'obsidian' ? '#010105' : t === 'sepia' ? '#fbf0d9' : '#ffffff',
                    border: readerTheme === t ? '2px solid var(--accent)' : '1px solid #666',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>

            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: themeStyles.text, cursor: 'pointer', marginLeft: '0.5rem' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Text Article Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem 3rem', fontFamily: fontStyles, fontSize: `${fontSize}px`, color: themeStyles.text, ['--bionic-bold' as any]: themeStyles.bionicBold }}>
          <h1 style={{ fontFamily: fontStyles, fontSize: `${fontSize * 1.6}px`, marginBottom: '1.5rem', lineHeight: 1.2, fontWeight: 700 }}>{title}</h1>
          <div style={{ width: '60px', height: '3px', backgroundColor: 'var(--accent)', marginBottom: '2rem', borderRadius: '2px' }} />
          {formattedParagraphs}
        </div>
      </div>
    </div>
  );
}
