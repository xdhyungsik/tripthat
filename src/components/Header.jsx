export default function Header({ onHome, currentTrip }) {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
      <div className="px-5 h-14 flex items-center gap-3">
        <button onClick={onHome} className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-[15px]">TripThat</span>
        </button>

        {currentTrip && (
          <>
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm text-slate-600 font-medium truncate">{currentTrip.name}</span>
          </>
        )}

        {currentTrip && (
          <button onClick={onHome} className="ml-auto btn-ghost text-xs py-1.5">
            All Trips
          </button>
        )}
      </div>
    </header>
  )
}
