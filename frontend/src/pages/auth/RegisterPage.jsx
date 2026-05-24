import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import AuthLayout from '../../components/AuthLayout'
import Button from '../../components/Button'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register(email, name, password)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1
        className="text-2xl font-semibold uppercase tracking-wide mb-6 text-center"
        style={{ fontFamily: 'Oswald, sans-serif' }}
      >
        Create Account
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Your name</label>
          <input
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-[#EAEAE4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E91E8C] focus:border-transparent"
            placeholder="Derby Donna"
          />
        </div>

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

        <div>
          <label className="block text-sm font-medium mb-1.5">Password</label>
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

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#999]">
        Already have an account?{' '}
        <Link to="/login" className="text-[#E91E8C] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
