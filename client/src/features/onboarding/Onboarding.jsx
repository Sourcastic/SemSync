import { useEffect, useRef, useState } from "react"
import { MdArrowBack } from "react-icons/md"
import { Button, ButtonRow } from "../../components/ui/Button.jsx"
import { ThemePicker } from "../../components/ui/ThemePicker.jsx"
import { usePageTitle } from "../../lib/usePageTitle.js"
import { completeOnboarding } from "../../lib/session.js"
import { navigate } from "../../lib/router.js"

const STEPS = ["appearance", "how", "ready"]

export function Onboarding() {
  const [step, setStep] = useState(0)
  usePageTitle("Welcome")
  const titleRef = useRef(null)

  // Move focus to the new step's heading so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (step > 0) titleRef.current?.focus()
  }, [step])

  function finish(path) {
    completeOnboarding()
    navigate(path)
  }

  const isLast = step === STEPS.length - 1

  return (
    <main className="onboarding">
      <div className="onboarding-panel">
        <div className="onboarding-progress">
          <span className="brand">SemSync</span>
          <span>Step {step + 1} of {STEPS.length}</span>
          <span className="steps" aria-hidden="true">
            {STEPS.map((id, i) => <span key={id} data-done={i <= step || undefined} />)}
          </span>
        </div>

        {STEPS[step] === "appearance" && (
          <section className="onboarding-header" aria-labelledby="onb-title">
            <h1 className="onboarding-title" id="onb-title" ref={titleRef} tabIndex={-1}>Choose an appearance</h1>
            <p className="onboarding-lead">You can change this any time from your account menu.</p>
            <div className="onboarding-body">
              <ThemePicker name="onboarding-theme" />
            </div>
          </section>
        )}

        {STEPS[step] === "how" && (
          <section className="onboarding-header" aria-labelledby="onb-title">
            <h1 className="onboarding-title" id="onb-title" ref={titleRef} tabIndex={-1}>How SemSync works</h1>
            <ol className="how-list onboarding-body">
              <li>
                <div>
                  <strong>Write together, like any shared doc</strong>
                  <p>Everyone edits the same document at once. You see who’s here and where they’re typing.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Edits always stay in sync</strong>
                  <p>Concurrent changes merge automatically using CRDTs, even after working offline.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Meaning conflicts are flagged for review</strong>
                  <p>If two edits merge cleanly but contradict each other, SemSync underlines the passage.</p>
                  <div className="onboarding-example" aria-label="Example of a flagged passage">
                    <span>
                      <span className="sem-conflict">Revenue will increase sharply. Revenue will decline significantly.</span>
                    </span>
                    <span className="pill" data-tone="conflict">Review recommended</span>
                  </div>
                </div>
              </li>
              <li>
                <div>
                  <strong>Suggestions are advisory</strong>
                  <p>SemSync never rewrites your text on its own. You decide what to keep.</p>
                </div>
              </li>
            </ol>
          </section>
        )}

        {STEPS[step] === "ready" && (
          <section className="onboarding-header onboarding-ready" aria-labelledby="onb-title">
            <h1 className="onboarding-title" id="onb-title" ref={titleRef} tabIndex={-1}>You’re all set</h1>
            <p className="onboarding-lead">Open your workspace to find shared documents, or start writing straight away.</p>
            <div className="onboarding-body">
              <ButtonRow>
                <Button variant="primary" size="lg" onClick={() => finish("/")}>Open workspace</Button>
                <Button variant="secondary" size="lg" onClick={() => finish("/doc/new")}>Start with blank document</Button>
              </ButtonRow>
            </div>
          </section>
        )}

        <div className="onboarding-footer">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)}><MdArrowBack />Back</Button>
          )}
          {!isLast && (
            <Button variant="primary" onClick={() => setStep(s => s + 1)}>Continue</Button>
          )}
        </div>
      </div>
    </main>
  )
}
