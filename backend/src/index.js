require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' })) // 10mb for signature images

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/leagues', require('./routes/leagues'))
app.use('/api/leagues/:leagueId/seasons', require('./routes/leagueRoster'))
app.use('/api/games', require('./routes/games'))
app.use('/api/games/:gameId/tasks', require('./routes/tasks'))
app.use('/api/games/:gameId/matches', require('./routes/matches'))
app.use('/api/games/:gameId/teams', require('./routes/teams'))
app.use('/api/games/:gameId/day-roles', require('./routes/dayRoles'))
app.use('/api/games/:gameId/info-sections', require('./routes/infoSections'))

// Guest, public, and volunteer portal routes live under /api/portal for clean separation
app.use('/api/portal/guest', require('./routes/guestPortal'))
app.use('/api/portal/public', require('./routes/publicPortal'))
app.use('/api/portal/volunteer', require('./routes/volunteerPortal'))
app.use('/api/portal/on-the-day', require('./routes/onTheDayPortal'))

app.get('/health', (_, res) => res.json({ ok: true }))

// Global error handler — logs the error and returns JSON
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message, err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
