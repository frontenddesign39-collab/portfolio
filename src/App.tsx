import { useEffect, useRef } from 'react'

export type Quality = 'hd' | 'sd'
export const SRC: Record<Quality, string> = { hd: '/hero-1080.mp4', sd: '/hero-720.mp4' }

// -1: the man faces toward whichever side of the screen the cursor is currently on.
// Set to 1 to reverse.
const DIRECTION = -1
// How quickly the video eases toward the mouse's current position each frame (0-1).
// Higher = snappier/more literal, lower = smoother/more lag.
const EASE = 0.18

export default function App({ quality }: { quality: Quality }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Where the video SHOULD be right now, based on the mouse's current absolute position.
  const targetTime = useRef<number | null>(null)
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    // Map the cursor's absolute x position (not movement delta) directly to a point
    // in the video, so the man always faces the direction the mouse currently is.
    const setTargetFromClientX = (clientX: number) => {
      const v = videoRef.current
      if (!v || !v.duration || !isFinite(v.duration)) return
      const ratio = Math.min(1, Math.max(0, clientX / window.innerWidth))
      const t = DIRECTION === -1 ? ratio : 1 - ratio
      targetTime.current = t * v.duration
    }

    // pointer events cover mouse, pen and touch
    const onMove = (e: PointerEvent) => setTargetFromClientX(e.clientX)

    // Continuously ease currentTime toward the target every frame, independent of
    // how often pointermove fires, so the facing direction never drifts or lags behind.
    const tick = () => {
      const v = videoRef.current
      if (v && targetTime.current !== null && !v.seeking) {
        const diff = targetTime.current - v.currentTime
        if (Math.abs(diff) > 0.004) {
          v.currentTime = v.currentTime + diff * EASE
        }
      }
      rafId.current = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove)
    rafId.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
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