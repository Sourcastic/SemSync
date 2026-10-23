import { useState } from "react"
import { FcGoogle } from "react-icons/fc"
import { MdVisibility, MdVisibilityOff, MdArrowBack } from "react-icons/md"
import { Button, IconButton } from "../../components/ui/Button.jsx"
import { usePageTitle } from "../../lib/usePageTitle.js"
import { signIn } from "../../lib/session.js"
import { navigate } from "../../lib/router.js"

// Demo build: there is no account backend, so any non-empty email and password sign in.

// mode: "login" | "signup" | "reset"
export function AuthScreen() {
  const [mode, setMode] = useState("login")
  const [values, setValues] = useState({ name: "", email: "", password: "" })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  function update(field) {
    return event => {
      setValues(v => ({ ...v, [field]: event.target.value }))
      if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
    }
  }

  function switchMode(next) {
    setMode(next)
    setErrors({})
    setResetSent(false)
  }

  function validate() {
    const next = {}
    if (mode === "signup" && !values.name.trim()) next.name = "Enter your name."
    if (!values.email.trim()) next.email = "Enter your email."
    if (mode !== "reset") {
      if (!values.password) next.password = "Enter your password."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function finish(details) {
    signIn(details)
    navigate("/")
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    if (mode === "reset") setResetSent(true)
    else finish({ email: values.email.trim(), name: mode === "signup" ? values.name.trim() : undefined })
  }

  usePageTitle({ login: "Sign in", signup: "Create account", reset: "Reset password" }[mode])

  const title = { login: "Sign in", signup: "Create an account", reset: "Reset your password" }[mode]

  return (
    <main className="auth">
      <div className="auth-panel">
        <div className="auth-header">
          <h1 className="auth-title">{title}</h1>
          {mode === "reset" && (
            <p className="auth-subtitle">Enter your email and we’ll send you a link to choose a new password.</p>
          )}
        </div>

        {resetSent ? (
          <div className="auth-form">
            <p className="auth-subtitle" role="status">
              If an account exists for <strong>{values.email.trim()}</strong>, a reset link is on its way.
            </p>
            <Button variant="secondary" size="lg" block onClick={() => switchMode("login")}>
              <MdArrowBack />Back to sign in
            </Button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <Field id="auth-name" label="Name" error={errors.name}>
                <input className="input" {...fieldProps("auth-name", errors.name)} autoComplete="name" value={values.name} onChange={update("name")} />
              </Field>
            )}

            <Field id="auth-email" label="Email" error={errors.email}>
              <input
                className="input"
                {...fieldProps("auth-email", errors.email)}
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={update("email")}
              />
            </Field>

            {mode !== "reset" && (
              <Field id="auth-password" label="Password" error={errors.password}>
                <div className="input-with-action">
                  <input
                    className="input"
                    {...fieldProps("auth-password", errors.password)}
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={values.password}
                    onChange={update("password")}
                  />
                  <IconButton
                    size="sm"
                    label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(s => !s)}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </IconButton>
                </div>
              </Field>
            )}

            {mode === "login" && (
              <Button variant="link" className="auth-forgot" onClick={() => switchMode("reset")}>
                Forgot password?
              </Button>
            )}

            <Button type="submit" variant="primary" size="lg" block>
              {{ login: "Sign in", signup: "Create account", reset: "Send reset link" }[mode]}
            </Button>
          </form>
        )}

        {mode !== "reset" && (
          <div className="auth-providers">
            <div className="divider">or</div>
            <Button variant="secondary" size="lg" block onClick={() => finish({ provider: "google" })}>
              <FcGoogle />Continue with Google
            </Button>
            <Button variant="ghost" size="lg" block onClick={() => finish({ provider: "guest" })}>
              Continue as guest
            </Button>
          </div>
        )}

        <p className="auth-footer">
          {mode === "login" ? (
            <>New to SemSync? <Button variant="link" onClick={() => switchMode("signup")}>Create an account</Button></>
          ) : (
            <>{mode === "signup" ? "Already have an account?" : "Remembered it?"} <Button variant="link" onClick={() => switchMode("login")}>Sign in</Button></>
          )}
        </p>
      </div>
    </main>
  )
}

function Field({ id, label, error, help, children }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <span className="field-error" id={`${id}-msg`} role="alert">{error}</span>
      ) : help ? (
        <span className="field-help" id={`${id}-msg`}>{help}</span>
      ) : null}
    </div>
  )
}

// Links an input to its Field message for assistive tech.
function fieldProps(id, error, help) {
  return {
    id,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error || help ? `${id}-msg` : undefined,
  }
}
