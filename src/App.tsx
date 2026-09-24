import { useEffect, useRef } from 'react'

export type Quality = 'hd' | 'sd'
export const SRC: Record<Quality, string> = { hd: '/hero-1080.mp4', sd: '/hero-720.mp4' }

const SENSITIVITY = 0.8
// -1: the man turns the same way the cursor/finger moves. Set to 1 to reverse.
const DIRECTION = -1

export default function App({ quality }: { quality: Quality }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const targetTime = useRef(0)
  const prevX = useRef<number | null>(null)

  useEffect(() => {
    // pointer events cover mouse, pen and touch drag
    const onMove = (e: PointerEvent) => {
      const v = videoRef.current
      if (!v || !v.duration || !isFinite(v.duration)) return
      if (prevX.current === null) { prevX.current = e.clientX; return }
      const delta = e.clientX - prevX.current
      prevX.current = e.clientX
      targetTime.current = Math.min(
        v.duration,
        Math.max(0, targetTime.current + DIRECTION * (delta / window.innerWidth) * SENSITIVITY * v.duration)
      )
      if (!v.seeking) v.currentTime = targetTime.current
    }
    const reset = () => { prevX.current = null }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', reset)
    window.addEventListener('pointercancel', reset)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', reset)
      window.removeEventListener('pointercancel', reset)
    }
  }, [])

  const onSeeked = () => {
    const v = videoRef.current
    if (v && Math.abs(v.currentTime - targetTime.current) > 0.01) v.currentTime = targetTime.current
  }

  return (
    <video
      ref={videoRef}
      src={SRC[quality]}
      poster="/poster.jpg"
      muted
      playsInline
      preload="auto"
      onSeeked={onSeeked}
      className="fixed inset-0 w-full h-full object-cover object-[60%_center] md:object-[70%_center]"
      style={{ height: '100dvh' }}
    />
  )
}
