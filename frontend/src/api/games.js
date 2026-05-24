import api from './client'

export const getGames = () => api.get('/games').then(r => r.data)
export const createGame = data => api.post('/games', data).then(r => r.data)
export const getGame = id => api.get(`/games/${id}`).then(r => r.data)
export const updateGame = (id, data) => api.patch(`/games/${id}`, data).then(r => r.data)
export const addCoOwner = (gameId, email) => api.post(`/games/${gameId}/owners`, { email }).then(r => r.data)

// Tasks
export const updateTask = (gameId, taskId, data) => api.patch(`/games/${gameId}/tasks/${taskId}`, data).then(r => r.data)
export const addTask = (gameId, data) => api.post(`/games/${gameId}/tasks`, data).then(r => r.data)
export const deleteTask = (gameId, taskId) => api.delete(`/games/${gameId}/tasks/${taskId}`).then(r => r.data)
export const addComment = (gameId, taskId, body) => api.post(`/games/${gameId}/tasks/${taskId}/comments`, { body }).then(r => r.data)

// Matches
export const getMatches = gameId => api.get(`/games/${gameId}/matches`).then(r => r.data)
export const addMatch = (gameId, data) => api.post(`/games/${gameId}/matches`, data).then(r => r.data)
export const updateMatch = (gameId, matchId, data) => api.patch(`/games/${gameId}/matches/${matchId}`, data).then(r => r.data)
export const deleteMatch = (gameId, matchId) => api.delete(`/games/${gameId}/matches/${matchId}`).then(r => r.data)
export const generateRoundRobin = (gameId, data) => api.post(`/games/${gameId}/matches/generate-roundrobin`, data).then(r => r.data)

// Teams & skaters
export const addTeam = (gameId, data) => api.post(`/games/${gameId}/teams`, data).then(r => r.data)
export const updateTeam = (gameId, teamId, data) => api.patch(`/games/${gameId}/teams/${teamId}`, data).then(r => r.data)
export const addSkater = (gameId, teamId, data) => api.post(`/games/${gameId}/teams/${teamId}/skaters`, data).then(r => r.data)
export const updateSkater = (gameId, teamId, skaterId, data) => api.patch(`/games/${gameId}/teams/${teamId}/skaters/${skaterId}`, data).then(r => r.data)
export const deleteSkater = (gameId, teamId, skaterId) => api.delete(`/games/${gameId}/teams/${teamId}/skaters/${skaterId}`).then(r => r.data)

// Day roles
export const updateDayRoleSlot = (gameId, roleId, slotIndex, data) =>
  api.patch(`/games/${gameId}/day-roles/${roleId}/slots/${slotIndex}`, data).then(r => r.data)
export const addDayRole = (gameId, data) => api.post(`/games/${gameId}/day-roles`, data).then(r => r.data)

// Guest portal
export const getGuestPortal = token => api.get(`/portal/guest/${token}`).then(r => r.data)
export const guestAddSkater = (token, teamId, data) => api.post(`/portal/guest/${token}/teams/${teamId}/skaters`, data).then(r => r.data)
export const guestSignWaiver = (token, skaterId, signatureData) =>
  api.post(`/portal/guest/${token}/skaters/${skaterId}/waiver`, { signatureData }).then(r => r.data)

// Public portal
export const getPublicPortal = token => api.get(`/portal/public/${token}`).then(r => r.data)
