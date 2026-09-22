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
    const offset = index * 14
    const direction = position * (index % 2 === 0 ? 1 : -1)
    const y = 30 + offset
    return {
      id: index,
      // Both ends sit well outside the viewBox so no path endpoint can create
      // a visible diagonal cutoff on wide or tall screens.
      d: `M -900 ${y} C -260 ${y - 250 * direction} 180 ${y + 240 * direction} 600 ${y} C 1020 ${y - 240 * direction} 1460 ${y + 250 * direction} 2100 ${y}`,
      duration: 16 + (index % 7) * 2,
      delay: -(index % 9) * 1.35,
      opacity: 0.24 + (index % 6) * 0.035,
    }
  })

  return (
    <div className={cn('floating-paths', className)} aria-hidden="true">
      <svg viewBox="0 0 1200 840" preserveAspectRatio="none">
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
