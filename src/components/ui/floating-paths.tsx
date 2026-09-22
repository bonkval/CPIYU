import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type FloatingPathsBackgroundProps = {
  position?: number
  className?: string
  children?: ReactNode
}

/** A low-contrast, full-viewport motion layer that stays behind the simulator. */
export function FloatingPathsBackground({
  position = 1,
  className,
  children,
}: FloatingPathsBackgroundProps) {
  const paths = Array.from({ length: 58 }, (_, index) => {
    const offset = index * 13
    const bend = position * (index % 2 === 0 ? 1 : -1)
    return {
      id: index,
      d: `M-${260 + offset * bend} ${120 + offset} C ${220 + offset * bend} ${20 - offset} ${420 - offset * bend} ${480 + offset} ${980 + offset * bend} ${180 + offset}`,
      duration: 16 + (index % 7) * 2,
      delay: -(index % 9) * 1.35,
      opacity: 0.24 + (index % 6) * 0.035,
    }
  })

  return (
    <div className={cn('floating-paths', className)} aria-hidden="true">
      <svg viewBox="0 0 1200 800" preserveAspectRatio="none">
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            pathLength={1}
            className="floating-path"
            initial={{ pathOffset: 0, opacity: path.opacity }}
            animate={{ pathOffset: [0, 1] }}
            transition={{ duration: path.duration, delay: path.delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </svg>
      {children}
    </div>
  )
}
