import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from its previous value to `target` with an ease-out curve.
 * Respects prefers-reduced-motion (jumps straight to the value).
 */
export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const from = fromRef.current
    if (reduced || from === target) {
      setValue(target)
      fromRef.current = target
      return
    }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
