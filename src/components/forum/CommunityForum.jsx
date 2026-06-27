import React, { useState, useRef } from 'react';
import {
  ThumbsUp, MessageSquare, Send, Image as ImageIcon, Trash2, X, Lock, Search,
  AlertTriangle, PenSquare, Camera, Plus,
} from 'lucide-react';

// Initial rich mock data matching the new 2-column Facebook-style structure
const INITIAL_FORUM_POSTS = [
  {
    id: 'post-001',
    author: "Tran Van Hung",
    avatar: 'TH',
    role: 'user',
    category: "Urgent report",
    time: "15 minutes ago",
    content: "The section of Nguyen Huu Canh street under the overpass is flooded about 50-60cm deep due to the rising tide combined with heavy rain earlier. Many motorbikes trying to pass through stalled. Everyone should proactively choose alternative travel routes to avoid congestion and vehicle damage!",
    image: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
    likes: 84,
    likedByMe: false,
    comments: [
      {
        id: 'comment-101',
        author: "Le Minh Chau",
        avatar: 'LC',
        role: 'volunteer',
        content: "Thank you for your timely information. Our team of volunteers is moving to the nearby intersection to help push people's carts.",
        time: "12 minutes ago",
        likes: 12,
        likedByMe: false,
        replies: [
          {
            id: 'reply-201',
            author: "Tran Van Hung",
            avatar: 'TH',
            role: 'user',
            content: "@Le Minh Chau This is so great, guys! Appreciate the support of the volunteer team very much.",
            time: "10 minutes ago",
            likes: 4,
            likedByMe: false
          }
        ]
      },
      {
        id: 'comment-102',
        author: "Nguyen Thi Lan",
        avatar: 'NL',
        role: 'user',
        content: "Oh, I'm so lucky I was going to pass this way to pick up my child from extra school. Thank you Mr. Hung for the early warning!",
        time: "8 minutes ago",
        likes: 3,
        likedByMe: false,
        replies: []
      }
    ]
  },
  {
    id: 'post-002',
    author: 'Admin FloodSense',
    avatar: 'AF',
    role: 'admin',
    category: "Notification",
    time: "2 hours ago",
    content: "🔔 IMPORTANT NOTICE: Updated flood risk level this evening in the City area. According to direct measurement data from the network of public IoT sensor stations, the water level in the Saigon River basin has exceeded alarm threshold 3. People are recommended to increase vigilance, raise properties that are easily wet and actively monitor warning signals on the application.",
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    likes: 342,
    likedByMe: false,
    comments: [
      {
        id: 'comment-103',
        author: "Dinh Thi Hoa",
        avatar: 'DH',
        role: 'user',
        content: "In the area of ​​Hiep Thanh Ward, District 12, the water is about to overflow the embankment, hopefully the tide will not rise further tonight.",
        time: "1 hour ago",
        likes: 28,
        likedByMe: false,
        replies: [
          {
            id: 'reply-202',
            author: "Nguyen Hung Cuong",
            avatar: 'HC',
            role: 'volunteer',
            content: "@Dinh Thi Hoa Dear Ms. Hoa, if you need help with sandbags to prevent flooding into your house, just send an SOS signal on the app, we will be there to help.",
            time: "45 minutes ago",
            likes: 18,
            likedByMe: false
          }
        ]
      }
    ]
  },
  {
    id: 'post-003',
    author: "Nguyen Hung Cuong",
    avatar: 'HC',
    role: 'volunteer',
    category: "Experience",
    time: "4 hours ago",
    content: "Quickly sharing 3 tips to protect motorbike spark plugs from getting into water when going through lightly flooded areas: 1. Absolutely hold the throttle evenly, do not release the throttle suddenly. 2. If the engine accidentally stalls, do not try to restart it multiple times to avoid water being sucked deep into the combustion chamber. 3. Always have a dry rag and a specialized spark plug removal tube under the seat.",
    image: null,
    likes: 156,
    likedByMe: false,
    comments: []
  }
];

export default function CommunityForum({ role = 'user', onRedirectToRegister }) {
  const [posts, setPosts] = useState(INITIAL_FORUM_POSTS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("All");
  // Edit / Report states
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [reportingPost, setReportingPost] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  
  // Post Creator states
  const [showCreator, setShowCreator] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState("Experience");
  const [newPostImages, setNewPostImages] = useState([]); // array of base64
  const fileInputRef = useRef(null);
  const editContentRef = useRef(null);

  // Guest alert state
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Active reply input fields: maps parentCommentId -> string
  const [replyInputs, setReplyInputs] = useState({});
  // Active main comment input fields: maps postId -> string
  const [commentInputs, setCommentInputs] = useState({});

  const categories = ["All", "Urgent report", "Notification", "Experience", "Information", "Q&A"];

  const verifyAction = (actionCallback) => {
    if (role === 'guest') {
      setShowGuestModal(true);
      return false;
    }
    if (actionCallback) actionCallback();
    return true;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { alert("Photos maximum 5MB per file"); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImages(prev => prev.length < 6 ? [...prev, reader.result] : prev);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-selected
    e.target.value = '';
  };
  const removePostImage = (idx) => setNewPostImages(prev => prev.filter((_, i) => i !== idx));

  // Create Post
  const handleCreatePost = () => {
    verifyAction(() => {
      if (!newPostContent.trim()) return;
      const newPost = {
        id: `post-${Date.now()}`,
        author: role === 'volunteer' ? "Nguyen Hung Cuong" : "You (Member)",
        avatar: role === 'volunteer' ? 'HC' : 'ME',
        role: role,
        category: newPostCategory,
        time: "Just finished",
        content: newPostContent,
        image: newPostImages[0] || null, // first image as main
        images: newPostImages,
        likes: 0,
        likedByMe: false,
        comments: []
      };
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setNewPostImages([]);
      setShowCreator(false);
    });
  };

  // Edit Post (FE-only)
  const handleStartEditPost = (postId) => {
    const p = posts.find(x => x.id === postId);
    if (!p) return;
    setEditingPost(postId);
    setEditContent(p.content || '');
  };
  const handleSaveEditPost = () => {
    const html = editContentRef.current ? editContentRef.current.innerHTML : editContent;
    setPosts(prev => prev.map(p => p.id === editingPost ? { ...p, content: html } : p));
    setEditingPost(null);
    setEditContent('');
  };
  const handleCancelEdit = () => { setEditingPost(null); setEditContent(''); };

  // Report Post (FE-only)
  const handleStartReport = (postId) => { setReportingPost(postId); setReportReason(''); };
  const handleSendReport = () => {
    if (!reportingPost) return;
    setPosts(prev => prev.map(p => p.id === reportingPost ? { ...p, reported: true, reportReason } : p));
    setReportingPost(null);
    setReportReason('');
    setReportSent(true);
    setTimeout(() => setReportSent(false), 3000);
  };

  // Like Post
  const handleLikePost = (postId) => {
    verifyAction(() => {
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const liked = !post.likedByMe;
          return {
            ...post,
            likedByMe: liked,
            likes: liked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      }));
    });
  };

  // Delete Post
  const handleDeletePost = (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      setPosts(prev => prev.filter(post => post.id !== postId));
    }
  };

  // Like Comment (Level 1 or Level 2)
  const handleLikeComment = (postId, commentId, replyId = null) => {
    verifyAction(() => {
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map(c => {
              if (!replyId && c.id === commentId) {
                const liked = !c.likedByMe;
                return { ...c, likedByMe: liked, likes: liked ? c.likes + 1 : c.likes - 1 };
              } else if (replyId && c.id === commentId) {
                return {
                  ...c,
                  replies: c.replies.map(r => {
                    if (r.id === replyId) {
                      const liked = !r.likedByMe;
                      return { ...r, likedByMe: liked, likes: liked ? r.likes + 1 : r.likes - 1 };
                    }
                    return r;
                  })
                };
              }
              return c;
            })
          };
        }
        return post;
      }));
    });
  };

  // Delete Comment / Reply (open confirmation modal)
  const handleDeleteComment = (postId, commentId, replyId = null) => {
    setDeleteCommentTarget({ postId, commentId, replyId });
  };

  const confirmDeleteComment = () => {
    const target = deleteCommentTarget;
    if (!target) return;
    const { postId, commentId, replyId } = target;
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(c => {
            if (c.id === commentId) {
              if (replyId) {
                return {
                  ...c,
                  replies: c.replies.filter(r => r.id !== replyId)
                };
              }
            }
            return c;
          }).filter(c => replyId || c.id !== commentId)
        };
      }
      return post;
    }));
    setDeleteCommentTarget(null);
  };

  // Add Level 1 Comment
  const handleAddComment = (postId) => {
    verifyAction(() => {
      const content = commentInputs[postId] || '';
      if (!content.trim()) return;

      const newComment = {
        id: `comment-${Date.now()}`,
        author: role === 'volunteer' ? "Nguyen Hung Cuong" : "You (Member)",
        avatar: role === 'volunteer' ? 'HC' : 'ME',
        role: role,
        content: content,
        time: "Just finished",
        likes: 0,
        likedByMe: false,
        replies: []
      };

      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment]
          };
        }
        return post;
      }));

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    });
  };

  // Add Level 2 Comment (Nested Reply)
  const handleAddReply = (postId, commentId) => {
    verifyAction(() => {
      const content = replyInputs[commentId] || '';
      if (!content.trim()) return;

      const newReply = {
        id: `reply-${Date.now()}`,
        author: role === 'volunteer' ? "Nguyen Hung Cuong" : "You (Member)",
        avatar: role === 'volunteer' ? 'HC' : 'ME',
        role: role,
        content: content,
        time: "Just finished",
        likes: 0,
        likedByMe: false
      };

      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map(c => {
              if (c.id === commentId) {
                return {
                  ...c,
                  replies: [...c.replies, newReply]
                };
              }
              return c;
            })
          };
        }
        return post;
      }));

      // Close / reset input
      setReplyInputs(prev => {
        const copy = { ...prev };
        delete copy[commentId];
        return copy;
      });
    });
  };

  // Edit Comment inline (FE-only)
  const [editingComment, setEditingComment] = useState(null); // { postId, commentId, replyId? }
  const [editingCommentText, setEditingCommentText] = useState('');
  const startEditComment = (postId, commentId, replyId = null, currentText = '') => {
    setEditingComment({ postId, commentId, replyId });
    setEditingCommentText(currentText);
  };
  const saveEditComment = () => {
    if (!editingComment) return;
    const { postId, commentId, replyId } = editingComment;
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        comments: post.comments.map(c => {
          if (c.id !== commentId) return c;
          if (replyId) {
            return {
              ...c,
              replies: c.replies.map(r => r.id === replyId ? { ...r, content: editingCommentText } : r)
            };
          }
          return { ...c, content: editingCommentText };
        })
      };
    }));
    setEditingComment(null);
    setEditingCommentText('');
  };
  const cancelEditComment = () => { setEditingComment(null); setEditingCommentText(''); };

  // Delete confirmation modal state for comments
  const [deleteCommentTarget, setDeleteCommentTarget] = useState(null); // { postId, commentId, replyId }

  // Handles clicking "Phản hồi" on Level 1 Comment or Level 2 Reply
  const handleReplyClick = (authorName, commentId) => {
    verifyAction(() => {
      // Set value with @Mention and open the input box
      setReplyInputs(prev => ({
        ...prev,
        [commentId]: `@${authorName} `
      }));

      // Focus the input element
      setTimeout(() => {
        const el = document.getElementById(`reply-input-${commentId}`);
        if (el) {
          el.focus();
        }
      }, 50);
    });
  };

  // Filter posts based on category and search query
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = post.content.toLowerCase().includes(search.toLowerCase()) || 
                          post.author.toLowerCase().includes(search.toLowerCase()) ||
                          post.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getRoleStyle = (userRole) => {
    switch (userRole) {
      case 'admin':
        return { border: '2px solid var(--gold-400)', badgeBg: 'rgba(234,179,8,0.12)', badgeColor: 'var(--gold-400)', label: 'BQT' };
      case 'volunteer':
        return { border: '2px solid var(--red-400)', badgeBg: 'rgba(239,68,68,0.12)', badgeColor: 'var(--red-400)', label: 'TNV' };
      case 'workshop':
        return { border: '2px solid var(--orange-400)', badgeBg: 'rgba(249,115,22,0.12)', badgeColor: 'var(--orange-400)', label: "Workshop" };
      default:
        return { border: '2px solid var(--cyan-400)', badgeBg: 'rgba(6,182,212,0.12)', badgeColor: 'var(--cyan-400)', label: "Member" };
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Search and Category Filters */}
      <div className="grid grid-2" style={{ gap: 16, marginBottom: 20, gridTemplateColumns: '1.2fr 0.8fr' }}>
        <div>
          <div className="input-group">
            <Search size={15} className="input-icon" />
            <input 
              className="input" 
              placeholder="Search for keywords, author name or post content..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedCategory(cat)}
              style={{ fontSize: '0.72rem', padding: '6px 12px' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── CREATE POST BUTTON BAR ── */}
      <div className="card p-5" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 100% 0%, rgba(6,182,212,0.05), transparent 50%)', pointerEvents: 'none' }} />
        <div className="flex items-center gap-3">
          <div className="user-avatar" style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#06b6d4,#1a6cff)', color: 'white', fontWeight: 700, flexShrink: 0 }}>
            {role === 'guest' ? 'G' : role === 'volunteer' ? 'HC' : 'ME'}
          </div>
          <button
            onClick={() => role === 'guest' ? setShowGuestModal(true) : setShowCreator(true)}
            style={{ flex: 1, textAlign: 'left', cursor: 'pointer', color: 'var(--text-muted)', background: 'rgba(18,29,40,0.4)', borderRadius: 24, padding: '10px 18px', border: '1px solid var(--border-dim)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}
          >
            {role === 'guest' ? "Log in to share flood information..." : "What are you thinking? Share images and flood information..."}
          </button>
          <button className="btn btn-primary" onClick={() => role === 'guest' ? setShowGuestModal(true) : setShowCreator(true)} style={{ flexShrink: 0, gap: 6 }}>
            <PenSquare size={14} /> Create articles
          </button>
        </div>
      </div>

      {/* ── CREATE POST MODAL ── */}
      {showCreator && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,10,18,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 24 }}>
          <div className="card page-enter" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-subtle)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PenSquare size={16} color="var(--cyan-400)" /> Create new article
              </div>
              <button onClick={() => { setShowCreator(false); setNewPostContent(''); setNewPostImages([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Body (scrollable) */}
            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              {/* Author + category */}
              <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                <div className="user-avatar" style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#06b6d4,#1a6cff)', color: 'white', fontWeight: 700 }}>
                  {role === 'volunteer' ? 'HC' : 'ME'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{role === 'volunteer' ? "Nguyen Hung Cuong" : "You (Member)"}</div>
                  <select className="input" style={{ marginTop: 4, padding: '2px 8px', fontSize: '0.72rem', height: 26, minWidth: 140, borderRadius: 12 }} value={newPostCategory} onChange={e => setNewPostCategory(e.target.value)}>
                    {categories.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <textarea
                className="input"
                rows={5}
                autoFocus
                placeholder="Describe specifically the location, water depth, damage or repair experience..."
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 16, resize: 'vertical' }}
              />

              {/* Image grid */}
              {newPostImages.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                  {newPostImages.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative', borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--border-dim)', aspectRatio: '1' }}>
                      <img src={src} alt={`img-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <button onClick={() => removePostImage(idx)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={11} color="white" />
                      </button>
                    </div>
                  ))}
                  {newPostImages.length < 6 && (
                    <button onClick={() => fileInputRef.current?.click()} style={{ borderRadius: 'var(--r-sm)', border: '1.5px dashed var(--border-dim)', background: 'rgba(18,29,40,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', aspectRatio: '1' }}>
                      <Plus size={18} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Add photos</span>
                    </button>
                  )}
                </div>
              )}

              {/* Drop zone (no images yet) */}
              {newPostImages.length === 0 && (
                <div onClick={() => fileInputRef.current?.click()} style={{ border: '1.5px dashed var(--border-dim)', borderRadius: 'var(--r-md)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 14, background: 'rgba(18,29,40,0.3)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: 'rgba(6,182,212,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={22} color="var(--cyan-400)" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Add images/videos</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>PNG, JPG · Maximum 6 photos · Each photo ≤ 5MB</div>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--cyan-400)', fontSize: '0.78rem', fontWeight: 600 }}>
                <ImageIcon size={15} /> Photo/Video {newPostImages.length > 0 && `(${newPostImages.length}/6)`}
              </button>
              <div className="flex gap-3">
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowCreator(false); setNewPostContent(''); setNewPostImages([]); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreatePost} disabled={!newPostContent.trim()} style={{ minWidth: 100 }}>
                  <Send size={13} /> Post now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Comment Confirmation Modal */}
      {deleteCommentTarget && (
        <div className="modal-overlay" onClick={() => setDeleteCommentTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>Confirm comment deletion</div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteCommentTarget(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete this comment? Action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteCommentTarget(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={confirmDeleteComment}>Erase</button>
            </div>
          </div>
        </div>
      )}

      {/* Feed list with 2-Column Split (50% Media/Caption on Left, 50% Threaded Comments on Right) */}
      <div style={{ display: 'grid', gap: 28 }}>
        {filteredPosts.map((post) => {
          const authorStyle = getRoleStyle(post.role);
          const isOwnPost = post.avatar === 'ME';
          const totalCommentsCount = post.comments.length + post.comments.reduce((acc, c) => acc + c.replies.length, 0);

          return (
            <div key={post.id} className="card page-enter" style={{ position: 'relative', overflow: 'hidden', padding: 0, border: '1px solid var(--border-subtle)' }}>
              
              <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 1fr', minHeight: 480, gap: 0 }}>
                
                {/* ============================================================
                    LEFT SIDE COLUMN (50%): AUTHOR HEADER, CAPTION, MEDIA, ACTIONS
                    ============================================================ */}
                <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid var(--border-subtle)' }}>
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4" style={{ marginBottom: 16 }}>
                      <div className="flex items-center gap-3">
                        <div className="user-avatar" style={{ width: 44, height: 44, border: authorStyle.border, padding: 1, background: 'var(--bg-elevated)' }}>
                          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(26,108,255,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {post.avatar}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{post.author}</span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: authorStyle.badgeBg, color: authorStyle.badgeColor, letterSpacing: '0.04em' }}>
                              {authorStyle.label}
                            </span>
                            <span className="badge" style={{ fontSize: '0.6rem', background: 'rgba(6,182,212,0.06)', color: 'var(--cyan-400)', border: '1px solid rgba(6,182,212,0.15)', padding: '1px 5px' }}>{post.category}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{post.time}</div>
                        </div>
                      </div>

                      {isOwnPost && (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: 'var(--red-400)', padding: 6 }} 
                          onClick={() => handleDeletePost(post.id)}
                          title="Delete posts"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Content text (Caption) */}
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
                      {post.content}
                    </div>

                    {/* Image Render */}
                    {post.image && (
                      <div className="flood-image-card" style={{ overflow: 'hidden', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', background: '#070c14', marginBottom: 12 }}>
                        <img 
                          src={post.image} 
                          alt="Post attachment" 
                          style={{ width: '100%', maxHeight: 260, objectFit: 'contain', display: 'block', transition: 'transform 0.4s' }} 
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions & Likes count (Strictly NO share button) */}
                  <div style={{ marginTop: 12 }}>
                    
                    {/* Likes & Comments stats row */}
                    <div className="flex items-center justify-between" style={{ paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)', marginBottom: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div className="flex items-center gap-1.5">
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--cyan-400)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem' }}>👍</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{post.likes} likes</span>
                      </div>
                      <div>
                        <span>{totalCommentsCount} comment</span>
                      </div>
                    </div>

                    {/* Interaction Buttons (Like, Comment, Edit, Report) */}
                    <div className="flex items-center gap-3">
                      <button
                        className="btn btn-ghost btn-sm flex-1"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: post.likedByMe ? 'var(--cyan-400)' : 'var(--text-secondary)', background: post.likedByMe ? 'rgba(6,182,212,0.06)' : 'transparent', border: '1px solid var(--border-dim)', height: 36 }}
                        onClick={() => handleLikePost(post.id)}
                      >
                        <ThumbsUp size={14} fill={post.likedByMe ? 'currentColor' : 'none'} />
                        <span style={{ fontWeight: 600 }}>Prefer</span>
                      </button>

                      <button
                        className="btn btn-ghost btn-sm flex-1"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-secondary)', border: '1px solid var(--border-dim)', height: 36 }}
                        onClick={() => {
                          const el = document.getElementById(`comment-focus-${post.id}`);
                          if (el) el.focus();
                        }}
                      >
                        <MessageSquare size={14} />
                        <span style={{ fontWeight: 600 }}>Comment</span>
                      </button>
                    </div>

                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      {isOwnPost || role === 'admin' ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleStartEditPost(post.id)}>Edit post</button>
                      ) : null}

                      <button className="btn btn-ghost btn-sm" onClick={() => handleStartReport(post.id)} style={{ color: 'var(--orange-400)' }}>Report article</button>
                    </div>
                  </div>
                  </div>

                {/* ============================================================
                    RIGHT SIDE COLUMN (50%): SCROLLABLE FB-STYLE COMMENTS (2-LEVEL)
                    ============================================================ */}
                <div style={{ 
                  padding: '24px 20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%', 
                  maxHeight: 520, 
                  background: 'rgba(18,29,40,0.18)', 
                  justifyContent: 'space-between' 
                }}>
                  
                  {/* Title / Info banner */}
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                    <span>COMMUNITY COMMENT</span>
                    <span style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--cyan-400)', padding: '2px 8px', borderRadius: 10, fontSize: '0.68rem', marginLeft: 'auto' }}>
                      {totalCommentsCount}
                    </span>
                  </div>

                  {/* Comments scroll container */}
                  <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingRight: 6, marginBottom: 12, display: 'grid', gap: 14 }}>
                    {post.comments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        There are no comments yet. Be the first to discuss!
                      </div>
                    ) : (
                      post.comments.map((comment) => {
                        const commRole = getRoleStyle(comment.role);
                        const isOwnComment = comment.avatar === 'ME';
                        const hasReplies = comment.replies && comment.replies.length > 0;
                        const showReplyBox = replyInputs[comment.id] !== undefined;

                        return (
                          <div key={comment.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            
                            {/* TẦNG 1: Main Comment bubble */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.62rem', border: commRole.border, flexShrink: 0 }}>
                                {comment.avatar}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                                
                                <div style={{ background: 'rgba(25,39,53,0.85)', padding: '8px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', position: 'relative', width: 'fit-content', maxWidth: '100%', wordBreak: 'break-word' }}>
                                  <div className="flex items-center gap-1.5" style={{ marginBottom: 3 }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>{comment.author}</span>
                                    <span style={{ fontSize: '0.48rem', fontWeight: 700, padding: '0px 4px', borderRadius: 3, background: commRole.badgeBg, color: commRole.badgeColor }}>
                                      {commRole.label}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    {editingComment && editingComment.postId === post.id && editingComment.commentId === comment.id && !editingComment.replyId ? (
                                      <div>
                                        <textarea className="input" rows={2} value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} />
                                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                          <button className="btn btn-sm" onClick={saveEditComment}>Save</button>
                                          <button className="btn btn-ghost btn-sm" onClick={cancelEditComment}>Cancel</button>
                                        </div>
                                      </div>
                                    ) : (
                                      comment.content
                                    )}
                                  </div>
                                  
                                  {/* Likes indicator on comment bubble (Facebook styled) */}
                                  {comment.likes > 0 && (
                                    <div style={{ position: 'absolute', bottom: -8, right: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', padding: '1px 5px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.55rem', color: 'var(--text-secondary)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                      <span>👍</span>
                                      <span style={{ fontWeight: 700 }}>{comment.likes}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Actions Level 1 comment (Thích + Phản hồi + Xoá + Thời gian) */}
                                <div className="flex items-center gap-3" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, paddingLeft: 4 }}>
                                  <button 
                                    style={{ background: 'transparent', border: 'none', color: comment.likedByMe ? 'var(--cyan-400)' : 'rgba(6,182,212,0.75)', fontWeight: 600, padding: 0, cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'inherit' }}
                                    onClick={() => handleLikeComment(post.id, comment.id)}
                                  >
                                    Prefer {comment.likes > 0 ? `(${comment.likes})` : ''}
                                  </button>
                                  <span>·</span>
                                  <button 
                                    style={{ background: 'transparent', border: 'none', color: 'rgba(6,182,212,0.75)', fontWeight: 600, padding: 0, cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'inherit' }}
                                    onClick={() => handleReplyClick(comment.author, comment.id)}
                                  >
                                    Feedback
                                  </button>
                                  
                                  {isOwnComment && (
                                    <>
                                      <span>·</span>
                                      <button 
                                        style={{ background: 'transparent', border: 'none', color: 'var(--red-400)', fontWeight: 600, padding: 0, cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'inherit' }}
                                        onClick={() => handleDeleteComment(post.id, comment.id)}
                                      >
                                        Erase
                                      </button>
                                    </>
                                  )}
                                  <span>·</span>
                                  <span style={{ fontSize: '0.65rem' }}>{comment.time}</span>
                                </div>
                              </div>
                            </div>

                            {/* TẦNG 2: Connected indentation for child replies (flattened layer containing all replies) */}
                            <div style={{ paddingLeft: 36, marginTop: 6, borderLeft: hasReplies || showReplyBox ? '1.5px solid var(--border-dim)' : 'none', marginLeft: 14 }}>
                              
                              {/* Replies listing */}
                              {comment.replies.map((reply) => {
                                const repRole = getRoleStyle(reply.role);
                                const isOwnReply = reply.avatar === 'ME';

                                return (
                                  <div key={reply.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, position: 'relative' }}>
                                    <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.55rem', border: repRole.border, flexShrink: 0 }}>
                                      {reply.avatar}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                                      
                                      <div style={{ background: 'rgba(30,48,65,0.75)', padding: '6px 10px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)', position: 'relative', width: 'fit-content', maxWidth: '100%', wordBreak: 'break-word' }}>
                                        <div className="flex items-center gap-1.5" style={{ marginBottom: 3 }}>
                                          <span style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-primary)' }}>{reply.author}</span>
                                          <span style={{ fontSize: '0.45rem', fontWeight: 700, padding: '0px 3px', borderRadius: 3, background: repRole.badgeBg, color: repRole.badgeColor }}>
                                            {repRole.label}
                                          </span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                                          {editingComment && editingComment.postId === post.id && editingComment.commentId === comment.id && editingComment.replyId === reply.id ? (
                                            <div>
                                              <textarea className="input" rows={2} value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} />
                                              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                                <button className="btn btn-sm" onClick={saveEditComment}>Save</button>
                                                <button className="btn btn-ghost btn-sm" onClick={cancelEditComment}>Cancel</button>
                                              </div>
                                            </div>
                                          ) : (
                                            reply.content
                                          )}
                                        </div>

                                        {/* Sub-comment likes bubble */}
                                        {reply.likes > 0 && (
                                          <div style={{ position: 'absolute', bottom: -8, right: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', padding: '1px 4px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.55rem', color: 'var(--text-secondary)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                            <span>👍</span>
                                            <span style={{ fontWeight: 700 }}>{reply.likes}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Sub-comment actions (Thích + Phản hồi + Xoá + Thời gian) */}
                                      <div className="flex items-center gap-3" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2, paddingLeft: 4 }}>
                                        <button 
                                          style={{ background: 'transparent', border: 'none', color: reply.likedByMe ? 'var(--cyan-400)' : 'rgba(6,182,212,0.75)', fontWeight: 600, padding: 0, cursor: 'pointer', fontSize: '0.65rem', fontFamily: 'inherit' }}
                                          onClick={() => handleLikeComment(post.id, comment.id, reply.id)}
                                        >
                                          Prefer {reply.likes > 0 ? `(${reply.likes})` : ''}
                                        </button>
                                        <span>·</span>
                                        <button 
                                          style={{ background: 'transparent', border: 'none', color: 'rgba(6,182,212,0.75)', fontWeight: 600, padding: 0, cursor: 'pointer', fontSize: '0.65rem', fontFamily: 'inherit' }}
                                          onClick={() => handleReplyClick(reply.author, comment.id)}
                                        >
                                          Feedback
                                        </button>
                                        
                                        {isOwnReply && (
                                          <>
                                            <span>·</span>
                                            <button 
                                              style={{ background: 'transparent', border: 'none', color: 'var(--red-400)', fontWeight: 600, padding: 0, cursor: 'pointer', fontSize: '0.65rem', fontFamily: 'inherit' }}
                                              onClick={() => handleDeleteComment(post.id, comment.id, reply.id)}
                                            >
                                              Erase
                                            </button>
                                          </>
                                        )}
                                        <span>·</span>
                                        <span style={{ fontSize: '0.62rem' }}>{reply.time}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Input box for replies inside TẦNG 2 */}
                              {showReplyBox && (
                                <div className="flex gap-2" style={{ marginTop: 6, background: 'rgba(18,29,40,0.1)', padding: '6px 8px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)' }}>
                                  <div className="user-avatar" style={{ width: 22, height: 22, fontSize: '0.52rem', flexShrink: 0 }}>
                                    {role === 'guest' ? 'G' : role === 'volunteer' ? 'HC' : 'ME'}
                                  </div>
                                  <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                                    <input
                                      id={`reply-input-${comment.id}`}
                                      className="input"
                                      style={{ borderRadius: 16, fontSize: '0.72rem', height: 26, padding: '4px 10px', background: 'rgba(18,29,40,0.4)', border: '1px solid var(--border-dim)' }}
                                      placeholder="Reply to comments..."
                                      value={replyInputs[comment.id] || ''}
                                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddReply(post.id, comment.id);
                                      }}
                                    />
                                    <button 
                                      className="btn btn-primary" 
                                      style={{ padding: 0, width: 26, height: 26, borderRadius: '50%', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      onClick={() => handleAddReply(post.id, comment.id)}
                                    >
                                      <Send size={10} />
                                    </button>
                                  </div>
                                </div>
                              )}

                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Main Comment input sticky at the bottom */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                    <div className="flex gap-2">
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem', flexShrink: 0 }}>
                        {role === 'guest' ? 'G' : role === 'volunteer' ? 'HC' : 'ME'}
                      </div>
                      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                        <input
                          id={`comment-focus-${post.id}`}
                          className="input"
                          style={{ borderRadius: 20, fontSize: '0.78rem', height: 32, background: 'rgba(18,29,40,0.4)', border: '1px solid var(--border-dim)' }}
                          placeholder="Write a public comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                        />
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: 0, width: 32, height: 32, borderRadius: '50%', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleAddComment(post.id)}
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          );
        })}

        {filteredPosts.length === 0 && (
          <div className="card p-8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div>No articles were found matching your search</div>
          </div>
        )}
      </div>

      {/* Edit Post Modal (FE-only) */}
      {editingPost && (
        <div className="modal-overlay" onClick={() => setEditingPost(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>Edit article</div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingPost(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => document.execCommand('bold', false, null)}><strong>B</strong></button>
                <button className="btn btn-ghost btn-sm" onClick={() => document.execCommand('italic', false, null)}><em>I</em></button>
              </div>
              <div
                ref={editContentRef}
                contentEditable
                suppressContentEditableWarning
                className="input"
                style={{ minHeight: 140 }}
                dangerouslySetInnerHTML={{ __html: editContent }}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditingPost(null); setEditContent(''); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => { handleSaveEditPost(); }}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Post Modal (FE-only) */}
      {reportingPost && (
        <div className="modal-overlay" onClick={() => setReportingPost(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>Report article</div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setReportingPost(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reason for reporting</label>
                <select className="input" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                  <option value="">Choose a reason</option>
                  <option value="spam">Spam/Ads</option>
                  <option value="harassment">Harassment / Offensive Language</option>
                  <option value="misinfo">Misinformation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <textarea className="input" rows={4} placeholder="Details (optional)" value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setReportingPost(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleSendReport}>Submit report</button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Lock Overlay Modal */}
      {showGuestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,10,18,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card p-6 page-enter" style={{ maxWidth: 420, textAlign: 'center', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 32px rgba(6,182,212,0.2)' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Lock size={22} color="var(--cyan-400)" />
            </div>
            
            <h2 style={{ fontSize: '1.2rem', marginBottom: 8, fontWeight: 700 }}>Limited Features</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              You are browsing the forum as **Guest**. Please register for a member account to post new articles, like articles, post comments or respond to other discussions.
            </p>

            <div style={{ display: 'grid', gap: 10 }}>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowGuestModal(false);
                  if (onRedirectToRegister) onRedirectToRegister();
                }}
              >
                Go to Account Registration Page
              </button>
              <button className="btn btn-ghost" onClick={() => setShowGuestModal(false)}>Later</button>
            </div>
          </div>
        </div>
      )}

      {/* Report sent toast */}
      {reportSent && (
        <div style={{ position: 'fixed', right: 24, top: 24, zIndex: 1200 }}>
          <div className="card p-3" style={{ background: 'var(--green-500)', color: 'black', borderRadius: 8 }}>
            Report sent — Thank you for your feedback.
          </div>
        </div>
      )}

    </div>
  );
}
