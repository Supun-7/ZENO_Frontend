const BASE_URL = import.meta.env.VITE_API_URL

// Generate or retrieve a persistent device ID
function getDeviceId() {
  let id = localStorage.getItem('studyos_device_id')
  if (!id) {
    id = 'device_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11)
    localStorage.setItem('studyos_device_id', id)
  }
  return id
}

async function request(method, path, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': getDeviceId()
  }

  const config = { method, headers }
  if (body) config.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, config)
  const data = await res.json()

  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  profile: {
    get:    ()     => request('GET',   '/api/profile'),
    update: (body) => request('PATCH', '/api/profile', body),
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
    complete:       (body)      => request('POST', '/api/sessions', body),
    stats:          ()          => request('GET',  '/api/sessions/stats'),
    weeklyAnalysis: (startDate) => request('GET',  `/api/sessions/weekly-analysis?startDate=${startDate}`),
  }
}
