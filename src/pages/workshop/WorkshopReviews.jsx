import React, { useState } from 'react';
import {
  Star, ThumbsUp, ThumbsDown, Send, CheckCircle,
  Filter, MessageSquare, Clock, ChevronDown, ChevronUp,
  Flag, User,
} from 'lucide-react';

const initialReviews = [
  { id: 'R001', customer: "Nguyen Van An", taskId: 'WO-040', service: "Car flooded", rating: 5, comment: "Workshop Staff arrived quickly, handled professionally, explained clearly. Very satisfied!", time: '15:20', status: 'pending', reply: null },
  { id: 'R002', customer: "Tran Thi Binh", taskId: 'WO-038', service: "Replace tire", rating: 4, comment: "Good service, prices are a bit high but the Workshop Staff are enthusiastic. Will come back.", time: '14:45', status: 'replied', reply: "Thank you for trusting Garage Minh Chau! We will consider adjusting the price to be more reasonable." },
  { id: 'R003', customer: "Le Minh Chau", taskId: 'WO-035', service: "Towing the car", rating: 3, comment: "Waited a bit, the Workshop Staff arrived after 30 minutes. Repair quality is good but needs to be more punctual.", time: '13:10', status: 'pending', reply: null },
  { id: 'R004', customer: "Pham Quoc Dung", taskId: 'WO-033', service: "Electricity & Batteries", rating: 5, comment: "Workshop Staff Hung is very good, quick repair, clear quote. Best garage in the area!", time: '11:30', status: 'replied', reply: "We are happy to serve you! Workshop Staff Hung will continue to try harder." },
  { id: 'R005', customer: "Dinh Thi Hoa", taskId: 'WO-031', service: "Maintenance", rating: 2, comment: "The Workshop Staff arrived late and had an unfriendly attitude. Will not come back.", time: '10:20', status: 'pending', reply: null, isCritical: true },
];

const ratingColors = { 5: 'var(--green-400)', 4: '#f59e0b', 3: 'var(--orange-400)', 2: 'var(--red-400)', 1: 'var(--red-400)' };

export default function WorkshopReviews() {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState('all');
  const [replies, setReplies] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [sentId, setSentId] = useState(null);

  const filtered = reviews.filter(r =>
    filter === 'all' || (filter === 'pending' && r.status === 'pending') || (filter === 'replied' && r.status === 'replied') || (filter === 'critical' && r.rating <= 3)
  );

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const counts = { 5: reviews.filter(r => r.rating === 5).length, 4: reviews.filter(r => r.rating === 4).length, 3: reviews.filter(r => r.rating === 3).length, 2: reviews.filter(r => r.rating === 2).length, 1: reviews.filter(r => r.rating === 1).length };

  const sendReply = (id) => {
    const text = replies[id];
    if (!text?.trim()) return;
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'replied', reply: text.trim() } : r));
    setReplies(prev => ({ ...prev, [id]: '' }));
    setSentId(id);
    setTimeout(() => setSentId(null), 2500);
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Customer Reviews & Reviews</h1>
        <p>View and respond to customer reviews to improve service quality</p>
      </div>

      {/* Summary */}
      <div className="grid" style={{ gridTemplateColumns: '0.5fr 1.5fr', gap: 20, marginBottom: 24 }}>
        <div className="card p-6" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{avgRating}</div>
          <div style={{ display: 'flex', gap: 3, justifyContent: 'center', margin: '8px 0' }}>
            {[1,2,3,4,5].map(s => <Star key={s} size={18} fill={s <= Math.round(avgRating) ? '#f59e0b' : 'none'} color={s <= Math.round(avgRating) ? '#f59e0b' : 'var(--border-default)'} />)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{reviews.length} Evaluate</div>
        </div>

        <div className="card p-6">
          <div className="section-title" style={{ marginBottom: 12 }}>Rating distribution</div>
          {[5, 4, 3, 2, 1].map(star => {
            const count = counts[star];
            const pct = Math.round((count / reviews.length) * 100);
            return (
              <div key={star} className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={s <= star ? '#f59e0b' : 'none'} color={s <= star ? '#f59e0b' : 'var(--border-default)'} />)}
                </div>
                <div style={{ flex: 1, height: 8, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: ratingColors[star], borderRadius: 99, boxShadow: `0 0 6px ${ratingColors[star]}44` }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <Filter size={14} color="var(--text-muted)" />
        {[
          { key: 'all', label: "All" },
          { key: 'pending', label: "No response yet" },
          { key: 'replied', label: "Responded" },
          { key: 'critical', label: "Needs treatment (≤3★)" },
        ].map(f => (
          <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.key)}>
            {f.label} {f.key === 'pending' && reviews.filter(r => r.status === 'pending').length > 0 && <span className="nav-badge" style={{ marginLeft: 4 }}>{reviews.filter(r => r.status === 'pending').length}</span>}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map(r => (
          <div key={r.id} className="card" style={{
            padding: '16px 20px',
            borderLeft: r.rating >= 4 ? '3px solid var(--green-400)' : r.rating === 3 ? '3px solid var(--orange-400)' : '3px solid var(--red-400)',
          }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3" style={{ flex: 1 }}>
                <div className="user-avatar" style={{ width: 38, height: 38, fontSize: '0.75rem', flexShrink: 0 }}>
                  {r.customer.split(' ').slice(-2).map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{r.customer}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.taskId}</span>
                    <span className="badge" style={{ fontSize: '0.62rem', background: 'rgba(217,119,6,0.1)', color: '#f59e0b', border: 'none' }}>{r.service}</span>
                    <span className={`badge ${r.status === 'replied' ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: '0.62rem' }}>
                      {r.status === 'replied' ? "✓ Responded" : "No response yet"}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />{r.time}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= r.rating ? '#f59e0b' : 'none'} color={s <= r.rating ? '#f59e0b' : 'var(--border-default)'} />)}
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: ratingColors[r.rating], marginLeft: 4 }}>{r.rating}/5</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 6 }}>
                    "{r.comment}"
                  </div>
                  {r.reply && (
                    <div style={{ padding: '8px 12px', borderRadius: 'var(--r-sm)', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', marginBottom: 8 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--green-400)', fontWeight: 700, marginBottom: 3 }}>SHOP'S FEEDBACK:</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.reply}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reply area */}
            {r.status === 'pending' && (
              <div style={{ marginTop: 10 }}>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Write feedback for customers..."
                  value={replies[r.id] || ''}
                  onChange={e => setReplies(prev => ({ ...prev, [r.id]: e.target.value }))}
                  style={{ marginBottom: 8 }}
                />
                <div className="flex items-center gap-3">
                  <button className="btn btn-sm" style={{ background: 'rgba(217,119,6,0.15)', color: '#f59e0b', border: '1px solid rgba(217,119,6,0.3)' }} onClick={() => sendReply(r.id)}>
                    <Send size={12} /> Send feedback
                  </button>
                  {sentId === r.id && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--green-400)', fontWeight: 600 }}>
                      <CheckCircle size={12} style={{ display: 'inline', marginRight: 3 }} />Sent
                    </span>
                  )}
                  {r.isCritical && (
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      <Flag size={12} /> Report comments
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
