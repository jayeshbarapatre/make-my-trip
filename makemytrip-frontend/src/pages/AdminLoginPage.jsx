import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import { RiShieldLine, RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading, error } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    // Apply a clean theme for login page
    const saved = localStorage.getItem('app-theme') || 'light'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  useEffect(() => {
    if (isAuthenticated) navigate('/admin/dashboard')
  }, [isAuthenticated, navigate])

  useEffect(() => { setLocalError('') }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (!email || !password) {
      setLocalError('Please fill in all fields')
      return
    }
    const result = await login(email, password)
    if (!result.success) setLocalError(result.message)
  }

  const displayError = error || localError

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <RiShieldLine className="w-7 h-7 text-primary-content" />
          </div>
          <h1 className="text-2xl font-bold text-base-content">Admin Portal</h1>
          <p className="text-sm text-base-content/50 mt-1">MakeMyTrip Platform</p>
        </div>

        {/* Card */}
        <div className="card bg-base-100 border border-base-200 shadow-xl">
          <div className="card-body p-7">
            <h2 className="text-lg font-semibold text-base-content mb-5">Sign in to continue</h2>

            {displayError && (
              <div className="alert alert-error py-3 mb-4 text-sm">
                <span>{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="form-control">
                <div className="label py-1">
                  <span className="label-text text-sm font-medium">Email address</span>
                </div>
                <label className="input input-bordered flex items-center gap-2">
                  <RiMailLine className="w-4 h-4 text-base-content/40 shrink-0" />
                  <input
                    type="email"
                    className="grow"
                    placeholder="admin@platform.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                  />
                </label>
              </label>

              <label className="form-control">
                <div className="label py-1">
                  <span className="label-text text-sm font-medium">Password</span>
                </div>
                <label className="input input-bordered flex items-center gap-2">
                  <RiLockLine className="w-4 h-4 text-base-content/40 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="grow"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-circle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword
                      ? <RiEyeOffLine className="w-4 h-4 text-base-content/40" />
                      : <RiEyeLine className="w-4 h-4 text-base-content/40" />
                    }
                  </button>
                </label>
              </label>

              <button
                type="submit"
                className="btn btn-primary w-full mt-2"
                disabled={loading}
              >
                {loading
                  ? <><span className="loading loading-spinner loading-sm" /> Signing in...</>
                  : 'Sign in'
                }
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-base-content/40 mt-6">
          Secure admin access · MakeMyTrip Platform
        </p>
      </div>
    </div>
  )
}

export default AdminLoginPage
