'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import { LockKeyhole, Mail } from 'lucide-react'
import styles from '../admin.module.css'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(body.error || 'Unable to sign in')
      setBusy(false)
      return
    }
    window.location.assign('/admin')
  }

  return (
    <div className={`admin-root ${styles.loginPage}`}>
      <div className={styles.loginCard}>
        <Image src="/logo.png" alt="HME" width={118} height={70} priority className={styles.loginLogo} />
        <p className={styles.kicker}>HME Website Operations</p>
        <h1>Publishing admin</h1>
        <p className={styles.loginLead}>Manage rates, promotions and branch information with approval and audit controls.</p>
        <form onSubmit={submit} className={styles.loginForm}>
          <label>Email address<span className={styles.inputWithIcon}><Mail size={18} /><input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></span></label>
          <label>Password<span className={styles.inputWithIcon}><LockKeyhole size={18} /><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></span></label>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <button className={styles.primaryButton} disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</button>
        </form>
        <p className={styles.loginNote}>Authorised HME personnel only. All actions are recorded.</p>
      </div>
    </div>
  )
}
