import api from './client'

export const getGames = () => api.get('/games').then(r => r.data)
export const createGame = data => api.post('/games', data).then(r => r.data)
export const getGame = id => api.get(`/games/${id}`).then(r => r.data)
export const updateGame = (id, data) => api.patch(`/games/${id}`, data).then(r => r.data)
export const deleteGame = id => api.delete(`/games/${id}`).then(r => r.data)
export const addCoOwner = (gameId, email) => api.post(`/games/${gameId}/owners`, { email }).then(r => r.data)
export const removeCoOwner = (gameId, userId) => api.delete(`/games/${gameId}/owners/${userId}`).then(r => r.data)

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
export const bulkAddSkaters = (gameId, teamId, skaters) => api.post(`/games/${gameId}/teams/${teamId}/skaters/bulk`, { skaters }).then(r => r.data)
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

// Leagues
export const getLeagues = () => api.get('/leagues').then(r => r.data)
export const searchLeagues = (q) => api.get('/leagues/search', { params: { q } }).then(r => r.data)
export const createLeague = (data) => api.post('/leagues', data).then(r => r.data)
export const getLeague = (id) => api.get(`/leagues/${id}`).then(r => r.data)
export const updateLeague = (id, data) => api.patch(`/leagues/${id}`, data).then(r => r.data)
export const deleteLeague = (id, deleteGames) => api.delete(`/leagues/${id}`, { data: { deleteGames } }).then(r => r.data)
export const joinLeague = (id) => api.post(`/leagues/${id}/join`).then(r => r.data)
export const approveMember = (id, userId) => api.patch(`/leagues/${id}/members/${userId}`, { action: 'approve' }).then(r => r.data)
export const rejectMember = (id, userId) => api.patch(`/leagues/${id}/members/${userId}`, { action: 'reject' }).then(r => r.data)
export const promoteMember = (id, userId) => api.patch(`/leagues/${id}/members/${userId}`, { action: 'promote' }).then(r => r.data)
export const demoteMember = (id, userId) => api.patch(`/leagues/${id}/members/${userId}`, { action: 'demote' }).then(r => r.data)
export const removeMember = (id, userId) => api.delete(`/leagues/${id}/members/${userId}`).then(r => r.data)
export const seedBlueprint = (id) => api.post(`/leagues/${id}/blueprint/seed`).then(r => r.data)
export const clearBlueprint = (id) => api.delete(`/leagues/${id}/blueprint`).then(r => r.data)
export const addBlueprintTask = (id, data) => api.post(`/leagues/${id}/blueprint/tasks`, data).then(r => r.data)
export const updateBlueprintTask = (id, taskId, data) => api.patch(`/leagues/${id}/blueprint/tasks/${taskId}`, data).then(r => r.data)
export const deleteBlueprintTask = (id, taskId) => api.delete(`/leagues/${id}/blueprint/tasks/${taskId}`).then(r => r.data)
export const addBlueprintRole = (id, data) => api.post(`/leagues/${id}/blueprint/roles`, data).then(r => r.data)
export const updateBlueprintRole = (id, roleId, data) => api.patch(`/leagues/${id}/blueprint/roles/${roleId}`, data).then(r => r.data)
export const deleteBlueprintRole = (id, roleId) => api.delete(`/leagues/${id}/blueprint/roles/${roleId}`).then(r => r.data)

// Volunteer portal (pre-bout checklist)
export const getVolunteerPortal = token => api.get(`/portal/volunteer/${token}`).then(r => r.data)
export const volunteerUpdateTask = (token, taskId, data) => api.patch(`/portal/volunteer/${token}/tasks/${taskId}`, data).then(r => r.data)

// On-the-day portal (roles + schedule)
export const getOnTheDayPortal = token => api.get(`/portal/on-the-day/${token}`).then(r => r.data)
export const onTheDayUpdateDayRoleSlot = (token, roleId, slotIndex, personName) =>
  api.patch(`/portal/on-the-day/${token}/day-roles/${roleId}/slots/${slotIndex}`, { personName }).then(r => r.data)

// Info Pack (game-level public sections)
export const getInfoSections = gameId => api.get(`/games/${gameId}/info-sections`).then(r => r.data)
export const addInfoSection = (gameId, data) => api.post(`/games/${gameId}/info-sections`, data).then(r => r.data)
export const updateInfoSection = (gameId, sectionId, data) => api.patch(`/games/${gameId}/info-sections/${sectionId}`, data).then(r => r.data)
export const deleteInfoSection = (gameId, sectionId) => api.delete(`/games/${gameId}/info-sections/${sectionId}`).then(r => r.data)

// Blueprint info sections (league-level)
export const addBlueprintInfoSection = (leagueId, data) => api.post(`/leagues/${leagueId}/blueprint/info-sections`, data).then(r => r.data)
export const updateBlueprintInfoSection = (leagueId, sectionId, data) => api.patch(`/leagues/${leagueId}/blueprint/info-sections/${sectionId}`, data).then(r => r.data)
export const deleteBlueprintInfoSection = (leagueId, sectionId) => api.delete(`/leagues/${leagueId}/blueprint/info-sections/${sectionId}`).then(r => r.data)
