// GitHub Models Provider
class GitHubProvider {
  constructor(token) {
    this.token = token
    this.baseUrl = 'https://models.github.ai/inference'
    this.model = 'gpt-4o'
  }

  async* streamChat(messages) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              yield content
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

// Chat Application
class ChatApp {
  constructor() {
    // Data
    this.conversations = JSON.parse(localStorage.getItem('thingy-conversations')) || []
    this.currentConversationId = null
    this.githubToken = localStorage.getItem('thingy-github-token')
    this.gistId = localStorage.getItem('thingy-gist-id')
    this.provider = this.githubToken ? new GitHubProvider(this.githubToken) : null
    
    // State
    this.isGenerating = false
    this.syncInterval = null
    this.pendingChanges = false
    
    // DOM Elements - Sidebar
    this.sidebar = document.getElementById('sidebar')
    this.sidebarOverlay = document.getElementById('sidebarOverlay')
    this.menuToggle = document.getElementById('menuToggle')
    this.newChatBtn = document.getElementById('newChatBtn')
    this.conversationsList = document.getElementById('conversationsList')
    
    // DOM Elements - Sync
    this.connectPrompt = document.getElementById('connectPrompt')
    this.showTokenBtn = document.getElementById('showTokenBtn')
    this.tokenInputSection = document.getElementById('tokenInputSection')
    this.tokenInput = document.getElementById('tokenInput')
    this.saveTokenBtn = document.getElementById('saveTokenBtn')
    this.cancelTokenBtn = document.getElementById('cancelTokenBtn')
    this.syncInfo = document.getElementById('syncInfo')
    this.lastSync = document.getElementById('lastSync')
    this.syncIndicator = document.getElementById('syncIndicator')
    this.settingsBtn = document.getElementById('settingsBtn')
    this.settingsMenu = document.getElementById('settingsMenu')
    
    // DOM Elements - Chat
    this.emptyState = document.getElementById('emptyState')
    this.messagesArea = document.getElementById('messagesArea')
    this.messagesHeader = document.querySelector('.messages-header h2')
    this.messagesList = document.getElementById('messagesList')
    this.deleteChatBtn = document.getElementById('deleteChatBtn')
    this.messageInput = document.getElementById('messageInput')
    this.sendBtn = document.getElementById('sendBtn')
    this.typingIndicator = document.getElementById('typingIndicator')
    
    // DOM Elements - Dialogs
    this.deleteDialog = document.getElementById('deleteDialog')
    this.cancelDeleteBtn = document.getElementById('cancelDelete')
    this.confirmDeleteBtn = document.getElementById('confirmDelete')
    this.logoutDialog = document.getElementById('logoutDialog')
    this.cancelLogoutBtn = document.getElementById('cancelLogout')
    this.confirmLogoutBtn = document.getElementById('confirmLogout')
    
    this.init()
  }

  init() {
    // Mobile menu toggle
    this.menuToggle.addEventListener('click', () => this.toggleSidebar())
    this.sidebarOverlay.addEventListener('click', () => this.closeSidebar())
    
    // Sidebar events
    this.newChatBtn.addEventListener('click', () => {
      this.createNewConversation()
      this.closeSidebar()
    })
    
    // Sync events
    this.showTokenBtn.addEventListener('click', () => this.showTokenInput())
    this.saveTokenBtn.addEventListener('click', () => this.saveToken())
    this.cancelTokenBtn.addEventListener('click', () => this.hideTokenInput())
    this.tokenInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveToken()
    })
    this.settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleSettingsMenu()
    })
    document.getElementById('syncNow').addEventListener('click', () => {
      this.syncNow()
      this.hideSettingsMenu()
    })
    document.getElementById('logoutBtn').addEventListener('click', () => {
      this.showLogoutDialog()
      this.hideSettingsMenu()
    })
    
    // Chat events
    this.sendBtn.addEventListener('click', () => this.sendMessage())
    this.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    })
    this.messageInput.addEventListener('input', () => this.autoResizeTextarea())
    
    // Mobile: Ensure textarea is focusable
    this.messageInput.addEventListener('touchstart', (e) => {
      if (!this.messageInput.disabled) {
        e.stopPropagation()
        this.messageInput.focus()
      }
    }, { passive: true })
    this.deleteChatBtn.addEventListener('click', () => this.showDeleteDialog())
    
    // Dialog events
    this.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteDialog())
    this.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete())
    this.cancelLogoutBtn.addEventListener('click', () => this.hideLogoutDialog())
    this.confirmLogoutBtn.addEventListener('click', () => this.confirmLogout())
    
    // Close menus when clicking outside
    document.addEventListener('click', () => {
      this.hideSettingsMenu()
    })
    this.settingsMenu.addEventListener('click', (e) => e.stopPropagation())
    
    // Initialize
    if (this.githubToken) {
      this.showSyncUI()
      this.enableChat()
      this.startAutoSync()
      this.syncNow()
    }
    
    this.renderConversationsList()
    this.registerServiceWorker()
  }

  // Conversation Management
  createNewConversation() {
    const conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.conversations.unshift(conversation)
    this.saveConversations()
    this.selectConversation(conversation.id)
    this.renderConversationsList()
  }

  selectConversation(id) {
    this.currentConversationId = id
    this.renderConversationsList()
    this.renderMessages()
    this.closeSidebar()
  }

  toggleSidebar() {
    this.sidebar.classList.toggle('open')
    this.sidebarOverlay.classList.toggle('open')
  }

  closeSidebar() {
    this.sidebar.classList.remove('open')
    this.sidebarOverlay.classList.remove('open')
  }

  deleteConversation(id) {
    this.conversations = this.conversations.filter(c => c.id !== id)
    this.saveConversations()
    
    if (this.currentConversationId === id) {
      this.currentConversationId = null
      this.showEmptyState()
    }
    
    this.renderConversationsList()
    this.hideDeleteDialog()
  }

  getCurrentConversation() {
    return this.conversations.find(c => c.id === this.currentConversationId)
  }

  updateConversationTitle(conversation) {
    if (conversation.messages.length > 0) {
      const firstUserMessage = conversation.messages.find(m => m.role === 'user')
      if (firstUserMessage) {
        conversation.title = firstUserMessage.content.slice(0, 30) + 
          (firstUserMessage.content.length > 30 ? '...' : '')
      }
    }
  }

  // Message Handling
  async sendMessage() {
    const content = this.messageInput.value.trim()
    if (!content || this.isGenerating || !this.provider) return

    // Create conversation if needed
    if (!this.currentConversationId) {
      this.createNewConversation()
    }

    const conversation = this.getCurrentConversation()
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: new Date().toISOString()
    }
    
    conversation.messages.push(userMessage)
    conversation.updatedAt = new Date().toISOString()
    this.updateConversationTitle(conversation)
    
    // Clear input
    this.messageInput.value = ''
    this.autoResizeTextarea()
    
    // Save and render
    this.saveConversations()
    this.renderConversationsList()
    this.renderMessages()
    
    // Generate AI response
    await this.generateResponse(conversation)
  }

  async generateResponse(conversation) {
    this.isGenerating = true
    this.typingIndicator.classList.remove('hidden')
    this.sendBtn.disabled = true
    this.messageInput.disabled = true

    // Create assistant message placeholder
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }
    
    conversation.messages.push(assistantMessage)
    this.renderMessages()
    
    try {
      // Convert messages to API format
      const apiMessages = conversation.messages
        .filter(m => m.content) // Skip empty messages
        .map(m => ({
          role: m.role,
          content: m.content
        }))

      // Stream response
      let fullContent = ''
      for await (const chunk of this.provider.streamChat(apiMessages)) {
        fullContent += chunk
        assistantMessage.content = fullContent
        this.updateLastMessage(fullContent)
      }
      
      conversation.updatedAt = new Date().toISOString()
      this.saveConversations()
      
    } catch (error) {
      console.error('Generation error:', error)
      assistantMessage.content = 'Sorry, I encountered an error. Please try again.'
      this.updateLastMessage(assistantMessage.content)
      this.saveConversations()
    } finally {
      this.isGenerating = false
      this.typingIndicator.classList.add('hidden')
      this.sendBtn.disabled = false
      this.messageInput.disabled = false
      this.messageInput.focus()
    }
  }

  // UI Rendering
  renderConversationsList() {
    if (this.conversations.length === 0) {
      this.conversationsList.innerHTML = `
        <div class="empty-conversations">
          No conversations yet
        </div>
      `
      return
    }

    this.conversationsList.innerHTML = this.conversations.map(conv => `
      <div class="conversation-item ${conv.id === this.currentConversationId ? 'active' : ''}" 
           data-id="${conv.id}">
        <span class="conversation-icon">💬</span>
        <span class="conversation-title">${this.escapeHtml(conv.title)}</span>
      </div>
    `).join('')

    // Add click handlers
    this.conversationsList.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectConversation(item.dataset.id)
      })
    })
  }

  renderMessages() {
    const conversation = this.getCurrentConversation()
    
    if (!conversation) {
      this.showEmptyState()
      return
    }

    this.showMessagesArea()
    this.messagesHeader.textContent = conversation.title

    if (conversation.messages.length === 0) {
      this.messagesList.innerHTML = `
        <div class="empty-state" style="flex: none; padding: 40px 0;">
          <p>Send a message to start chatting</p>
        </div>
      `
      return
    }

    this.messagesList.innerHTML = conversation.messages.map(msg => `
      <div class="message ${msg.role}" data-id="${msg.id}">
        <div class="message-avatar">
          ${msg.role === 'user' ? '👤' : '🧠'}
        </div>
        <div class="message-content">
          ${this.formatMessageContent(msg.content)}
        </div>
      </div>
    `).join('')

    // Scroll to bottom
    this.messagesList.scrollTop = this.messagesList.scrollHeight
  }

  updateLastMessage(content) {
    const lastMessage = this.messagesList.lastElementChild
    if (lastMessage) {
      const contentDiv = lastMessage.querySelector('.message-content')
      if (contentDiv) {
        contentDiv.innerHTML = this.formatMessageContent(content)
        this.messagesList.scrollTop = this.messagesList.scrollHeight
      }
    }
  }

  formatMessageContent(content) {
    if (!content) return ''
    
    // Simple markdown parsing
    let html = this.escapeHtml(content)
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    
    // Code inline
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Code blocks
    html = html.replace(/```[\s\S]*?```/g, (match) => {
      const code = match.slice(3, -3).trim()
      return `<pre><code>${this.escapeHtml(code)}</code></pre>`
    })
    
    // Line breaks
    html = html.replace(/\n/g, '<br>')
    
    return html
  }

  showEmptyState() {
    this.emptyState.classList.remove('hidden')
    this.messagesArea.classList.add('hidden')
  }

  showMessagesArea() {
    this.emptyState.classList.add('hidden')
    this.messagesArea.classList.remove('hidden')
  }

  autoResizeTextarea() {
    this.messageInput.style.height = 'auto'
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px'
  }

  enableChat() {
    this.messageInput.disabled = false
    this.sendBtn.disabled = false
  }

  // GitHub Token Management
  saveToken() {
    const token = this.tokenInput.value.trim()
    if (token) {
      this.githubToken = token
      localStorage.setItem('thingy-github-token', token)
      this.provider = new GitHubProvider(token)
      this.tokenInput.value = ''
      this.hideTokenInput()
      this.showSyncUI()
      this.enableChat()
      this.startAutoSync()
      this.syncNow()
    }
  }

  logout() {
    this.githubToken = null
    this.gistId = null
    this.provider = null
    localStorage.removeItem('thingy-github-token')
    localStorage.removeItem('thingy-gist-id')
    localStorage.removeItem('thingy-last-sync')
    this.stopAutoSync()
    this.hideSyncUI()
    this.messageInput.disabled = true
    this.sendBtn.disabled = true
    this.lastSync.textContent = 'Never synced'
  }

  showSyncUI() {
    this.connectPrompt.classList.add('hidden')
    this.tokenInputSection.classList.add('hidden')
    this.syncInfo.classList.remove('hidden')
  }

  hideSyncUI() {
    this.connectPrompt.classList.remove('hidden')
    this.tokenInputSection.classList.add('hidden')
    this.syncInfo.classList.add('hidden')
  }

  showTokenInput() {
    this.connectPrompt.classList.add('hidden')
    this.tokenInputSection.classList.remove('hidden')
    this.tokenInput.focus()
  }

  hideTokenInput() {
    this.tokenInputSection.classList.add('hidden')
    this.connectPrompt.classList.remove('hidden')
    this.tokenInput.value = ''
  }

  toggleSettingsMenu() {
    this.settingsMenu.classList.toggle('hidden')
  }

  hideSettingsMenu() {
    this.settingsMenu.classList.add('hidden')
  }

  // Dialogs
  showDeleteDialog() {
    this.deleteDialog.classList.remove('hidden')
  }

  hideDeleteDialog() {
    this.deleteDialog.classList.add('hidden')
  }

  confirmDelete() {
    if (this.currentConversationId) {
      this.deleteConversation(this.currentConversationId)
    }
  }

  showLogoutDialog() {
    this.logoutDialog.classList.remove('hidden')
  }

  hideLogoutDialog() {
    this.logoutDialog.classList.add('hidden')
  }

  confirmLogout() {
    this.logout()
    this.hideLogoutDialog()
  }

  // Persistence
  saveConversations() {
    localStorage.setItem('thingy-conversations', JSON.stringify(this.conversations))
    this.pendingChanges = true
    
    if (this.githubToken && navigator.onLine) {
      this.syncNow()
    }
  }

  // Gist Sync
  async syncNow() {
    if (!this.githubToken || this.isGenerating) return
    
    this.syncIndicator.classList.add('syncing')
    
    try {
      await this.pullFromGist()
      
      if (this.pendingChanges) {
        await this.pushToGist()
      }
      
      this.lastSync.textContent = 'Synced ' + new Date().toLocaleTimeString()
      this.pendingChanges = false
    } catch (error) {
      console.error('Sync failed:', error)
      this.lastSync.textContent = 'Sync failed'
    } finally {
      this.syncIndicator.classList.remove('syncing')
    }
  }

  async pullFromGist() {
    if (!this.gistId) {
      const gists = await this.getGists()
      const thingyGist = gists.find(g => g.description === 'THINGY AI Chat Data')
      
      if (thingyGist) {
        this.gistId = thingyGist.id
        localStorage.setItem('thingy-gist-id', this.gistId)
      } else {
        return
      }
    }

    const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
      headers: {
        'Authorization': `token ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) throw new Error('Failed to fetch gist')

    const gist = await response.json()
    const content = gist.files['conversations.json']?.content
    
    if (content) {
      const remoteConversations = JSON.parse(content)
      const remoteTimestamp = gist.updated_at
      const localTimestamp = localStorage.getItem('thingy-last-sync')
      
      if (!localTimestamp || new Date(remoteTimestamp) > new Date(localTimestamp)) {
        this.conversations = remoteConversations
        this.saveToLocalOnly()
        this.renderConversationsList()
        if (this.currentConversationId) {
          this.renderMessages()
        }
        localStorage.setItem('thingy-last-sync', remoteTimestamp)
      }
    }
  }

  async pushToGist() {
    const content = JSON.stringify(this.conversations, null, 2)
    
    if (!this.gistId) {
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: 'THINGY AI Chat Data',
          public: false,
          files: {
            'conversations.json': { content }
          }
        })
      })

      if (!response.ok) throw new Error('Failed to create gist')

      const gist = await response.json()
      this.gistId = gist.id
      localStorage.setItem('thingy-gist-id', this.gistId)
      localStorage.setItem('thingy-last-sync', gist.updated_at)
    } else {
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            'conversations.json': { content }
          }
        })
      })

      if (!response.ok) throw new Error('Failed to update gist')

      const gist = await response.json()
      localStorage.setItem('thingy-last-sync', gist.updated_at)
    }
  }

  async getGists() {
    const response = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `token ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) throw new Error('Failed to fetch gists')
    return await response.json()
  }

  saveToLocalOnly() {
    localStorage.setItem('thingy-conversations', JSON.stringify(this.conversations))
  }

  startAutoSync() {
    this.syncInterval = setInterval(() => this.syncNow(), 10000)
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Utilities
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js')
        .then(registration => {
          console.log('Service Worker registered:', registration)
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error)
        })
    }
  }
}

// Initialize
const app = new ChatApp()
