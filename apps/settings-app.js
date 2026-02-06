class SettingsApp extends BaseApp {
  constructor(appManager, name) {
    super(appManager, name)
  }

  async loadData() {
    // Settings data lives in the cube-timer settings storage; no per-app data here
    this.token = null
  }

  async saveData() {
    // No per-app data to persist here; rely on token storage in localStorage
  }

  renderCard() {
    return `
      <div class="card" style="width:100%">
        <div class="card-header" style="display:flex; align-items:center; justify-content:space-between;">
          <span>GitHub Sync Settings</span>
          <button id="homeFromSettings" class="home-btn" style="padding:6px 10px; border-radius:6px;">Home</button>
        </div>
        <div class="form-row" style="margin-top:8px;">
          <label for="githubTokenApp">GitHub Personal Access Token (PAT)</label>
          <input type="password" id="githubTokenApp" placeholder="PAT with gist scope" />
        </div>
        <div class="form-row">
          <label><input type="checkbox" id="autoSyncApp" checked disabled> Auto-sync (always on)</label>
        </div>
        <div class="form-actions" style="margin-top:8px;">
          <button id="saveSettingsApp" class="primary-btn">Save</button>
          <button id="clearSettingsApp" class="danger-btn">Clear</button>
          <span id="settingsStatus" class="status" aria-live="polite"></span>
        </div>
      </div>
    `
  }

  async init() {
    // Build container content
    this.container = document.getElementById(`${this.name}-app`)
    if (!this.container) {
      // If container doesn't exist yet, create it
      this.container = document.createElement('div')
      this.container.id = `${this.name}-app`
      this.container.style.display = 'none'
      document.getElementById('home-screen').appendChild(this.container)
    }
    await this.loadData()
    this.container.innerHTML = this.renderCard()
    this.initElements()
    this.initEventListeners()
    this.activate()
  }

  initElements() {
    this.homeFromSettings = document.getElementById('homeFromSettings')
    this.githubTokenApp = document.getElementById('githubTokenApp')
    this.saveSettingsApp = document.getElementById('saveSettingsApp')
    this.clearSettingsApp = document.getElementById('clearSettingsApp')
    this.settingsStatus = document.getElementById('settingsStatus')
  }

  initEventListeners() {
    if (this.homeFromSettings) this.homeFromSettings.addEventListener('click', () => this.goHome())
    if (this.saveSettingsApp) this.saveSettingsApp.addEventListener('click', () => this.saveSettings())
    if (this.clearSettingsApp) this.clearSettingsApp.addEventListener('click', () => this.clearSettings())
  }

  async saveSettings() {
    const token = this.githubTokenApp ? this.githubTokenApp.value.trim() : ''
    try {
      const raw = localStorage.getItem('cube-timer-settings')
      let cfg = raw ? JSON.parse(raw) : {}
      cfg.githubToken = token
      localStorage.setItem('cube-timer-settings', JSON.stringify(cfg))
      this.settingsStatus.textContent = 'Saved'
      this.appManager.setSyncStatus('Token saved')
      this.appManager.saveData()
    } catch (e) {
      this.settingsStatus.textContent = 'Error saving'
    }
  }

  async clearSettings() {
    localStorage.removeItem('cube-timer-settings')
    if (this.settingsStatus) this.settingsStatus.textContent = 'Cleared'
    this.appManager.setSyncStatus('Settings cleared')
  }
}
