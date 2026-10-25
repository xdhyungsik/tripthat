import { useEffect } from 'react'
import { motion } from 'framer-motion'

// Bottom sheet on phones, centered dialog on larger screens
export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className={`relative bg-surface border border-white/[0.08] rounded-t-[28px] sm:rounded-[28px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] w-full flex flex-col max-h-[92vh] sm:max-h-[88vh] ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
      >
        <div className="sm:hidden flex justify-center pt-2.5">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>
        <div className="flex items-center justify-between px-6 pt-4 pb-3 sm:pt-5 flex-shrink-0">
          <h2 className="text-lg font-bold text-ink tracking-tight font-display">{title}</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8" aria-label="Close">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 pt-1" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
