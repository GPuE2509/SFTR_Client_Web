import React, { useState, useRef } from 'react';
import {
  Pin, PinOff, Trash2, CheckCircle, Clock, MessageSquare,
  ThumbsUp, Eye, AlertTriangle, Shield, X, ChevronDown,
  Flag, Hammer, PenSquare,
} from 'lucide-react';
import { forumPosts } from '../../data/mockData';

function PostCard({ post, onPin, onDelete, onApprove, onEdit }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card"
      style={{
        borderLeft: post.hasViolation
          ? '3px solid var(--red-500)'
          : post.isPinned
          ? '3px solid var(--blue-primary)'
          : post.status === 'approved'
          ? '3px solid var(--green-500)'
          : '3px solid rgba(71,85,105,0.4)',
        transition: 'all 0.3s',
        animation: 'slide-in-up 0.35s ease-out',
      }}
    >
      <div style={{ padding: '16px 20px' }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3" style={{ flex: 1 }}>
            {/* Avatar */}
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: post.hasViolation ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg,#1a6cff,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'white', flexShrink: 0 }}>
              {post.avatar}
            </div>

            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 4 }}>
                {post.isPinned && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--blue-400)', background: 'rgba(26,108,255,0.1)', border: '1px solid rgba(26,108,255,0.3)', padding: '1px 7px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Pin size={9} /> Pinned
                  </span>
                )}
                {post.hasViolation && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--red-400)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1px 7px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Flag size={9} /> There is a violation
                  </span>
                )}
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{post.category}</span>
                {post.status === 'approved' && <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Approved</span>}
                {post.status === 'pending' && <span className="badge badge-orange" style={{ fontSize: '0.65rem' }}>Waiting for approval</span>}
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>
                {post.title}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{post.author}</span>
                {' · '}<Clock size={11} style={{ display: 'inline' }} /> {post.time}
              </div>

              {expanded && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '12px 0', borderTop: '1px solid var(--border-subtle)', marginTop: 4 }}>
                  {post.content}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4" style={{ marginTop: 8 }}>
                <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <ThumbsUp size={12} /> {post.likes.toLocaleString('vi-VN')}
                </div>
                <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <MessageSquare size={12} /> {post.comments} comment
                </div>
                <button
                  onClick={() => setExpanded(!expanded)}
                  style={{ fontSize: '0.75rem', color: 'var(--blue-400)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <Eye size={12} /> {expanded ? "Collapse" : "View content"}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
            {post.status === 'pending' && (
              <button className="btn btn-success btn-sm" onClick={() => onApprove(post.id)} style={{ padding: '5px 10px' }}>
                <CheckCircle size={12} /> Browse
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onPin(post.id)}
              style={{ padding: '5px 10px', color: post.isPinned ? 'var(--blue-400)' : 'var(--text-muted)' }}
              title={post.isPinned ? "Unpin" : "Pin the article"}
            >
              {post.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
              {post.isPinned ? "Unpin" : 'Ghim'}
            </button>
            {post.isPinned && (
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit && onEdit(post.id)} style={{ padding: '5px 10px' }}>
                <PenSquare size={12} /> Edit
              </button>
            )}
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(post.id)} style={{ padding: '5px 10px' }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForumModeration() {
  const [posts, setPosts] = useState(forumPosts);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState([]);
  const [activeTab, setActiveTab] = useState('queue');
  const [editingPinnedId, setEditingPinnedId] = useState(null);
  const [editPinnedContent, setEditPinnedContent] = useState('');
  const editPinnedRef = useRef(null);

  const filtered = posts.filter((p) => {
    if (activeTab === 'pinned') return p.isPinned;
    if (activeTab === 'violations') return p.hasViolation;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchStatus;
  });

  const togglePin = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, isPinned: !p.isPinned } : p));
  };

  const deletePost = (id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const approvePost = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
  };

  const handleEditPinned = (id) => {
    const p = posts.find(x => x.id === id);
    if (!p) return;
    setEditingPinnedId(id);
    setEditPinnedContent(p.content || '');
  };
  const saveEditPinned = () => {
    const html = editPinnedRef.current ? editPinnedRef.current.innerHTML : editPinnedContent;
    setPosts(prev => prev.map(p => p.id === editingPinnedId ? { ...p, content: html } : p));
    setEditingPinnedId(null);
    setEditPinnedContent('');
  };

  const toggleBatch = (id) => {
    setSelectedBatch(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const batchApprove = () => {
    setPosts(prev => prev.map(p => selectedBatch.includes(p.id) ? { ...p, status: 'approved' } : p));
    setSelectedBatch([]);
  };

  const batchDelete = () => {
    setPosts(prev => prev.filter(p => !selectedBatch.includes(p.id)));
    setSelectedBatch([]);
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Moderate the Community Forum</h1>
        <p>Manage post and pin queues and remove violating content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Waiting for approval", value: posts.filter(p => p.status === 'pending').length, color: 'var(--orange-400)' },
          { label: "Approved", value: posts.filter(p => p.status === 'approved').length, color: 'var(--green-400)' },
          { label: "Pin post", value: posts.filter(p => p.isPinned).length, color: 'var(--blue-400)' },
          { label: "There is a violation", value: posts.filter(p => p.hasViolation).length, color: 'var(--red-400)' },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: 20, maxWidth: 480 }}>
        <button className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>
          <Clock size={13} /> Queue ({posts.filter(p => p.status === 'pending').length})
        </button>
        <button className={`tab-btn ${activeTab === 'pinned' ? 'active' : ''}`} onClick={() => setActiveTab('pinned')}>
          <Pin size={13} /> Pinned ({posts.filter(p => p.isPinned).length})
        </button>
        <button className={`tab-btn ${activeTab === 'violations' ? 'active' : ''}`} onClick={() => setActiveTab('violations')}>
          <Flag size={13} /> Violation ({posts.filter(p => p.hasViolation).length})
        </button>
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          All ({posts.length})
        </button>
      </div>

      {/* Batch Toolbar */}
      {selectedBatch.length > 0 && (
        <div style={{ background: 'rgba(26,108,255,0.08)', border: '1px solid rgba(26,108,255,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--blue-400)', fontWeight: 600 }}>
            Selected {selectedBatch.length} article
          </span>
          <button className="btn btn-success btn-sm" onClick={batchApprove}><CheckCircle size={12} /> Browse all</button>
          <button className="btn btn-danger btn-sm" onClick={batchDelete}><Trash2 size={12} /> Delete all</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedBatch([])}><X size={12} /> Deselect</button>
        </div>
      )}

      {/* Filter bar (all tab) */}
      {activeTab === 'all' && (
        <div className="flex gap-3" style={{ marginBottom: 16 }}>
          <select className="input" style={{ maxWidth: 180 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All status</option>
            <option value="pending">Waiting for approval</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      )}

      {/* Posts list */}
      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.length === 0 && (
          <div className="card p-6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <Hammer size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div>There are no articles in this category</div>
          </div>
        )}
        {filtered.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPin={togglePin}
            onDelete={deletePost}
            onApprove={approvePost}
            onEdit={handleEditPinned}
          />
        ))}

        {/* Edit pinned post modal */}
        {editingPinnedId && (
          <div className="modal-overlay" onClick={() => setEditingPinnedId(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
              <div className="modal-header">
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>Edit pinned post</div>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingPinnedId(null)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => document.execCommand('bold', false, null)}><strong>B</strong></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => document.execCommand('italic', false, null)}><em>I</em></button>
                </div>
                <div ref={editPinnedRef} contentEditable suppressContentEditableWarning className="input" style={{ minHeight: 160 }} dangerouslySetInnerHTML={{ __html: editPinnedContent }} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingPinnedId(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveEditPinned}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
