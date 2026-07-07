import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Retrospectiva } from '../lib/types'
import Markdown from '../components/Markdown'

function ddmm(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default function Evolucao() {
  const [retros, setRetros] = useState<Retrospectiva[] | null>(null)

  useEffect(() => {
    supabase
      .from('retrospectivas')
      .select('*')
      .order('semana_inicio', { ascending: false })
      .order('tipo', { ascending: true })
      .then(({ data }) => setRetros((data as Retrospectiva[]) ?? []))
  }, [])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Evolução</h1>
        <p className="text-sm text-ink2">
          Toda sexta: sua evolução da semana e o resumo da obra, escritos pelo agente.
        </p>
      </header>

      {retros === null && <p className="text-sm text-muted">Carregando…</p>}

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
