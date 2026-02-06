class AppManager {
  constructor() {
    this.apps = new Map()
    this.currentApp = null
    this.isHome = true
    this.data = {}
    
    this.init()
    // Ensure brand/home interaction is wired upfront
    this.attachBrandHomeHandler()
  }

  async init() {
    await this.loadData()
    this.migrateOldData()
    this.registerApps()
    this.initHomeScreen()
    this.initEventListeners()
    this.showHome()
    // Initialize sync status badge (if present)
    this.ensureSyncBadge()
  }

  async loadData() {
    const saved = localStorage.getItem('thingyData')
    this.data = saved ? JSON.parse(saved) : {
      settings: {
        theme: 'dark'
      },
      installedApps: ['cubeTimer', 'habitTracker', 'settings']
    }
  }

  async saveData() {
    localStorage.setItem('thingyData', JSON.stringify(this.data))
  }

  getAppData(appName) {
    return this.data[appName] || {}
  }

  setAppData(appName, appData) {
    this.data[appName] = appData
    this.saveData()
  }

  migrateOldData() {
    const oldSolves = localStorage.getItem('cube-timer-solves')
    const oldSettings = localStorage.getItem('cube-timer-settings')
    const oldRecords = [
      'cube-timer-single-record',
      'cube-timer-ao5-record', 
      'cube-timer-ao12-record',
      'cube-timer-ao50-record'
    ]

    if (oldSolves && !this.data.cubeTimer) {
      const cubeTimerData = {
        solves: JSON.parse(oldSolves),
        settings: oldSettings ? JSON.parse(oldSettings) : {
          inspectionTime: 15,
          timerType: 'touch',
          theme: 'dark'
        },
        records: {}
      }

      oldRecords.forEach(key => {
        const value = localStorage.getItem(key)
        if (value) {
          const recordType = key.replace('cube-timer-', '').replace('-record', '')
          cubeTimerData.records[recordType] = parseFloat(value)
        }
      })

      this.data.cubeTimer = cubeTimerData
      this.saveData()

      oldRecords.forEach(key => localStorage.removeItem(key))
      localStorage.removeItem('cube-timer-solves')
      localStorage.removeItem('cube-timer-settings')
    }
  }

  registerApps() {
    this.apps.set('cubeTimer', new CubeTimerApp(this, 'cubeTimer'))
    this.apps.set('habitTracker', new HabitTrackerApp(this, 'habitTracker'))
    this.apps.set('settings', new SettingsApp(this, 'settings'))
    
    // Set global reference for habit tracker
    window.habitTrackerApp = this.apps.get('habitTracker')
  }

  // Home navigation via the top-right brand
  attachBrandHomeHandler() {
    const brand = document.getElementById('brand-home')
    if (brand) {
      brand.addEventListener('click', () => this.goHome())
    }
  }

  // Sync status badge helpers
  ensureSyncBadge() {
    // create if not present already
    const el = document.getElementById('thingy-sync-status')
    if (el) {
      el.style.display = 'inline-block'
      this.setSyncStatus('Sync: idle')
    }
  }

  setSyncStatus(text) {
    const el = document.getElementById('thingy-sync-status')
    if (el) {
      el.textContent = text
      el.style.display = 'inline-block'
    }
  }

  initHomeScreen() {
    const homeContainer = document.getElementById('home-screen')
    if (!homeContainer) return

    const appGrid = document.getElementById('app-grid')
    appGrid.innerHTML = ''

    const appConfigs = [
      {
        id: 'cubeTimer',
        name: 'Cube Timer',
        icon: '⏱️',
        color: '#e94560',
        description: 'Rubik\'s cube timer with statistics'
      },
      {
        id: 'habitTracker', 
        name: 'Habits',
        icon: '✅',
        color: '#4ade80',
        description: 'Track daily habits and build streaks'
      }
      ,
      {
        id: 'settings',
        name: 'Settings',
        icon: '⚙️',
        color: '#64748b',
        description: 'Sync and token management'
      }
    ]

    appConfigs.forEach(config => {
      if (this.data.installedApps.includes(config.id)) {
        const appCard = document.createElement('div')
        appCard.className = 'app-card'
        appCard.dataset.appId = config.id
        appCard.innerHTML = `
          <div class="app-icon" style="background: ${config.color}">
            <span style="font-size: 2rem;">${config.icon}</span>
          </div>
          <div class="app-name">${config.name}</div>
          <div class="app-description">${config.description}</div>
        `
        
        appCard.addEventListener('click', () => this.launchApp(config.id))
        appGrid.appendChild(appCard)
      }
    })

    // Ensure Settings tile is visible even if not listed in installedApps (debug safety)
    if (!this.data.installedApps.includes('settings')) {
      const settingsCard = document.createElement('div')
      settingsCard.className = 'app-card'
      settingsCard.dataset.appId = 'settings'
      settingsCard.innerHTML = `
        <div class="app-icon" style="background: #64748b;">
          <span style="font-size: 2rem;">⚙️</span>
        </div>
        <div class="app-name">Settings</div>
        <div class="app-description">Sync and token management</div>
      `
      settingsCard.addEventListener('click', () => this.launchApp('settings'))
      appGrid.appendChild(settingsCard)
    }
  }

  initEventListeners() {
    const homeBtn = document.getElementById('home-btn')
    if (homeBtn) {
      homeBtn.addEventListener('click', () => this.goHome())
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.isHome) {
        this.goHome()
      }
    })
  }

  async launchApp(appId) {
    const app = this.apps.get(appId)
    if (!app) return

    if (!app.container) {
      await app.init()
    }

    this.currentApp = app
    this.isHome = false
    
    document.getElementById('home-screen').style.display = 'none'
    
    app.activate()
  }

  goHome() {
    if (this.currentApp) {
      this.currentApp.deactivate()
      this.currentApp = null
    }

    this.isHome = true
    document.getElementById('home-screen').style.display = 'block'
    const homeBtn = document.getElementById('home-btn')
    if (homeBtn) homeBtn.style.display = 'none'
  }

  showHome() {
    this.goHome()
  }

  applyTheme() {
    document.body.className = this.data.settings?.theme || 'dark'
  }
}

const appManager = new AppManager()
