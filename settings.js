document.addEventListener('DOMContentLoaded', () => {
  const load = () => {
    try {
      const raw = localStorage.getItem('cube-timer-settings')
      const cfg = raw ? JSON.parse(raw) : {}
      const tokenInput = document.getElementById('githubToken')
      if (tokenInput) {
        tokenInput.value = cfg.githubToken || ''
      }
    } catch (e) {
      // ignore
    }
  }

  const showStatus = (text, ok = true) => {
    const status = document.getElementById('status')
    if (status) {
      status.textContent = text
      status.style.color = ok ? '#0a0' : '#a00'
    }
  }

  document.getElementById('saveBtn').addEventListener('click', () => {
    const token = document.getElementById('githubToken').value.trim()
    try {
      const raw = localStorage.getItem('cube-timer-settings')
      let cfg = raw ? JSON.parse(raw) : {}
      cfg.githubToken = token
      // Always-on auto-sync conceptually; keep in settings for migration friendliness
      localStorage.setItem('cube-timer-settings', JSON.stringify(cfg))
      showStatus('Settings saved. Auto-sync is enabled.')
    } catch (e) {
      showStatus('Failed to save settings', false)
    }
  })

  document.getElementById('clearBtn').addEventListener('click', () => {
    localStorage.removeItem('cube-timer-settings')
    showStatus('Settings cleared')
  })

  load()
})
