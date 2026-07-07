export type Aba = 'hoje' | 'rdo' | 'aprendizado'

const ABAS: { id: Aba; rotulo: string; icone: React.ReactNode }[] = [
  {
    id: 'hoje',
    rotulo: 'Hoje',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    id: 'rdo',
    rotulo: 'RDO',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3" />
      </svg>
    ),
  },
  {
    id: 'aprendizado',
    rotulo: 'Aprendizado',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" />
        <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
      </svg>
    ),
  },
]

export default function TabBar({ aba, onMudar }: { aba: Aba; onMudar: (a: Aba) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => onMudar(a.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              aba === a.id ? 'text-accent' : 'text-muted'
            }`}
          >
            {a.icone}
            {a.rotulo}
          </button>
        ))}
      </div>
    </nav>
  )
}
