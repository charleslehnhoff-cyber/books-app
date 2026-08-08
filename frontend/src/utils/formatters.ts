import React from 'react';
import { BookType } from '../types';

export const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

export const getFallbackSvg = (title: string) => {
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

export const formatTitle = (title: string) => {
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

export const getCoverUrl = (book: BookType | null | undefined) => {
  if (!book) return getFallbackSvg('');
  if (book.coverUrl && book.coverUrl.startsWith('http')) return book.coverUrl.replace('http:', 'https:');
  return `/api/books/${book.id}/cover`;
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, book: BookType) => {
  const target = e.currentTarget;
  if (!target.src.includes('/api/books/') && !target.src.includes('data:image')) {
    target.src = `/api/books/${book.id}/cover?t=${Date.now()}`;
  } else if (!target.src.includes('data:image')) {
    target.src = getFallbackSvg(book.title);
  }
};
