// Shared icon set — stroke icons sized by className, plus a filled plane glyph

function Stroke({ className = 'w-4 h-4', strokeWidth = 2, children }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

// Material "flight" glyph, pointing up; rotate with style/transform as needed
export function Plane({ className = 'w-4 h-4', style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  )
}

export const ChevronLeft = p => <Stroke {...p}><path d="M15 18l-6-6 6-6" /></Stroke>
export const ChevronRight = p => <Stroke {...p}><path d="M9 18l6-6-6-6" /></Stroke>
export const Plus = p => <Stroke {...p}><path d="M12 5v14M5 12h14" /></Stroke>
export const Pencil = p => <Stroke {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></Stroke>
export const Trash = p => <Stroke {...p}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" /></Stroke>
export const Share = p => <Stroke {...p}><path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" /><path d="M16 6l-4-4-4 4M12 2v13" /></Stroke>
export const Users = p => <Stroke {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></Stroke>
export const Calendar = p => <Stroke {...p}><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></Stroke>
export const MapPin = p => <Stroke {...p}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></Stroke>
export const Bed = p => <Stroke {...p}><path d="M2 4v16M2 8h18a2 2 0 012 2v10M2 17h20M6 8v9" /></Stroke>
export const Upload = p => <Stroke {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></Stroke>
export const Check = p => <Stroke {...p}><path d="M20 6L9 17l-5-5" /></Stroke>
export const Copy = p => <Stroke {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></Stroke>
export const Globe = p => <Stroke {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></Stroke>
export const Clock = p => <Stroke {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Stroke>
export const Ticket = p => <Stroke {...p}><path d="M3 9a3 3 0 000 6v3a2 2 0 002 2h14a2 2 0 002-2v-3a3 3 0 010-6V6a2 2 0 00-2-2H5a2 2 0 00-2 2v3z" /><path d="M13 4v16" strokeDasharray="2 3" /></Stroke>
export const Route = p => <Stroke {...p}><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15" /><circle cx="18" cy="5" r="3" /></Stroke>
export const List = p => <Stroke {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></Stroke>
export const Sparkle = p => <Stroke {...p}><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" /></Stroke>
export const Download = p => <Stroke {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></Stroke>
