import { useState, useEffect } from 'react'
import { userService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

// Key used to persist mobile user profile data locally
const MOBILE_PROFILE_KEY = 'mmt_mobile_profiles'

// Save a mobile user's profile details keyed by their phone number
function saveMobileProfile(phone, data) {
  try {
    const all = JSON.parse(localStorage.getItem(MOBILE_PROFILE_KEY) || '{}')
    all[phone] = { ...all[phone], ...data, updatedAt: Date.now() }
    localStorage.setItem(MOBILE_PROFILE_KEY, JSON.stringify(all))
  } catch {
    // Storage can be full or blocked (private mode); a cached profile is
    // convenience only, so failing to persist it must not break the page.
  }
}

// Retrieve saved profile for a given phone number
export function getMobileProfile(phone) {
  try {
    const all = JSON.parse(localStorage.getItem(MOBILE_PROFILE_KEY) || '{}')
    return all[phone] || null
  } catch { return null }
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  // Detect mobile OTP user
  const isMobileUser = user && (user.name?.startsWith('Traveller_') || (!user.name && user.phone))

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      try {
        // For mobile users: check localStorage first for saved name/email
        if (isMobileUser && user?.phone) {
          const saved = getMobileProfile(user.phone)
          if (saved?.name) {
            const merged = { ...user, ...saved }
            setUser(merged)
            setNameInput(saved.name || '')
            setPhoneInput(user.phone || '')
            setEmailInput(saved.email || '')
            setLoading(false)
            return
          }
        }

        const res = await userService.getProfile()
        const fetchedUser = res?.data?.user || res?.user || user
        if (fetchedUser) {
          // Merge with any locally saved mobile profile
          const localProfile = user?.phone ? getMobileProfile(user.phone) : null
          const merged = { ...fetchedUser, ...(localProfile || {}) }
          setUser(merged)
          setNameInput(merged.name?.startsWith('Traveller_') ? '' : (merged.name || ''))
          setPhoneInput(merged.phone || '')
          setEmailInput(merged.email?.includes('@mmt.mobile') ? '' : (merged.email || ''))
        }
      } catch (err) {
        console.warn(err)
        // Fallback: use current user
        if (user) {
          const localProfile = user?.phone ? getMobileProfile(user.phone) : null
          const merged = { ...user, ...(localProfile || {}) }
          setNameInput(merged.name?.startsWith('Traveller_') ? '' : (merged.name || ''))
          setPhoneInput(merged.phone || '')
          setEmailInput(merged.email?.includes('@mmt.mobile') ? '' : (merged.email || ''))
        }
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])  // eslint-disable-line

  const handleSave = async (e) => {
    e.preventDefault()
    if (!nameInput.trim()) {
      showToast('Please enter your full name.', 'error')
      return
    }
    setLoading(true)
    try {
      const updatedData = {
        name: nameInput.trim(),
        phone: phoneInput,
        email: emailInput.trim() || (user?.phone + '@mmt.mobile')
      }

      // Always save to localStorage for mobile users (works offline)
      if (user?.phone) {
        saveMobileProfile(user.phone, { name: updatedData.name, email: updatedData.email })
      }

      // Try backend update
      let updatedUser = { ...user, ...updatedData }
      try {
        const res = await userService.updateProfile(updatedData)
        updatedUser = res?.data?.user || res?.user || updatedUser
      } catch (apiErr) {
        console.warn('Profile API update failed, saved locally:', apiErr)
      }

      setUser(updatedUser)
      setEditing(false)
      showToast('Profile updated successfully!', 'success')
    } catch (_err) {
      showToast('Failed to update profile.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const displayPhone = phoneInput || user?.phone || ''
  const displayName  = nameInput || (user?.name?.startsWith('Traveller_') ? '' : user?.name) || ''
  const avatarText   = displayName ? displayName.slice(0, 2).toUpperCase() : '👤'

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--b2))', padding: '60px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'hsl(var(--er))', fontSize: '16px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ← Back
          </Link>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'hsl(var(--b1))', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid hsl(var(--b3))', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, hsl(var(--bc)) 0%, hsl(var(--bc) / 0.6) 100%)', color: 'hsl(var(--b1))', padding: '32px 40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: isMobileUser ? 'hsl(var(--p))' : 'hsl(var(--p))', color: 'hsl(var(--pc))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900 }}>
              {avatarText}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: 'hsl(var(--b1))' }}>
                {displayName || 'Mobile User'}
              </h1>
              <div style={{ color: 'hsl(var(--b1) / 0.7)', fontSize: '15px', marginTop: '4px' }}>
                +91 {displayPhone}
              </div>
              {isMobileUser && (
                <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--p) / 0.35)' }}>
                  📱 Logged in via Mobile OTP
                </div>
              )}
            </div>
          </div>

          {/* Mobile user prompt banner */}
          {isMobileUser && !editing && !displayName && (
            <div style={{ background: 'hsl(var(--wa) / 0.15)', borderBottom: '1px solid hsl(var(--wa) / 0.25)', padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>✏️</span>
              <div>
                <div style={{ fontWeight: 800, color: 'hsl(var(--wa) / 0.65)', fontSize: '14px' }}>Complete your profile</div>
                <div style={{ color: 'hsl(var(--wa) / 0.7)', fontSize: '13px' }}>Add your name and email so future logins show your real name.</div>
              </div>
              <button
                onClick={() => setEditing(true)}
                style={{ marginLeft: 'auto', background: 'hsl(var(--wa))', color: 'hsl(var(--b1))', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Add Now
              </button>
            </div>
          )}

          {/* Content / Form */}
          <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Personal Details</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  style={{ background: 'hsl(var(--p) / 0.06)', color: 'hsl(var(--p))', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => setEditing(false)}
                  style={{ background: 'hsl(var(--b2))', color: 'hsl(var(--bc) / 0.55)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.65)', marginBottom: '8px' }}>
                  Full Name {isMobileUser && !displayName && <span style={{ color: 'hsl(var(--er))' }}>*</span>}
                </label>
                <input
                  type="text"
                  disabled={!editing}
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder={editing ? 'Enter your full name' : '—'}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: `1px solid ${editing ? 'hsl(var(--p))' : 'hsl(var(--b3))'}`, fontSize: '16px', fontWeight: 600, color: editing ? 'hsl(var(--bc))' : 'hsl(var(--bc) / 0.55)', background: editing ? 'hsl(var(--b1))' : 'hsl(var(--b2))', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.65)', marginBottom: '8px' }}>Mobile Number</label>
                <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid hsl(var(--b3))' }}>
                  <span style={{ background: 'hsl(var(--b2))', padding: '14px 16px', color: 'hsl(var(--bc) / 0.55)', fontWeight: 700, borderRight: '1px solid hsl(var(--b3))' }}>+91</span>
                  <input
                    type="text"
                    disabled
                    value={displayPhone}
                    style={{ width: '100%', padding: '14px 16px', border: 'none', fontSize: '16px', fontWeight: 600, color: 'hsl(var(--bc) / 0.55)', background: 'hsl(var(--b2))', outline: 'none' }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.5)', marginTop: '4px' }}>Mobile number cannot be changed after OTP login.</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.65)', marginBottom: '8px' }}>Email Address</label>
                <input
                  type="email"
                  disabled={!editing}
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder={editing ? 'Enter your email address' : '—'}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: `1px solid ${editing ? 'hsl(var(--p))' : 'hsl(var(--b3))'}`, fontSize: '16px', fontWeight: 600, color: editing ? 'hsl(var(--bc))' : 'hsl(var(--bc) / 0.55)', background: editing ? 'hsl(var(--b1))' : 'hsl(var(--b2))', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {editing && (
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: 'hsl(var(--p))', color: 'hsl(var(--pc))', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px hsl(var(--p) / 0.3)', marginTop: '12px' }}
                >
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? 'hsl(var(--su))' : 'hsl(var(--er))',
          color: 'hsl(var(--b1))', padding: '14px 28px', borderRadius: '12px', fontSize: '16px',
          fontWeight: '600', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '12px', zIndex: 9999,
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
