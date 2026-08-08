const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
const fixedTop = `"use client";

import { useEffect, useState, useRef } from 'react';
import { Book, Library, Settings, Search, Plus, Moon, Sun, BookOpen, Trash2, MoreVertical, X, LayoutGrid, List, Play, Command, Heart, Edit3, BarChart2, UploadCloud, CheckCircle, FileText, Clock, Zap, Award, Filter, SortDesc, Flame } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import BookCard from './components/BookCard';

export type BookType = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  cover?: string;
  collections?: string[];
  progress?: number;
  uploadDate?: string;
  totalPages?: number;
};

export type ShelfType = {
  id: string;
  name: string;
  order: number;
};
`;

// Find where UploadTask starts
const uploadTaskIndex = lines.findIndex(l => l.includes('type UploadTask'));
if (uploadTaskIndex !== -1) {
    const restOfFile = lines.slice(uploadTaskIndex).join('\n');
    fs.writeFileSync(file, fixedTop + '\n' + restOfFile);
    console.log('Fixed file top');
} else {
    console.log('UploadTask not found');
}
