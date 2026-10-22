// Whose this device's saved copies are. When a different account signs in on it (a shared device, or trying a new
// account), the last one's device-only copies are set aside, so nothing of theirs is shown, merged or sent up here.

const OWNER = 'squared.owner'
const PERSONAL = ['squared.keptPaintings', 'squared.paintedMonth']

export function claimDevice(id: string) {
  try {
    const was = localStorage.getItem(OWNER)
    if (was && was !== id) for (const k of PERSONAL) localStorage.removeItem(k)
    localStorage.setItem(OWNER, id)
  } catch {
    /* storage unavailable: nothing is kept here anyway */
  }
}
