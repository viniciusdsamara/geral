import { useState } from 'react'

export interface Fatia {
  nome: string
  qtd: number
}

// Ordem fixa dos tons categóricos (nunca reciclada); além de 8, agrupa em "Outros"
const CORES = [
  'var(--s1)',
  'var(--s2)',
  'var(--s3)',
  'var(--s4)',
  'var(--s5)',
  'var(--s6)',
  'var(--s7)',
  'var(--s8)',
]

const TAM = 176
const ESPESSURA = 26
const R = (TAM - ESPESSURA) / 2
const CX = TAM / 2
const CY = TAM / 2

function arco(a0: number, a1: number): string {
  const p = (a: number) => [CX + R * Math.cos(a), CY + R * Math.sin(a)]
  const [x0, y0] = p(a0)
  const [x1, y1] = p(a1)
  const grande = a1 - a0 > Math.PI ? 1 : 0
  return `M ${x0} ${y0} A ${R} ${R} 0 ${grande} 1 ${x1} ${y1}`
}

export default function Donut({ fatias }: { fatias: Fatia[] }) {
  const [ativa, setAtiva] = useState<number | null>(null)

  const ordenadas = [...fatias].sort((a, b) => b.qtd - a.qtd)
  const visiveis = ordenadas.slice(0, 7)
  const resto = ordenadas.slice(7)
  const dados =
    resto.length > 0
      ? [...visiveis, { nome: 'Outros', qtd: resto.reduce((s, f) => s + f.qtd, 0) }]
      : visiveis
  const total = dados.reduce((s, f) => s + f.qtd, 0)

  if (total === 0) return null

  // Vão de 2px na cor da superfície entre segmentos adjacentes
  const vao = dados.length > 1 ? 2 / R : 0
  let angulo = -Math.PI / 2
  const segmentos = dados.map((f, i) => {
    const varredura = (f.qtd / total) * 2 * Math.PI
    const seg = {
      ...f,
      cor: f.nome === 'Outros' ? 'var(--muted)' : CORES[i],
      d: arco(angulo + vao / 2, Math.max(angulo + vao / 2 + 0.001, angulo + varredura - vao / 2)),
      pct: Math.round((f.qtd / total) * 100),
    }
    angulo += varredura
    return seg
  })

  const foco = ativa !== null ? segmentos[ativa] : null

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="relative shrink-0" style={{ width: TAM, height: TAM }}>
        <svg width={TAM} height={TAM}>
          {segmentos.map((s, i) => (
            <path
              key={s.nome}
              d={s.d}
              fill="none"
              stroke={s.cor}
              strokeWidth={ativa === i ? ESPESSURA + 4 : ESPESSURA}
              style={{ transition: 'stroke-width 150ms ease', cursor: 'pointer' }}
              onMouseEnter={() => setAtiva(i)}
              onMouseLeave={() => setAtiva(null)}
              onClick={() => setAtiva(ativa === i ? null : i)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {foco ? (
            <>
              <span className="text-lg font-semibold text-ink">{foco.pct}%</span>
              <span className="max-w-[90px] truncate text-[11px] text-ink2">{foco.nome}</span>
            </>
          ) : (
            <>
              <span className="text-lg font-semibold text-ink">{total}</span>
              <span className="text-[11px] text-ink2">registros</span>
            </>
          )}
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {segmentos.map((s, i) => (
          <li
            key={s.nome}
            className="flex cursor-pointer items-center gap-2 text-sm"
            onMouseEnter={() => setAtiva(i)}
            onMouseLeave={() => setAtiva(null)}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.cor }}
            />
            <span className="flex-1 truncate text-ink2">{s.nome}</span>
            <span className="tabular-nums text-muted">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
