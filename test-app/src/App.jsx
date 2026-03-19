import React, { useState } from 'react'
import LoginForm from './components/LoginForm'
import TodoList from './components/TodoList'
import SnapshotViewer from './components/SnapshotViewer'
import './App.css'

export default function App() {
  const [page, setPage] = useState('login')
  const [loggedIn, setLoggedIn] = useState(false)

  return (
    <div className="app">
      <header className="app-header">
        <h1 data-ai-id="app-title" data-ai-role="display" data-ai-label="App Title">
          AI-UI Test App
        </h1>
        <nav className="app-nav">
          <button
            data-ai-id="nav-login"
            data-ai-role="nav"
            data-ai-label="Login Tab"
            className={page === 'login' ? 'active' : ''}
            onClick={() => setPage('login')}
          >
            Login
          </button>
          <button
            data-ai-id="nav-todos"
            data-ai-role="nav"
            data-ai-label="Todos Tab"
            className={page === 'todos' ? 'active' : ''}
            onClick={() => setPage('todos')}
          >
            Todos
          </button>
          <button
            data-ai-id="nav-snapshot"
            data-ai-role="nav"
            data-ai-label="Snapshot Tab"
            className={page === 'snapshot' ? 'active' : ''}
            onClick={() => setPage('snapshot')}
          >
            Snapshot
          </button>
        </nav>
      </header>

      <main className="app-main">
        {page === 'login' && (
          <LoginForm loggedIn={loggedIn} onLogin={() => setLoggedIn(true)} onLogout={() => setLoggedIn(false)} />
        )}
        {page === 'todos' && <TodoList />}
        {page === 'snapshot' && <SnapshotViewer />}
      </main>
    </div>
  )
}
