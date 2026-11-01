// A kept moment is sent like mail (nomi, Oct 31 – Nov 1, 2026): a copy of where it was written, exactly as it looked,
// lifts off the page as its shadow grows, then shrinks along an arc into its card at the top of the moments (or toward
// the screen's foot, if the list is below it); the card gives a small nod as it lands. The same flight for every way a
// moment is kept: the moment box, and the bubble ("because…", or an edit). Never with "reduce motion".

const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Fly what was written in `source` into its card. Call it before the moment is saved (the copy is taken now); the
 *  flight starts once the list shows the card. */
export function flyAway(source: HTMLElement | null) {
  if (!source || still()) return
  const r = source.getBoundingClientRect()
  const ghost = source.cloneNode(true) as HTMLElement
  // A copy doesn't carry what was typed into it.
  const typed = source.querySelectorAll('textarea')
  ghost.querySelectorAll('textarea').forEach((t, i) => (t.value = typed[i]?.value ?? ''))
  ghost.classList.add('is-flying')
  ghost.setAttribute('aria-hidden', 'true')
  // Placed on the page, not the screen: the keyboard closing scrolls the page back as it lifts, and the copy moves with
  // it (pinned to the screen, it was left behind; nomi's recording, Oct 31, 2026).
  Object.assign(ghost.style, {
    top: `${r.top + window.scrollY}px`,
    left: `${r.left + window.scrollX}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
  })
  // Its outline as it was, plus a shadow not yet cast.
  const shadow = `${getComputedStyle(source).boxShadow.replace(/^none$/, 'rgba(20, 20, 19, 0) 0px 0px 0px 0px')}, rgba(20, 20, 19, 0) 0px 0px 0px 0px`
  document.body.appendChild(ghost)
  // Two frames: the moment has been saved and the list shows its card.
  requestAnimationFrame(() => requestAnimationFrame(() => fly(ghost, shadow)))
}

function fly(el: HTMLElement, shadow: string) {
  const from = el.getBoundingClientRect()
  // The new (or just updated) card, and the row holding it, which hides the swipe's "delete" too.
  const card = document.querySelector<HTMLElement>('.notes .note-card.is-arriving')
  const row = card?.closest<HTMLElement>('.swipe') ?? card
  const to = card?.getBoundingClientRect()
  const foot = window.innerHeight - 96
  const onScreen = !!to && to.top < foot
  const x = onScreen ? to!.left + to!.width / 2 : window.innerWidth / 2
  const y = onScreen ? to!.top + to!.height / 2 : foot
  const dx = x - (from.left + from.width / 2)
  const dy = y - (from.top + from.height / 2)
  // The card waits, unseen, for its copy to land.
  if (onScreen) row!.style.opacity = '0'
  const lifted = 'inset 0 0 0 1.5px #e2e2db, 0 10px 26px rgba(20, 20, 19, 0.16)'
  const flight = el.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1, boxShadow: shadow },
      { transform: 'translate(0, -14px) scale(1.03)', opacity: 1, boxShadow: lifted, offset: 0.25 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.55}px) scale(0.75)`, opacity: 1, offset: 0.65 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity: 0.7 },
    ],
    { duration: 1400, easing: 'cubic-bezier(0.45, 0, 0.35, 1)', fill: 'forwards' },
  )
  flight.onfinish = () => {
    el.remove()
    if (!onScreen) return
    row!.style.opacity = ''
    // Landed: the card gives a small nod.
    card!.animate([{ transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' })
  }
}
