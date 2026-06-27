import React, { useState } from 'react';
import { MessageSquare, Trash2, Flag, X, CheckCircle } from 'lucide-react';
import { forumPosts } from '../../data/mockData';

// Build comment mock from posts
const initialComments = forumPosts.flatMap(p => (
  new Array(Math.min(3, Math.max(0, Math.floor(Math.random()*3)))).fill(0).map((_, i) => ({
    id: `${p.id}-c${i+1}`,
    postId: p.id,
    postTitle: p.title,
    author: `User${i+1}`,
    content: `Sample comments ${i+1} above ${p.id}`,
    time: '14:2' + i,
    flagged: Math.random() > 0.8,
  }))
));

export default function CommentModeration() {
  const [comments, setComments] = useState(initialComments);

  const remove = (id) => setComments(prev => prev.filter(c => c.id !== id));
  const flag = (id) => setComments(prev => prev.map(c => c.id === id ? { ...c, flagged: !c.flagged } : c));

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Moderation Comments</h1>
        <p>Manage comments under community posts (FE-only)</p>
      </div>

      <div className="card" style={{ padding: 12 }}>
        {comments.length === 0 && <div style={{ color: 'var(--text-muted)' }}>There are no comments to moderate.</div>}
        {comments.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{c.author} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>above {c.postTitle}</span></div>
              <div style={{ color: 'var(--text-secondary)', marginTop: 6 }}>{c.content}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{c.time}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => flag(c.id)}>{c.flagged ? "Remove flag" : 'Flag'}</button>
              <button className="btn btn-danger btn-sm" onClick={() => remove(c.id)}><Trash2 size={12} /> Erase</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
