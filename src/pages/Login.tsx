import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Login.css'
import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

 async function handleLogin(event: React.FormEvent) {
  event.preventDefault()

  setError('')
  setLoading(true)

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    setError(error.message)
    setLoading(false)
    return
  }

  navigate('/archive')
  setLoading(false)
}

  return (
    <main className="login-page">

      <section className="login-panel">

        <div className="login-brand">
          <span className="login-brand-mark">
            PHX
          </span>

          <span className="login-brand-divider" />

          <span className="login-brand-name">
            Archive
          </span>
        </div>

        <div className="login-heading">
          <p className="login-eyebrow">
            Internal Archive
          </p>

          <h1>
            Access the archive.
          </h1>

          <p className="login-description">
            Sign in with your PHX account to search
            and access archived projects.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="login-form"
        >

          <div className="login-field">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading
              ? 'Signing in...'
              : 'Sign in'}
          </button>

        </form>

        <p className="login-footer">
          PHX India Imaging Services LLP
        </p>

      </section>

    </main>
  )
}

export default Login