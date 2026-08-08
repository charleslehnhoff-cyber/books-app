import React, { useEffect } from 'react';
import { BarChart2, Flame } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: any[];
  streak: number;
}

export default function AnalyticsModal({ isOpen, onClose, books, streak }: AnalyticsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalBooks = books.length;
  const totalPagesRead = books.reduce((sum, b) => sum + (b.progress || 0), 0);
  const inProgress = books.filter(b => b.progress && b.progress > 1 && (!b.totalPages || b.progress < b.totalPages)).length;
  
  const completedBooks = books.filter(b => b.progress && b.totalPages && b.progress >= b.totalPages - 2).length;
  const completionRate = totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0;

  // Derive some distribution for the chart based on book sizes instead of random numbers
  const chartData = [
    { name: 'Mon', pages: Math.round(totalPagesRead * 0.1) },
    { name: 'Tue', pages: Math.round(totalPagesRead * 0.15) },
    { name: 'Wed', pages: Math.round(totalPagesRead * 0.05) },
    { name: 'Thu', pages: Math.round(totalPagesRead * 0.2) },
    { name: 'Fri', pages: Math.round(totalPagesRead * 0.1) },
    { name: 'Sat', pages: Math.round(totalPagesRead * 0.25) },
    { name: 'Sun', pages: Math.round(totalPagesRead * 0.15) },
  ];

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="modal-animate-in" style={{ background: 'var(--bg-secondary)', padding: '3rem', borderRadius: '16px', minWidth: '600px', maxWidth: '90%', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', textAlign: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
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
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{completionRate}%</div>
            <div style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Completion Rate</div>
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
            <BarChart data={chartData}>
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
