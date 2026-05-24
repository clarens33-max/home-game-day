import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/client'
import AuthLayout from '../../components/AuthLayout'
import Button from '../../components/Button'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (!token) {
      toast.error('Missing reset token. Please use the link from your email.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      toast.success('Password reset! Please sign in.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Reset failed. Your link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <p className="text-red-600 mb-4">Invalid or missing reset link.</p>
          <Link to="/forgot-password" className="text-[#E91E8C] hover:underline text-sm">
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1
        className="text-2xl font-semibold uppercase tracking-wide mb-2 text-center"
        style={{ fontFamily: 'Oswald, sans-serif' }}
      >
        New Password
      </h1>
      <p className="text-[#999] text-sm text-center mb-6">
        Choose a new password for your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">New password</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
            placeholder="Min. 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Confirm password</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Reset Password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#999]">
        <Link to="/login" className="text-[#E91E8C] hover:underline font-medium">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
