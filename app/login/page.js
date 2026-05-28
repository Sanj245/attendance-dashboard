'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, UserCheck, ShieldAlert } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast('Please fill in all credentials!', 'warning');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      showToast('Welcome back! Logging in...', 'success');
      
      // Short delay to let user see success Toast, then redirect!
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #0f0f2d 0%, #060514 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glowing ambient blobs */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.15)',
        filter: 'blur(80px)',
        top: '-10%',
        left: '-10%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(139, 92, 246, 0.15)',
        filter: 'blur(80px)',
        bottom: '-10%',
        right: '-10%',
        zIndex: 0
      }} />

      {/* Toast popup notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
            <span className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>&times;</span>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '36px',
        borderRadius: '24px',
        background: 'rgba(22, 21, 38, 0.65)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(99, 102, 241, 0.22)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        zIndex: 1,
        color: '#f8fafc',
        animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
            marginBottom: '16px'
          }}>
            <LogIn size={26} color="white" />
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '24px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>Sign In to Planner</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            Manage attendance and schedule logs dynamically
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label style={{ color: '#94a3b8', fontWeight: 600, fontSize: '12px' }}>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                background: '#111021',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '10px',
                outline: 'none',
                marginTop: '6px'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label style={{ color: '#94a3b8', fontWeight: 600, fontSize: '12px' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: '#111021',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '10px',
                outline: 'none',
                marginTop: '6px'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              padding: '14px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'} <UserCheck size={16} />
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '25px',
          fontSize: '13px',
          color: '#94a3b8',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '20px'
        }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{
            color: '#6366f1',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'color 0.2s ease'
          }} onMouseOver={(e) => e.target.style.color = '#818cf8'} onMouseOut={(e) => e.target.style.color = '#6366f1'}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
