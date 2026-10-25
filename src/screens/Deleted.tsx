// After delete my account: a calm goodbye, so it's clear it worked, before the sign-in screen.
export function Deleted({ onDone }: { onDone: () => void }) {
  return (
    <main className="deleted">
      <h1 className="deleted-title">Your account has been deleted.</h1>
      <p>Your squares, moments and lists are gone for good. Thank you for painting your days.</p>
      <button className="pill" onClick={onDone}>
        done
      </button>
    </main>
  )
}
