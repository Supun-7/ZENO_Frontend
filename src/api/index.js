// All API calls go through this file.
// It reads the token from localStorage and attaches it to every request.
// If the server returns 401, it clears the token and reloads the page.

const BASE_URL = import.meta.env.VITE_API_URL

async function request(method, path, body = null) {
  const token = localStorage.getItem('studyos_token')

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const config = { method, headers }
  if (body) config.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, config)

  // Token expired or invalid — log out
  if (res.status === 401) {
    localStorage.removeItem('studyos_token')
    window.location.reload()
    return
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong')
  }

  return data
}

// Auth
export const api = {
  auth: {
    signup: (body) => request('POST', '/api/auth/signup', body),
    login:  (body) => request('POST', '/api/auth/login', body),
    me:     ()     => request('GET',  '/api/auth/me'),
    updateProfile: (body) => request('PATCH', '/api/auth/profile', body),
  },

  modules: {
    list:    ()         => request('GET',    '/api/modules'),
    create:  (body)     => request('POST',   '/api/modules', body),
    update:  (id, body) => request('PATCH',  `/api/modules/${id}`, body),
    delete:  (id)       => request('DELETE', `/api/modules/${id}`),
    analyze: (id)       => request('POST',   `/api/modules/${id}/analyze`),
  },

  slots: {
    getByDate: (date)      => request('GET',   `/api/slots?date=${date}`),
    getWeek:   (startDate) => request('GET',   `/api/slots/week?startDate=${startDate}`),
    assign:    (body)      => request('POST',  '/api/slots', body),
    markMissed:(id)        => request('PATCH', `/api/slots/${id}/miss`),
  },

  sessions: {
    complete:       (body)       => request('POST', '/api/sessions', body),
    history:        (moduleId)   => request('GET',  `/api/sessions/history${moduleId ? `?moduleId=${moduleId}` : ''}`),
    stats:          ()           => request('GET',  '/api/sessions/stats'),
    weeklyAnalysis: (startDate)  => request('GET',  `/api/sessions/weekly-analysis?startDate=${startDate}`),
  }
}
