import { Link } from 'react-router-dom'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link to="/" className="mb-8 text-center select-none">
        <div
          className="text-3xl tracking-widest text-[#1C1C1C]"
          style={{ fontFamily: 'Oswald, sans-serif' }}
        >
          HOME GAME <span style={{ color: '#E91E8C' }}>DAY</span>
        </div>
        <p className="text-[#999] text-sm mt-1">Roller derby home game organizer</p>
      </Link>

      {/* Card */}
      <div className="bg-white border border-[#EAEAE4] rounded-2xl shadow-sm w-full max-w-md p-8">
        {children}
      </div>
    </div>
  )
}
