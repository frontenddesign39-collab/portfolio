import { useEffect, useRef } from 'react'

export type Quality = 'hd' | 'sd'
export const SRC: Record<Quality, string> = { hd: '/hero-1080.mp4', sd: '/hero-720.mp4' }

// --- Invisible gaze grid ---------------------------------------------------
// The screen is split into a 3x3 grid centred on his head. Nothing is drawn;
// the cell the cursor is in decides which pose of the clip he shows:
//
//     up-left   | up      | up-right
//     left      | front   | right
//     down-left | down    | down-right
//
// The head position and centre-cell size are fractions of the VIDEO FRAME (not
// the viewport), so the grid stays glued to his head at any screen size / crop.
const HEAD = { x: 0.49, y: 0.28 } // where his head sits inside the video frame
const HALF = { w: 0.1, h: 0.18 } // half-size of the centre "look straight" cell

// Object-position used by the <video> below (mobile / md+), as a 0..1 ratio.
const POS_X_MOBILE = 0.6
const POS_X_DESKTOP = 0.7

// --- Poses measured from the clip (seconds) ---------------------------------
type Cell = 'UL' | 'U' | 'UR' | 'L' | 'C' | 'R' | 'DL' | 'D' | 'DR'
const POSES: Record<Cell, number[]> = {
  C: [0, 7], // straight at the camera (two matching frames; nearest one is used)
  R: [0.75],
  UR: [1.4],
  U: [1.9],
  UL: [3.9], // the clip has no true up-left pose, so this reuses level-left
  L: [3.9],
  DL: [4.6],
  D: [2.9],
  DR: [5.9],
}

const FPS = 24
// true  = glide: plays the clip's real head motion to reach the new pose
//         (can pass through other poses on the way, e.g. right -> left sweeps
//         via up/down).
// false = snap: jumps straight to the target frame.
const GLIDE = true
const GLIDE_SPEED = 3 // seconds of clip per real second

export default function App({ quality }: { quality: Quality }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.pause()

    let cur = 0 // clip time currently shown
    let tgt = 0 // clip time we're heading to
    let lastFrame = -1
    let raf = 0
    let lastNow = 0

    const show = (t: number) => {
      const f = Math.round(t * FPS)
      if (f === lastFrame) return
      lastFrame = f
      vid.currentTime = f / FPS
    }

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastNow) / 1000)
      lastNow = now
      const d = tgt - cur
      const s = GLIDE_SPEED * dt
      cur = GLIDE ? (Math.abs(d) <= s ? tgt : cur + Math.sign(d) * s) : tgt
      show(cur)
      raf = cur === tgt ? 0 : requestAnimationFrame(step)
    }

    const aim = (clientX: number, clientY: number) => {
      // Rebuild the head position from the actual on-screen video crop.
      const box = vid.getBoundingClientRect()
      const iw = vid.videoWidth || 16
      const ih = vid.videoHeight || 9
      const scale = Math.max(box.width / iw, box.height / ih) // object-cover
      const rw = iw * scale
      const rh = ih * scale
      const posX = window.matchMedia('(min-width: 768px)').matches ? POS_X_DESKTOP : POS_X_MOBILE
      const headX = box.left + (box.width - rw) * posX + HEAD.x * rw
      const headY = box.top + (box.height - rh) * 0.5 + HEAD.y * rh
      const halfW = HALF.w * rw
      const halfH = HALF.h * rh

      const col = clientX < headX - halfW ? -1 : clientX > headX + halfW ? 1 : 0
      const row = clientY < headY - halfH ? -1 : clientY > headY + halfH ? 1 : 0
      const cell = ((row < 0 ? 'U' : row > 0 ? 'D' : '') + (col < 0 ? 'L' : col > 0 ? 'R' : '') || 'C') as Cell

      // pick the closest matching frame of that pose to where we are now
      tgt = POSES[cell].reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a))

      if (!raf && cur !== tgt) {
        lastNow = performance.now()
        raf = requestAnimationFrame(step)
      }
    }

    const onMove = (e: PointerEvent) => aim(e.clientX, e.clientY)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src={SRC[quality]}
      poster="/poster.jpg"
      muted
      playsInline
      preload="auto"
      className="fixed inset-0 w-full h-full object-cover object-[60%_center] md:object-[70%_center]"
      style={{ height: '100dvh' }}
    />
  )
}
