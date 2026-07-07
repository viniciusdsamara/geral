interface Props {
  valor: number // 0–1
  cor: string // variável CSS, ex.: 'var(--ring-rdo)'
  rotulo: string
  detalhe?: string
}

const TAM = 88
const ESPESSURA = 9
const R = (TAM - ESPESSURA) / 2
const CIRC = 2 * Math.PI * R

export default function ProgressRing({ valor, cor, rotulo, detalhe }: Props) {
  const v = Math.max(0, Math.min(1, valor))
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: TAM, height: TAM }}>
        <svg width={TAM} height={TAM} className="-rotate-90">
          <circle
            cx={TAM / 2}
            cy={TAM / 2}
            r={R}
            fill="none"
            stroke={`color-mix(in srgb, ${cor} 16%, var(--surface))`}
            strokeWidth={ESPESSURA}
          />
          <circle
            cx={TAM / 2}
            cy={TAM / 2}
            r={R}
            fill="none"
            stroke={cor}
            strokeWidth={ESPESSURA}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - v)}
            style={{ transition: 'stroke-dashoffset 500ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-ink">{Math.round(v * 100)}%</span>
        </div>
      </div>
      <div className="text-center leading-tight">
        <div className="text-xs font-medium text-ink2">{rotulo}</div>
        {detalhe && <div className="text-[11px] text-muted">{detalhe}</div>}
      </div>
    </div>
  )
}
