import React, { useState, useEffect, useRef } from 'react';
import { Camera, Save, LogOut, LogIn, Lock, Eye, EyeOff, CheckCircle, User, Phone, Mail, Edit3, Award, Shield, Calendar, AlertTriangle, X, Wrench, MapPin, Truck, Trash2, ChevronRight } from 'lucide-react';
import { apiService } from '../../services/apiService';
import VolunteerRegistrationModal from '../../components/profile/VolunteerRegistrationModal';
import WorkshopRegistrationModal from '../../components/profile/WorkshopRegistrationModal';
import WorkshopEditModal from '../../components/profile/WorkshopEditModal';

export default function UserProfile({
  avatarUrl,
  onAvatarChange,
  userName,
  onUserNameChange,
  isLoggedIn,
  onLogin,
  onLogout,
  role = 'user',
  onRoleUpgrade,
  pendingRequest,
  onCancelUpgrade,
}) {
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contributionPoints, setContributionPoints] = useState(0);
  const [status, setStatus] = useState('Active');
  const [createdAt, setCreatedAt] = useState('');
  const [saved, setSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Mobile collapse states
  const [isMobile, setIsMobile] = useState(false);
  const [isRoleExpanded, setIsRoleExpanded] = useState(false);
  const [isPasswordExpanded, setIsPasswordExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 960);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [tempUserName, setTempUserName] = useState(userName || '');
  const [tempPhone, setTempPhone] = useState(phone || '');
  const [saveError, setSaveError] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  useEffect(() => {
    setTempUserName(userName || '');
  }, [userName]);

  useEffect(() => {
    setTempPhone(phone || '');
  }, [phone]);

  const [localPendingRequest, setLocalPendingRequest] = useState(pendingRequest);
  const [workshopProfile, setWorkshopProfile] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showWorkshopEditModal, setShowWorkshopEditModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoggedIn) return;
      try {
        const response = await apiService.get('/auth/profile');
        if (response && response.user) {
          const u = response.user;
          if (onUserNameChange) onUserNameChange(u.full_name || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          setContributionPoints(u.contribution_points ?? 0);
          setStatus(u.status || 'Active');
          setCreatedAt(u.created_at || '');
          if (onAvatarChange && u.avatar_url) {
            onAvatarChange(u.avatar_url);
          }
        }
        if (response && response.pendingVolunteer) {
          setLocalPendingRequest(response.pendingVolunteer);
        } else if (response && response.pendingWorkshop) {
          setLocalPendingRequest(response.pendingWorkshop);
        } else {
          setLocalPendingRequest(null);
        }


        if (role === 'workshop') {
          try {
            const wsRes = await apiService.get('/workshops/me');
            if (wsRes && wsRes.workshop) {
              setWorkshopProfile(wsRes.workshop);
            }
          } catch (e) {
            console.error('Failed to fetch workshop profile:', e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    fetchProfile();
  }, [isLoggedIn, role]);

  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState('');

  const handleAvatarChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please choose photos under 2MB.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    if (onAvatarChange) onAvatarChange(localUrl);

    setIsUploadingAvatar(true);
    setSaveError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiService.upload('/auth/profile/avatar', formData);
      if (response && response.avatar_url) {
        if (onAvatarChange) onAvatarChange(response.avatar_url);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      const errMsg = error.message || "Error when uploading avatar to the server.";
      setSaveError(errMsg);
      if (onAvatarChange) onAvatarChange('');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (window.confirm("Are you sure you want to delete your profile picture?")) {
      setIsUploadingAvatar(true);
      setSaveError('');
      try {
        const response = await apiService.delete('/auth/profile/avatar');
        if (onAvatarChange) {
          onAvatarChange('');
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (error) {
        console.error('Failed to delete avatar:', error);
        const errMsg = error.response?.data?.message || error.message || "Error when deleting avatar from the server.";
        setSaveError(errMsg);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleCancelVolunteerRequest = async () => {
    setShowCancelConfirmModal(false);
    const isWorkshop = localPendingRequest?.requestedRole === 'workshop' || role === 'workshop';
    
    try {
      if (isWorkshop) {
        await apiService.put('/workshops/me/cancel');
        setToastMessage(role === 'workshop' ? "Successfully canceled workshop registration." : "The request to register to open a workshop has been successfully canceled.");
      } else {
        await apiService.put('/volunteers/me/cancel');
        setToastMessage(role === 'volunteer' ? "Successfully withdrawn from the Rescue Team." : "Successfully canceled volunteer registration request.");
      }
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to cancel/resign:', error);
      alert(error.response?.data?.message || "Error while performing operation.");
    }
  };

  const handleStartEdit = () => {
    setTempUserName(userName || '');
    setTempPhone(phone);
    setSaveError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setSaveError('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaveError('');
    if (!tempUserName || tempUserName.trim().length < 2) {
      setSaveError("Full name must have at least 2 characters.");
      return;
    }
    if (tempPhone && !/^(0|\+84)\d{9}$/.test(tempPhone)) {
      setSaveError("Invalid phone number (must consist of 10 digits starting with 0 or +84).");
      return;
    }
    try {
      const response = await apiService.put('/auth/profile', {
        full_name: tempUserName.trim(),
        phone: tempPhone ? tempPhone.trim() : '',
      });
      if (response && response.user) {
        const u = response.user;
        if (onUserNameChange) onUserNameChange(u.full_name || '');
        setPhone(u.phone || '');
        setIsEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
      const errMsg = error.response?.data?.message || error.message || "An error occurred while updating information.";
      setSaveError(errMsg);
    }
  };

  const handlePasswordChange = async () => {
    setPwError('');
    if (!currentPw) { setPwError("Please enter your current password."); return; }
    const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?!.*\s).{8,}$/;
    if (!PASSWORD_REGEX.test(newPw)) {
      setPwError("The new password must be at least 8 characters, contain at least 1 letter and 1 number, and contain no spaces.");
      return;
    }
    if (currentPw === newPw) {
      setPwError("The new password must be different from the current password.");
      return;
    }
    if (newPw !== confirmPw) { setPwError("Confirmation password does not match."); return; }
    try {
      await apiService.post('/auth/change-password', {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      
      alert("Password changed successfully! You will be automatically logged out for security. Please log in again with new password.");
      
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      const errMsg = error.response?.data?.message || error.message || "The current password is incorrect or an error has occurred.";
      setPwError(errMsg);
    }
  };

  const avatarStyle = avatarUrl
    ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' }
    : {};

  const pwStrength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : 3;
  const pwStrengthColor = ['transparent', 'var(--red-400)', 'var(--orange-400)', 'var(--green-400)'][pwStrength];
  const pwStrengthLabel = ['', "Weak", "Medium", "Strong"][pwStrength];

  return (
    <div className="page-enter">

      {/* Grid Row 1: Avatar + Logout (Left) and Personal Info (Right) */}
      <div className="grid" style={{ gridTemplateColumns: '0.85fr 1.15fr', gap: 16, marginBottom: 16 }}>
        {/* LEFT: Avatar + Logout */}
        <div className="card p-4" style={{ display: 'grid', gap: 12 }}>
          {/* Avatar */}
          <div>
            <div className="section-title" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={14} color="var(--cyan-400)" /> Avatar
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="user-avatar" style={{ width: 72, height: 72, fontSize: '1.2rem', flexShrink: 0, border: '3px solid var(--cyan-400)', position: 'relative', ...avatarStyle }}>
                {isUploadingAvatar ? (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    <style>{`
                      @keyframes spin-avatar {
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                    <div style={{ width: 16, height: 16, border: '2px solid var(--cyan-400)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin-avatar 0.8s linear infinite' }} />
                  </div>
                ) : avatarUrl ? '' : (userName ? userName.charAt(0).toUpperCase() : 'U')}
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ position: 'relative' }}>
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (!avatarUrl) {
                          fileInputRef.current?.click();
                        } else {
                          setShowAvatarMenu(prev => !prev);
                        }
                      }}
                      disabled={isUploadingAvatar}
                      style={{ 
                        width: 'fit-content', 
                        padding: '4px 10px', 
                        opacity: isUploadingAvatar ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Camera size={12} /> {isUploadingAvatar ? "Loading..." : "Update"}
                    </button>
                    
                    {showAvatarMenu && (
                      <div 
                        onMouseLeave={() => setShowAvatarMenu(false)}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: 4,
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: 'var(--r-md)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 10,
                          display: 'grid',
                          minWidth: 140
                        }}
                      >
                        <button 
                          onClick={() => {
                            setShowAvatarMenu(false);
                            fileInputRef.current?.click();
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px 12px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Camera size={12} /> Upload photo
                        </button>
                        <button 
                          onClick={() => {
                            setShowAvatarMenu(false);
                            handleDeleteAvatar();
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px 12px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: 'var(--red-400)',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            borderTop: '1px solid var(--border-dim)'
                          }}
                        >
                          <Trash2 size={12} /> Delete photo
                        </button>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handleAvatarChange} 
                      disabled={isUploadingAvatar} 
                      style={{ display: 'none' }} 
                    />
                  </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  PNG, JPG format<br />Maximum 2MB
                </div>
              </div>
            </div>
          </div>

          {/* User info preview */}
          <div style={{ padding: '8px 10px', borderRadius: 'var(--r-md)', background: 'rgba(6,182,212,0.05)', border: '1px solid var(--border-dim)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>{userName || "User"}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>{email}</div>
            <span className="badge badge-cyan" style={{ fontSize: '0.58rem', padding: '2px 8px' }}>
              {role === 'workshop'
                ? "CAR REPAIR SHOP OWNER"
                : role === 'volunteer'
                ? "RESCUE VOLUNTEERS"
                : role === 'admin'
                ? "Admin"
                : role === 'manager'
                ? "SYSTEM MANAGEMENT"
                : "MEMBER"}
            </span>
          </div>

          {/* Logout */}
          <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: 12 }}>
            <div className="section-title" style={{ marginBottom: 8, fontSize: '0.68rem' }}>ACCOUNT</div>
            {isLoggedIn ? (
              <button className="btn btn-danger btn-sm" onClick={() => setShowLogoutConfirmModal(true)} style={{ width: '100%', justifyContent: 'center' }}>
                <LogOut size={13} /> Sign out
              </button>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                <button className="btn btn-primary" onClick={onLogin} style={{ width: '100%', justifyContent: 'center' }}>
                  <LogIn size={13} /> Log in
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onLogin && onLogin('google')}
                  style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <img src="/assets/google-mark.svg" alt="Google" style={{ width: 14, height: 14 }} onError={(e) => e.target.style.display = 'none'} />
                  Sign in with Google
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Chỉnh sửa thông tin cá nhân */}
        <div className="card p-4">
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="section-title" style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={14} color="var(--cyan-400)" /> Edit personal information
            </div>

            <div className="grid grid-2" style={{ gap: '10px 14px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Full name</label>
                <div className="input-group">
                  <User size={14} className="input-icon" />
                  <input
                    className="input"
                    placeholder="Full name"
                    value={isEditing ? tempUserName : (userName || '')}
                    onChange={(e) => setTempUserName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div style={{ opacity: isEditing ? 0.4 : 1, transition: 'all 0.25s ease', pointerEvents: isEditing ? 'none' : 'auto' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email address</label>
                <div className="input-group">
                  <Mail size={14} className="input-icon" />
                  <input
                    className="input"
                    placeholder="Email address"
                    type="email"
                    value={email}
                    disabled={true}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Phone number</label>
                <div className="input-group">
                  <Phone size={14} className="input-icon" />
                  <input
                    className="input"
                    placeholder="Phone number"
                    value={isEditing ? tempPhone : phone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div style={{ opacity: isEditing ? 0.4 : 1, transition: 'all 0.25s ease', pointerEvents: isEditing ? 'none' : 'auto' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Contribution points</label>
                <div className="input-group">
                  <Award size={14} className="input-icon" color="var(--orange-400)" />
                  <input
                    className="input"
                    value={`${contributionPoints} point`}
                    disabled={true}
                    style={{ color: 'var(--orange-400)', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ opacity: isEditing ? 0.4 : 1, transition: 'all 0.25s ease', pointerEvents: isEditing ? 'none' : 'auto' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Account status</label>
                <div className="input-group">
                  <Shield size={14} className="input-icon" color={status === 'Active' ? 'var(--green-400)' : status === 'Suspended' ? 'var(--red-400)' : 'var(--orange-400)'} />
                  <input
                    className="input"
                    value={status === 'Active' ? "Active" : status === 'Pending' ? "Wait for confirmation" : "Temporarily locked"}
                    disabled={true}
                    style={{ 
                      color: status === 'Active' ? 'var(--green-400)' : status === 'Suspended' ? 'var(--red-400)' : 'var(--orange-400)',
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              <div style={{ opacity: isEditing ? 0.4 : 1, transition: 'all 0.25s ease', pointerEvents: isEditing ? 'none' : 'auto' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Account creation date</label>
                <div className="input-group">
                  <Calendar size={14} className="input-icon" />
                  <input
                    className="input"
                    value={createdAt ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '---'}
                    disabled={true}
                  />
                </div>
              </div>
            </div>

            {saveError && (
              <div style={{ fontSize: '0.78rem', color: 'var(--red-400)', padding: '8px 12px', border: '1px solid var(--red-400)', borderRadius: 'var(--r-sm)', background: 'rgba(239,68,68,0.06)', marginTop: 4 }}>
                {saveError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              {isEditing ? (
                <>
                  <button className="btn btn-ghost" onClick={handleCancelEdit} style={{ flex: 1, justifyContent: 'center' }}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1, justifyContent: 'center' }}>
                    <Save size={14} /> Save information
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost" onClick={handleStartEdit} style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--cyan-400)', color: 'var(--cyan-400)' }}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button className="btn btn-primary" disabled style={{ flex: 1, justifyContent: 'center' }}>
                    <Save size={14} /> Save information
                  </button>
                </>
              )}
            </div>
            {saved && (
              <div className="flex items-center gap-2" style={{ color: 'var(--green-400)', fontWeight: 600, fontSize: '0.85rem', marginTop: 4 }}>
                <CheckCircle size={14} /> Changes saved successfully!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Row 2: Đăng ký vai trò chuyên biệt / Pending request (Left) and Đổi mật khẩu (Right) */}
      <div className="grid" style={{ gridTemplateColumns: '0.85fr 1.15fr', gap: 16 }}>
        {/* LEFT: Đăng ký vai trò chuyên biệt / Pending request */}
        <div>
          {isMobile ? (
            <div className="card" style={{ transition: 'all 0.3s' }}>
              <div 
                onClick={() => setIsRoleExpanded(!isRoleExpanded)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px 18px', 
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: localPendingRequest ? 'var(--orange-400)' : 'var(--cyan-400)' }}>
                  {localPendingRequest ? <AlertTriangle size={14} color="var(--orange-400)" /> : <Shield size={14} color="var(--cyan-400)" />}
                  {role !== 'user'
                    ? "DEDICATED ACCOUNT CONNECTED"
                    : localPendingRequest
                    ? "REQUEST PENDING APPROVAL"
                    : "REGISTER FOR SPECIALIZED ROLE"}
                </div>
                <ChevronRight 
                  size={16} 
                  color="var(--text-secondary)" 
                  style={{
                    transform: isRoleExpanded ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </div>
              
              {isRoleExpanded && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border-dim)', paddingTop: 16 }}>
                  {isLoggedIn && role === 'user' && localPendingRequest && (
                    <div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.45 }}>
                        You have submitted a request to upgrade your role to <strong>{
                          localPendingRequest.requestedRole === 'volunteer' ? "Rescue Volunteer" : "Car workshop owner"
                        }</strong> {localPendingRequest.workshopName && `(${localPendingRequest.workshopName})`}.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="badge badge-orange" style={{ fontSize: '0.62rem' }}>Waiting for Admin or Manager approval...</span>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => setShowCancelConfirmModal(true)} 
                          style={{ color: 'var(--red-400)', padding: '4px 10px', fontSize: '0.7rem' }}
                        >
                          Cancel request
                        </button>
                      </div>
                    </div>
                  )}

                  {isLoggedIn && role === 'user' && !localPendingRequest && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
                        Upgrade your account to join emergency rescue or manage mobile vehicle repairs.
                      </p>
                      <div className="grid grid-2" style={{ gap: 10 }}>
                        <div className="card" style={{ padding: 10, background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--orange-400)', marginBottom: 2 }}>Volunteer</div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.3 }}>
                              Join emergency rescue team, receive victim SOS notifications.
                            </p>
                          </div>
                          <button className="btn btn-warning btn-sm" onClick={() => setShowVolunteerModal(true)} style={{ background: 'var(--orange-400)', border: 'none', color: 'var(--bg-app)', padding: '5px 10px', fontSize: '0.72rem', width: '100%', justifyContent: 'center' }}>
                            Register
                          </button>
                        </div>

                        <div className="card" style={{ padding: 10, background: 'rgba(249,115,22,0.03)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--orange-400)', marginBottom: 2 }}>Workshop Owner</div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.3 }}>
                              Register workshop on map to receive mobile repair requests.
                            </p>
                          </div>
                          <button className="btn btn-primary btn-sm" onClick={() => setShowWorkshopModal(true)} style={{ padding: '5px 10px', fontSize: '0.72rem', width: '100%', justifyContent: 'center' }}>
                            Register
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {role !== 'user' && (
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <CheckCircle size={24} color="var(--green-400)" style={{ marginBottom: 8, marginInline: 'auto' }} />
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Dedicated account connected</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Current role: {
                          role === 'workshop'
                            ? "CAR REPAIR SHOP OWNER"
                            : role === 'volunteer'
                            ? "RESCUE VOLUNTEERS"
                            : role === 'admin'
                            ? "Admin"
                            : role === 'manager'
                            ? "SYSTEM MANAGEMENT"
                            : role.toUpperCase()
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Pending upgrade request */}
              {isLoggedIn && role === 'user' && localPendingRequest && (
                <div className="card p-4" style={{ border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.02)' }}>
                  <div className="section-title" style={{ marginBottom: 10, color: 'var(--orange-400)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    REQUEST PENDING APPROVAL
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.45 }}>
                    You have submitted a request to upgrade your role to <strong>{
                      localPendingRequest.requestedRole === 'volunteer' ? "Rescue Volunteer" : "Car workshop owner"
                    }</strong> {localPendingRequest.workshopName && `(${localPendingRequest.workshopName})`}.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="badge badge-orange" style={{ fontSize: '0.62rem' }}>Waiting for Admin or Manager approval...</span>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => setShowCancelConfirmModal(true)} 
                      style={{ color: 'var(--red-400)', padding: '4px 10px', fontSize: '0.7rem' }}
                    >
                      Cancel request
                    </button>
                  </div>
                </div>
              )}

              {/* Role upgrade section */}
              {isLoggedIn && role === 'user' && !localPendingRequest && (
                <div className="card p-4" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="section-title" style={{ marginBottom: 6, color: 'var(--cyan-400)' }}>REGISTER FOR SPECIALIZED ROLE</div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
                      Upgrade your account to join emergency rescue or manage mobile vehicle repairs.
                    </p>
                  </div>
                  <div className="grid grid-2" style={{ gap: 10 }}>
                    <div className="card" style={{ padding: 10, background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--orange-400)', marginBottom: 2 }}>Volunteer</div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.3 }}>
                          Join emergency rescue team, receive victim SOS notifications.
                        </p>
                      </div>
                      <button className="btn btn-warning btn-sm" onClick={() => setShowVolunteerModal(true)} style={{ background: 'var(--orange-400)', border: 'none', color: 'var(--bg-app)', padding: '5px 10px', fontSize: '0.72rem', width: '100%', justifyContent: 'center' }}>
                        Register
                      </button>
                    </div>

                    <div className="card" style={{ padding: 10, background: 'rgba(249,115,22,0.03)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--orange-400)', marginBottom: 2 }}>Workshop Owner</div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.3 }}>
                          Register workshop on map to receive mobile repair requests.
                        </p>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => setShowWorkshopModal(true)} style={{ padding: '5px 10px', fontSize: '0.72rem', width: '100%', justifyContent: 'center' }}>
                        Register
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show a placeholder if they are already upgraded and NOT user */}
              {role !== 'user' && (
                <div className="card p-4" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(61,125,176,0.02)', border: '1px dashed var(--border-dim)' }}>
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <CheckCircle size={24} color="var(--green-400)" style={{ marginBottom: 8, marginInline: 'auto' }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Dedicated account connected</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Current role: {
                        role === 'workshop'
                          ? "CAR REPAIR SHOP OWNER"
                          : role === 'volunteer'
                          ? "RESCUE VOLUNTEERS"
                          : role === 'admin'
                          ? "Admin"
                          : role === 'manager'
                          ? "SYSTEM MANAGEMENT"
                          : role.toUpperCase()
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Đổi mật khẩu */}
        {isMobile ? (
          <div className="card" style={{ transition: 'all 0.3s' }}>
            <div 
              onClick={() => setIsPasswordExpanded(!isPasswordExpanded)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '14px 18px', 
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <div className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={14} color="var(--cyan-400)" /> Change password
              </div>
              <ChevronRight 
                size={16} 
                color="var(--text-secondary)" 
                style={{
                  transform: isPasswordExpanded ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </div>

            {isPasswordExpanded && (
              <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border-dim)', paddingTop: 16 }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  {/* Current password */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Current password</div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="input"
                        type={showCurrent ? 'text' : 'password'}
                        placeholder="Enter current password..."
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        style={{ paddingRight: 40, padding: '7px 12px', fontSize: '0.8rem' }}
                      />
                      <button
                        onClick={() => setShowCurrent(p => !p)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* New password */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>New password</div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="input"
                        type={showNew ? 'text' : 'password'}
                        placeholder="Enter new password..."
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        style={{ paddingRight: 40, padding: '7px 12px', fontSize: '0.8rem' }}
                      />
                      <button
                        onClick={() => setShowNew(p => !p)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {newPw.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden', marginBottom: 2 }}>
                          <div style={{ height: '100%', width: `${[0, 33, 66, 100][pwStrength]}%`, background: pwStrengthColor, transition: 'all 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '0.62rem', color: pwStrengthColor, fontWeight: 600 }}>Strength: {pwStrengthLabel}</span>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Confirm new password</div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="input"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter new password..."
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        style={{ paddingRight: 40, padding: '7px 12px', fontSize: '0.8rem', borderColor: confirmPw && confirmPw !== newPw ? 'var(--red-400)' : undefined }}
                      />
                      <button
                        onClick={() => setShowConfirm(p => !p)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {confirmPw && confirmPw !== newPw && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--red-400)', marginTop: 2 }}>Confirmation password does not match.</div>
                    )}
                  </div>

                  {pwError && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--red-400)', padding: '6px 10px', border: '1px solid var(--red-400)', borderRadius: 'var(--r-sm)', background: 'rgba(239,68,68,0.06)' }}>
                      {pwError}
                    </div>
                  )}

                  <button className="btn btn-primary btn-sm" onClick={handlePasswordChange} style={{ justifyContent: 'center', width: '100%', marginTop: 2 }}>
                    <Lock size={13} /> Update password
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-4">
            <div style={{ display: 'grid', gap: 8 }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={14} color="var(--cyan-400)" /> Change password
              </div>

              {/* Current password */}
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Current password</div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Enter current password..."
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    style={{ paddingRight: 40, padding: '7px 12px', fontSize: '0.8rem' }}
                  />
                  <button
                    onClick={() => setShowCurrent(p => !p)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>New password</div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showNew ? 'text' : 'password'}
                    placeholder="Enter new password..."
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    style={{ paddingRight: 40, padding: '7px 12px', fontSize: '0.8rem' }}
                  />
                  <button
                    onClick={() => setShowNew(p => !p)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {/* Strength bar */}
                {newPw.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden', marginBottom: 2 }}>
                      <div style={{ height: '100%', width: `${[0, 33, 66, 100][pwStrength]}%`, background: pwStrengthColor, transition: 'all 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.62rem', color: pwStrengthColor, fontWeight: 600 }}>Strength: {pwStrengthLabel}</span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Confirm new password</div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter new password..."
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    style={{ paddingRight: 40, padding: '7px 12px', fontSize: '0.8rem', borderColor: confirmPw && confirmPw !== newPw ? 'var(--red-400)' : undefined }}
                  />
                  <button
                    onClick={() => setShowConfirm(p => !p)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {confirmPw && confirmPw !== newPw && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--red-400)', marginTop: 2 }}>Confirmation password does not match.</div>
                )}
              </div>

              {pwError && (
                <div style={{ fontSize: '0.75rem', color: 'var(--red-400)', padding: '6px 10px', border: '1px solid var(--red-400)', borderRadius: 'var(--r-sm)', background: 'rgba(239,68,68,0.06)' }}>
                  {pwError}
                </div>
              )}

              <button className="btn btn-primary btn-sm" onClick={handlePasswordChange} style={{ justifyContent: 'center', width: '100%', marginTop: 2 }}>
                <Lock size={13} /> Update password
              </button>
            </div>
          </div>
        )}
      </div>

      <VolunteerRegistrationModal
        isOpen={showVolunteerModal}
        onClose={() => setShowVolunteerModal(false)}
        onSuccess={async () => {
          setShowVolunteerModal(false);
          setToastMessage("Submitted Volunteer registration request successfully!");
          setTimeout(() => setToastMessage(''), 3000);

          try {
            const response = await apiService.get('/auth/profile');
            if (response && response.pendingVolunteer) {
              setLocalPendingRequest(response.pendingVolunteer);
            }
          } catch (error) {
            console.error('Failed to refresh profile after registration:', error);
          }
        }}
      />


      <WorkshopRegistrationModal
        isOpen={showWorkshopModal}
        onClose={() => setShowWorkshopModal(false)}
        onSuccess={async () => {
          setShowWorkshopModal(false);
          setToastMessage("Submit your request to register to open a workshop successfully!");
          setTimeout(() => setToastMessage(''), 3000);

          try {
            const response = await apiService.get('/auth/profile');
            if (response) {
              if (response.pendingWorkshop) {
                setLocalPendingRequest(response.pendingWorkshop);
              } else if (response.pendingVolunteer) {
                setLocalPendingRequest(response.pendingVolunteer);
              } else {
                setLocalPendingRequest(null);
              }
            }
          } catch (error) {
            console.error('Failed to refresh profile after registration:', error);
          }
        }}
      />

      <WorkshopEditModal
        isOpen={showWorkshopEditModal}
        onClose={() => setShowWorkshopEditModal(false)}
        initialData={workshopProfile}
        onSuccess={async () => {
          setShowWorkshopEditModal(false);
          setToastMessage("Updated Workshop information successfully!");
          setTimeout(() => setToastMessage(''), 3000);

          try {
            const response = await apiService.get('/workshops/me');
            if (response && response.workshop) {
              setWorkshopProfile(response.workshop);
            }
          } catch (error) {
            console.error('Failed to refresh workshop profile after edit:', error);
          }
        }}
      />

      {showCancelConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowCancelConfirmModal(false)} style={{ zIndex: 10000 }}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color="var(--red-400)" />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                  {localPendingRequest?.requestedRole === 'workshop' 
                    ? "Cancel the request to register to open a workshop" 
                    : (role === 'volunteer' 
                        ? "Withdraw from the Rescue Team" 
                        : (role === 'workshop' 
                            ? "Cancel workshop registration" 
                            : "Cancel rescue registration request"))}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowCancelConfirmModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {localPendingRequest?.requestedRole === 'workshop' 
                  ? "Are you sure you want to cancel your registration request to open a workshop?"
                  : (role === 'volunteer' 
                      ? "Are you sure you want to withdraw from the Rescue Team? Your account will return to a normal member." 
                      : (role === 'workshop'
                          ? "Are you sure you want to cancel your workshop registration? Your shop will no longer appear on the community map."
                          : "Are you sure you want to cancel your Volunteer Rescue registration request?"))}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCancelConfirmModal(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleCancelVolunteerRequest}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirmModal(false)} style={{ zIndex: 10000 }}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <LogOut size={18} color="var(--red-400)" />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Confirm logout</span>
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowLogoutConfirmModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Are you sure you want to log out of the system?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLogoutConfirmModal(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={() => {
                setShowLogoutConfirmModal(false);
                if (onLogout) onLogout();
              }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: 'var(--green-400)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--r-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600 }}>
          <CheckCircle size={18} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
