import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Retrospectiva } from '../lib/types'
import Markdown from '../components/Markdown'

function ddmm(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

interface MesClima {
  mes: string
  impraticaveis: number
  rdos: number
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export default function Evolucao({ userId }: { userId: string }) {
  const [retros, setRetros] = useState<Retrospectiva[] | null>(null)
  const [clima, setClima] = useState<MesClima[]>([])
  const [erroRede, setErroRede] = useState(false)

  const carregar = useCallback(async () => {
    const desde = new Date()
    desde.setDate(desde.getDate() - 90)
    const desdeISO = desde.toISOString().slice(0, 10)
    const [r, c] = await Promise.all([
      supabase
        .from('retrospectivas')
        .select('*')
        .eq('user_id', userId)
        .order('semana_inicio', { ascending: false })
        .order('tipo', { ascending: true }),
      supabase
        .from('rdos')
        .select('data, praticavel_manha, praticavel_tarde')
        .eq('user_id', userId)
        .gte('data', desdeISO),
    ])
    if (r.error || c.error) {
      setErroRede(true)
      return
    }
    setErroRede(false)
    setRetros((r.data as Retrospectiva[]) ?? [])

    const porMes = new Map<string, { impraticaveis: number; rdos: number }>()
    for (const rdo of c.data ?? []) {
      const chave = rdo.data.slice(0, 7)
      const m = porMes.get(chave) ?? { impraticaveis: 0, rdos: 0 }
      m.rdos++
      if (!rdo.praticavel_manha || !rdo.praticavel_tarde) m.impraticaveis++
      porMes.set(chave, m)
    }
    setClima(
      [...porMes.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([mes, v]) => ({ mes, ...v })),
    )
  }, [userId])

  useEffect(() => {
    carregar()
  }, [carregar])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Evolução</h1>
        <p className="text-sm text-ink2">
          Toda sexta: sua evolução da semana e o resumo da obra, escritos pelo agente.
        </p>
      </header>

      {erroRede && (
        <button
          onClick={carregar}
          className="w-full rounded-xl border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger"
        >
          Sem conexão — toque para tentar de novo
        </button>
      )}

      {retros === null && !erroRede && <p className="text-sm text-muted">Carregando…</p>}

      {clima.length > 0 && (
        <section className="rounded-2xl border border-hairline bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold">Dias impraticáveis</h2>
          <ul className="space-y-1">
            {clima.map((m) => (
              <li key={m.mes} className="flex items-baseline justify-between text-sm">
                <span className="text-ink2">
                  {MESES[Number(m.mes.slice(5, 7)) - 1]}/{m.mes.slice(0, 4)}
                </span>
                <span className={m.impraticaveis > 0 ? 'font-medium text-danger' : 'text-muted'}>
                  {m.impraticaveis === 0
                    ? 'nenhum'
                    : `${m.impraticaveis} dia${m.impraticaveis > 1 ? 's' : ''}`}
                  <span className="text-muted"> · {m.rdos} RDO{m.rdos > 1 ? 's' : ''}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {retros !== null && retros.length === 0 && (
        <div className="rounded-2xl border border-hairline bg-surface p-5 text-center">
          <p className="text-sm text-ink2">
            A primeira retrospectiva será escrita na sexta-feira, analisando os registros da semana.
          </p>
          <p className="mt-1 text-sm text-muted">
            Até lá, continue registrando seus aprendizados e RDOs — quanto mais material, melhor a análise.
          </p>
        </div>
      )}

      {retros?.map((r) => (
        <article key={r.id} className="rounded-2xl border border-hairline bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-accent">
              Semana de {ddmm(r.semana_inicio)} a {ddmm(r.semana_fim)}
            </h2>
            <span className="rounded-full border border-hairline px-2.5 py-0.5 text-[11px] font-medium text-ink2">
              {r.tipo === 'resumo' ? 'Resumo da obra' : 'Evolução'}
            </span>
          </div>
          <Markdown md={r.conteudo_md} />
        </article>
      ))}
    </div>
  )
}
