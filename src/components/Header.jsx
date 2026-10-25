import { ChevronLeft, Plane } from './icons'

export function LogoMark({ size = 'w-8 h-8' }) {
  return (
    <div className={`${size} rounded-[10px] bg-gradient-to-br from-[#5B95FF] to-[#3358E0] flex items-center justify-center shadow-[0_4px_14px_-4px_rgba(79,140,255,0.7)]`}>
      <Plane className="w-[18px] h-[18px] text-white rotate-45" />
    </div>
  )
}

export default function Header({ onHome, currentTrip }) {
  return (
    <header className="sticky top-0 z-[1100] pt-safe bg-bg/70 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.06] no-print">
      <div className="relative h-14 px-4 sm:px-6 flex items-center gap-3">
        {currentTrip ? (
          <>
            <button
              onClick={onHome}
              className="flex items-center gap-0.5 -ml-1.5 pr-2 py-1.5 rounded-xl text-accent hover:text-accent-soft transition-colors active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2.4} />
              <span className="text-[15px] font-medium">Trips</span>
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold text-ink truncate max-w-[50vw] font-display">
              {currentTrip.name}
            </span>
          </>
        ) : (
          <button onClick={onHome} className="flex items-center gap-2.5 active:scale-95 transition-transform">
            <LogoMark />
            <span className="font-bold text-ink tracking-tight text-[17px] font-display">TripThat</span>
          </button>
        )}
      </div>
    </header>
  )
}
