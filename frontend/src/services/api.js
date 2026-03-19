async function get(path) {
  try {
    const r = await fetch(path, { signal: AbortSignal.timeout(4000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  } catch { return null }
}
export const fetchStats  = () => get('/stats')
export const fetchHealth = () => get('/health')
export async function triggerSim(mode, action='start') {
  try {
    const r = await fetch(`/simulate?mode=${mode}&action=${action}`,
      { method: 'POST', signal: AbortSignal.timeout(5000) })
    return r.json()
  } catch { return null }
}
