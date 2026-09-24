import { useEffect, useRef } from 'react'

export type Quality = 'hd' | 'sd'
export const SRC: Record<Quality, string> = { hd: '/hero-1080.mp4', sd: '/hero-720.mp4' }

// --- Where the head actually sits on screen -------------------------------
// As a ratio of viewport width/height. The video is object-cover cropped with
// object-[60%_center] (mobile) / md:object-[70%_center] (desktop), so the head
// sits roughly here — TUNE THESE by eye once you see it live; they'll drift
// depending on viewport aspect ratio.
const HEAD_X_RATIO = 0.6
const HEAD_Y_RATIO = 0.22

// --- Keyframes measured directly from the clip ----------------------------
// angle = degrees from straight up, sweeping through the right side only
// (0=up, 90=level with the ear, 180=straight down/neck). The left side reuses
// these same times but mirrors the video horizontally, since the footage only
// turns one way.
const KEYFRAMES: { angle: number; time: number }[] = [
  { angle: 0, time: 1.55 },   // near the top of the head -> looks straight up
  { angle: 45, time: 1.15 },  // near the ear -> looks over, head tilted up
  { angle: 135, time: 4.10 }, // near the jaw/beard -> looks over, head tilted down
  { angle: 180, time: 2.30 }, // near the neck -> looks straight down
]

function timeForAngle(angle: number): number {
  const a = Math.min(180, Math.max(0, angle))
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const cur = KEYFRAMES[i]
    const next = KEYFRAMES[i + 1]
    if (a >= cur.angle && a <= next.angle) {
      const span = next.angle - cur.angle
      const p = span === 0 ? 0 : (a - cur.angle) / span
      return cur.time + (next.time - cur.time) * p
    }
  }
  return KEYFRAMES[KEYFRAMES.length - 1].time
}

export default function App({ quality }: { quality: Quality }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = videoRef.current
    v?.pause()

    // Frame is set ONLY here, inside the event handler — no timer, no
    // animation loop anywhere in this file, so the video never advances by
    // itself between mouse moves.
    const onMove = (e: PointerEvent) => {
      const vid = videoRef.current
      if (!vid || !vid.duration || !isFinite(vid.duration)) return
      if (vid.seeking) return

      const headX = window.innerWidth * HEAD_X_RATIO
      const headY = window.innerHeight * HEAD_Y_RATIO
      const dx = e.clientX - headX
      const dy = e.clientY - headY

      // Angle from straight up (0°) through level with the head (90°) to
      // straight down (180°), regardless of which side the cursor is on.
      const angle = (Math.atan2(Math.abs(dx), -dy) * 180) / Math.PI
      const mirror = dx < 0 // cursor is left of the head -> flip the clip

      vid.currentTime = timeForAngle(angle)
      vid.style.transform = mirror ? 'scaleX(-1)' : 'none'
    }

    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
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