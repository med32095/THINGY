class BaseApp {
  constructor(appManager, name) {
    this.appManager = appManager
    this.name = name
    this.container = null
    this.isActive = false
  }

  async init() {
    this.container = document.getElementById(`${this.name}-app`)
    await this.loadData()
    this.initElements()
    this.initEventListeners()
    this.render()
  }

  async loadData() {
    this.data = this.appManager.getAppData(this.name)
  }

  async saveData() {
    this.appManager.setAppData(this.name, this.data)
  }

  initElements() {
  }

  initEventListeners() {
  }

  render() {
  }

  activate() {
    this.isActive = true
    this.container.style.display = 'block'
    this.render()
  }

  deactivate() {
    this.isActive = false
    this.container.style.display = 'none'
  }

  goHome() {
    this.appManager.goHome()
  }
}