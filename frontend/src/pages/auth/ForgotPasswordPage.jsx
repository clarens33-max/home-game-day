import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import AuthLayout from '../../components/AuthLayout'
import Button from '../../components/Button'
import { CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h1
            className="text-2xl font-semibold uppercase tracking-wide mb-2"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            Check Your Email
          </h1>
          <p className="text-[#999] text-sm mb-6">
            We've sent a password reset link to <strong className="text-[#1C1C1C]">{email}</strong>.
            Check your inbox (and spam folder).
          </p>
          <Link to="/login" className="text-[#E91E8C] hover:underline text-sm font-medium">
            Back to sign in
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
        Reset Password
      </h1>
      <p className="text-[#999] text-sm text-center mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#999]">
        Remembered it?{' '}
        <Link to="/login" className="text-[#E91E8C] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
