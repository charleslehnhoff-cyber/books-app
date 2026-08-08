import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, FastForward, Rewind, Clock, Mic, Sparkles } from 'lucide-react';

interface AudiobookPlayerModalProps {
  text: string;
  title: string;
  author: string;
  coverUrl?: string;
  onClose: () => void;
}

export default function AudiobookPlayerModal({
  text,
  title,
  author,
  coverUrl,
  onClose
}: AudiobookPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(-1);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load available TTS Voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        if (available.length > 0 && !selectedVoice) {
          const englishVoice = available.find(v => v.lang.startsWith('en')) || available[0];
          setSelectedVoice(englishVoice.name);
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Split text into words for live sync
  const words = text ? text.split(/\s+/) : ['No', 'text', 'extracted', 'for', 'audio', 'narration.'];

  // Start or Stop Speech
  const togglePlay = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.rate = playbackRate;
    u.pitch = pitch;

    if (selectedVoice) {
      const v = voices.find(vo => vo.name === selectedVoice);
      if (v) u.voice = v;
    }

    // Word boundary tracking for live highlight
    u.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name === 'word') {
        const charIdx = e.charIndex;
        // Calculate word index based on character offset
        let acc = 0;
        for (let i = 0; i < words.length; i++) {
          acc += words[i].length + 1;
          if (acc >= charIdx) {
            setCurrentWordIdx(i);
            break;
          }
        }
      }
    };

    u.onend = () => {
      setIsPlaying(false);
      setCurrentWordIdx(-1);
    };

    u.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    setIsPlaying(true);

    // Setup Media Session API for Lockscreen Audio Controls
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || 'BOOKS Audiobook',
        artist: author || 'Narration Engine',
        artwork: coverUrl ? [{ src: coverUrl, sizes: '512x512', type: 'image/jpeg' }] : []
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    }
  };

  // Sleep Timer logic
  useEffect(() => {
    if (sleepTimerMinutes === null) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setSleepTimerRemaining(null);
      return;
    }

    setSleepTimerRemaining(sleepTimerMinutes * 60);

    timerIntervalRef.current = setInterval(() => {
      setSleepTimerRemaining(prev => {
        if (prev === null || prev <= 1) {
          window.speechSynthesis.cancel();
          setIsPlaying(false);
          clearInterval(timerIntervalRef.current!);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sleepTimerMinutes]);

  const handleClose = () => {
    window.speechSynthesis.cancel();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          width: '560px',
          maxWidth: '92vw',
          backgroundColor: '#070d18',
          color: '#ffffff',
          border: '1px solid #182B49',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}
      >
        {/* Header */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>AI Voice Audiobook Narration</h3>
          </div>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Book Cover / Vinyl Disk Aura */}
        <div style={{ position: 'relative', margin: '0.5rem 0' }}>
          <div style={{
            width: '130px',
            height: '180px',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: isPlaying ? '0 0 35px rgba(0, 204, 255, 0.5)' : '0 10px 25px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease',
            border: '2px solid rgba(0, 204, 255, 0.3)'
          }}>
            {coverUrl ? (
              <img src={coverUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #182B49 0%, #010105 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Volume2 size={40} color="var(--accent)" />
              </div>
            )}
          </div>
        </div>

        {/* Title & Author */}
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{title}</h4>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>by {author || 'Unknown Author'}</p>
        </div>

        {/* Live Synchronized Word-by-Word Reader Box */}
        <div style={{
          width: '100%',
          maxHeight: '120px',
          overflowY: 'auto',
          backgroundColor: '#010105',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid #182B49',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          textAlign: 'center'
        }}>
          {words.map((w, idx) => (
            <span 
              key={idx} 
              style={{
                backgroundColor: currentWordIdx === idx ? 'rgba(0, 204, 255, 0.35)' : 'transparent',
                color: currentWordIdx === idx ? '#00CCFF' : '#cbd5e1',
                padding: '0.1rem 0.2rem',
                borderRadius: '4px',
                fontWeight: currentWordIdx === idx ? 700 : 400,
                transition: 'all 0.1s ease'
              }}
            >
              {w}{' '}
            </span>
          ))}
        </div>

        {/* Audio Controls (Play/Pause/Speed) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', margin: '0.5rem 0' }}>
          {/* Speed Buttons */}
          <div style={{ display: 'flex', gap: '0.3rem', background: '#010105', padding: '4px', borderRadius: '10px', border: '1px solid #182B49' }}>
            {[0.8, 1.0, 1.25, 1.5, 2.0].map(rate => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: playbackRate === rate ? 'var(--accent)' : 'transparent',
                  color: playbackRate === rate ? '#000' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Main Play/Pause Circle Button */}
          <button
            onClick={togglePlay}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(0, 204, 255, 0.5)',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isPlaying ? <Pause size={28} fill="#000" /> : <Play size={28} fill="#000" style={{ marginLeft: '4px' }} />}
          </button>

          {/* Sleep Timer Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} color={sleepTimerRemaining ? 'var(--accent)' : '#94a3b8'} />
            <select
              value={sleepTimerMinutes || ''}
              onChange={(e) => setSleepTimerMinutes(e.target.value ? Number(e.target.value) : null)}
              style={{
                backgroundColor: '#010105',
                color: sleepTimerRemaining ? 'var(--accent)' : '#cbd5e1',
                border: '1px solid #182B49',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="">Timer: Off</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
            </select>
          </div>
        </div>

        {/* Voice Selector Row */}
        {voices.length > 0 && (
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#010105', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #182B49' }}>
            <Mic size={16} color="var(--accent)" />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Voice:</span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                color: '#fff',
                border: 'none',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {voices.map(v => (
                <option key={v.name} value={v.name} style={{ backgroundColor: '#070d18', color: '#fff' }}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {sleepTimerRemaining !== null && (
          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
            Sleep timer active: {Math.floor(sleepTimerRemaining / 60)}m {sleepTimerRemaining % 60}s remaining
          </span>
        )}
      </div>
    </div>
  );
}
