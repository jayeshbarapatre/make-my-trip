import React, { useState, useEffect } from 'react'
import { userService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      try {
        const res = await userService.getProfile()
        const fetchedUser = res?.data?.user || res?.user || user
        if (fetchedUser) {
          setUser(fetchedUser)
          setNameInput(fetchedUser.name || '')
          setPhoneInput(fetchedUser.phone || '')
          setEmailInput(fetchedUser.email || '')
        }
      } catch (err) {
        console.warn(err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const updatedData = { name: nameInput, phone: phoneInput, email: emailInput }
      const res = await userService.updateProfile(updatedData)
      const updatedUser = res?.data?.user || res?.user || { ...user, ...updatedData }
      setUser(updatedUser)
      setEditing(false)
      showToast("Profile updated successfully!", "success")
    } catch (err) {
      showToast("Failed to update profile.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '60px 0', }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#EB2026', fontSize: '16px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            &larr; Back
          </Link>
        </div>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: '32px 40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#38bdf8', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900 }}>
            {nameInput ? nameInput.slice(0, 2).toUpperCase() : '👤'}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#ffffff' }}>{user?.name || nameInput || 'Guest User'}</h1>
            <div style={{ color: '#94a3b8', fontSize: '15px', marginTop: '4px' }}>+91 {user?.phone || phoneInput || '9876543210'}</div>
          </div>
        </div>

        {/* Content / Form */}
        <div style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Personal Details</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={{ background: '#eef2ff', color: '#4f46e5', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <button
                onClick={() => setEditing(false)}
                style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Full Name</label>
              <input
                type="text"
                disabled={!editing}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 600, color: editing ? '#0f172a' : '#64748b', background: editing ? '#fff' : '#f8fafc', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Mobile Number</label>
              <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <span style={{ background: '#f1f5f9', padding: '14px 16px', color: '#64748b', fontWeight: 700, borderRight: '1px solid #cbd5e1' }}>+91</span>
                <input
                  type="text"
                  disabled={!editing}
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', border: 'none', fontSize: '16px', fontWeight: 600, color: editing ? '#0f172a' : '#64748b', background: editing ? '#fff' : '#f8fafc', outline: 'none' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Email Address</label>
              <input
                type="email"
                disabled={!editing}
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 600, color: editing ? '#0f172a' : '#64748b', background: editing ? '#fff' : '#f8fafc', outline: 'none' }}
              />
            </div>

            {editing && (
              <button
                type="submit"
                disabled={loading}
                style={{ background: '#eb2026', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(235,32,38,0.3)', marginTop: '12px' }}
              >
                {loading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            )}
          </form>
        </div>

      </div>
      </div>

      {/* Premium Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          padding: '14px 28px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          animation: 'toastSlideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
          <style>{`
            @keyframes toastSlideUp {
              0% { opacity: 0; transform: translate(-50%, 30px); }
              100% { opacity: 1; transform: translate(-50%, 0); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
