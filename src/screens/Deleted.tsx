// After delete my account: a calm goodbye, so it's clear it worked. "close" closes the tab where the browser allows
// it (most only let a page close a tab it opened itself); otherwise it goes on to the sign-in screen.
export function Deleted({ onDone }: { onDone: () => void }) {
  const close = () => {
    window.close()
    setTimeout(onDone, 150) // still open: the browser said no
  }
  return (
    <main className="deleted">
      <h1 className="deleted-title">Your account has been deleted.</h1>
      <p>Thank you for painting your days. squared will be here whenever you want to start again.</p>
      <button className="pill" onClick={close}>
        close
      </button>
    </main>
  )
}
