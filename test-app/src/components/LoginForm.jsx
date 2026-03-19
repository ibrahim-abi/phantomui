import React, { useState } from 'react'

export default function LoginForm({ loggedIn, onLogin, onLogout }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (email === 'test@example.com' && password === 'password123') {
      setError('')
      onLogin()
    } else {
      setError('Invalid credentials. Try test@example.com / password123')
    }
  }

  if (loggedIn) {
    return (
      <div className="card">
        <h2 data-ai-id="welcome-message" data-ai-role="display" data-ai-label="Welcome Message">
          Welcome back!
        </h2>
        <p>You are logged in as <strong>test@example.com</strong></p>
        <button
          data-ai-id="logout-btn"
          data-ai-role="action"
          data-ai-label="Logout Button"
          data-ai-action="logs out the current user"
          className="btn btn-secondary"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 data-ai-id="login-title" data-ai-role="display" data-ai-label="Login Title">
        Sign In
      </h2>

      <form
        data-ai-id="login-form"
        data-ai-role="display"
        data-ai-context="authentication"
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            data-ai-id="login-email"
            data-ai-role="input"
            data-ai-label="Email Address"
            data-ai-context="login-form"
            data-ai-required="true"
            placeholder="test@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            data-ai-id="login-password"
            data-ai-role="input"
            data-ai-label="Password"
            data-ai-context="login-form"
            data-ai-required="true"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p
            data-ai-id="login-error"
            data-ai-role="display"
            data-ai-label="Error Message"
            data-ai-state="error"
            className="error-msg"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          data-ai-id="login-submit"
          data-ai-role="action"
          data-ai-label="Submit Login"
          data-ai-action="submits the login form"
          data-ai-context="login-form"
          className="btn btn-primary"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}
