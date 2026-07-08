import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { diffDias, fmtDataCurta } from '../lib/dates'
import type { Obra, Rdo } from '../lib/types'

interface Props {
  userId: string
  obra: Obra
}

interface Servico {
  descricao: string
  avanco: number
  ultimaData: string
  paradoDias: number
}

function GraficoServico({ pontos }: { pontos: { data: string; avanco: number }[] }) {
  const W = 300
  const H = 110
  const P = 10
  const ts = pontos.map((p) => Date.parse(`${p.data}T12:00:00`))
  const min = ts[0]
  const max = ts[ts.length - 1]
  const x = (t: number) => (max === min ? W / 2 : P + ((t - min) / (max - min)) * (W - 2 * P))
  const y = (a: number) => H - P - (a / 100) * (H - 2 * P)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 50, 100].map((v) => (
        <line key={v} x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="var(--hairline)" strokeWidth="1" />
      ))}
      <polyline
        points={pontos.map((p, i) => `${x(ts[i])},${y(p.avanco)}`).join(' ')}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pontos.map((p, i) => (
        <circle key={i} cx={x(ts[i])} cy={y(p.avanco)} r="3.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
      ))}
    </svg>
  )
}

function Barra({ avanco, concluido }: { avanco: number; concluido?: boolean }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full"
      style={{ background: 'color-mix(in srgb, var(--accent) 16%, var(--surface))' }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.min(100, avanco)}%`,
          background: concluido ? 'color-mix(in srgb, var(--accent) 45%, var(--surface))' : 'var(--accent)',
        }}
      />
    </div>
  )
}

function DetalheServico({ arr }: { arr: { data: string; avanco: number }[] }) {
  if (arr.length === 0) return null
  const primeiro = arr[0]
  const ultimo = arr[arr.length - 1]
  const dias = diffDias(primeiro.data, ultimo.data)
  return (
    <div className="mt-2 rounded-xl border border-hairline p-3">
      <p className="mb-2 text-xs text-muted">
        de {primeiro.avanco}% a {ultimo.avanco}% · {arr.length} registro{arr.length > 1 ? 's' : ''}
        {dias > 0 ? ` · ${dias} dias corridos` : ''}
      </p>
      <GraficoServico pontos={arr} />
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{fmtDataCurta(primeiro.data)}</span>
        <span>{fmtDataCurta(ultimo.data)}</span>
      </div>
    </div>
  )
}

export default function Andamento({ userId, obra }: Props) {
  const [rdos, setRdos] = useState<Rdo[] | null>(null)
  const [erroRede, setErroRede] = useState(false)
  const [mostrarConcluidos, setMostrarConcluidos] = useState(false)
  const [servicoAberto, setServicoAberto] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('rdos')
      .select('*')
      .eq('user_id', userId)
      .eq('obra_id', obra.id)
      .order('data', { ascending: true })
    if (error) {
      setErroRede(true)
      return
    }
    setErroRede(false)
    setRdos((data as Rdo[]) ?? [])
  }, [userId, obra.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  const asc = rdos ?? []
  const historico = new Map<string, { data: string; avanco: number }[]>()
  let homemDia = 0
  for (const r of asc) {
    homemDia += r.efetivo.reduce((s, e) => s + (e.qtd || 0), 0)
    for (const s of r.servicos) {
      const k = s.descricao.trim()
      if (!k) continue
      const arr = historico.get(k) ?? []
      arr.push({ data: r.data, avanco: s.avanco })
      historico.set(k, arr)
    }
  }
  const ultimaDataObra = asc.length > 0 ? asc[asc.length - 1].data : ''
  const servicos: Servico[] = [...historico.entries()].map(([descricao, arr]) => {
    const ultimo = arr[arr.length - 1]
    let inicioEstagnado = ultimo.data
    for (let i = arr.length - 2; i >= 0 && arr[i].avanco === ultimo.avanco; i--) {
      inicioEstagnado = arr[i].data
    }
    const dias = diffDias(inicioEstagnado, ultimaDataObra)
    return {
      descricao,
      avanco: ultimo.avanco,
      ultimaData: ultimo.data,
      paradoDias: ultimo.avanco < 100 && arr.length > 1 && dias >= 5 ? dias : 0,
    }
  })
  const emAndamento = servicos.filter((s) => s.avanco < 100).sort((a, b) => b.avanco - a.avanco)
  const concluidos = servicos
    .filter((s) => s.avanco >= 100)
    .sort((a, b) => (a.ultimaData < b.ultimaData ? 1 : -1))

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Andamento</h1>
        <p className="text-sm text-ink2">{obra.nome}</p>
      </header>

      {erroRede && (
        <button
          onClick={carregar}
          className="w-full rounded-xl border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger"
        >
          Sem conexão — toque para tentar de novo
        </button>
      )}

      {rdos !== null && (
        <p className="text-sm text-muted">
          {asc.length} RDO{asc.length === 1 ? '' : 's'} · {homemDia} homem-dia acumulado
        </p>
      )}

      {rdos !== null && servicos.length === 0 && !erroRede && (
        <div className="rounded-2xl border border-hairline bg-surface p-5 text-center">
          <p className="text-sm text-ink2">
            O andamento aparece aqui conforme você lança RDOs com serviços e % de avanço.
          </p>
        </div>
      )}

      {emAndamento.length > 0 && (
        <section className="rounded-2xl border border-hairline bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold">Em andamento</h2>
          <ul className="space-y-3">
            {emAndamento.map((s) => (
              <li
                key={s.descricao}
                onClick={() => setServicoAberto(servicoAberto === s.descricao ? null : s.descricao)}
                className="cursor-pointer"
              >
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-sm text-ink2">{s.descricao}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {s.paradoDias > 0 && (
                      <span className="font-medium text-danger">sem avanço há {s.paradoDias}d · </span>
                    )}
                    {s.avanco}%
                  </span>
                </div>
                <Barra avanco={s.avanco} />
                {servicoAberto === s.descricao && <DetalheServico arr={historico.get(s.descricao) ?? []} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {concluidos.length > 0 && (
        <section>
          <button
            onClick={() => setMostrarConcluidos(!mostrarConcluidos)}
            className="flex w-full items-center justify-center gap-1 py-1 text-sm font-medium text-muted"
          >
            Concluídos ({concluidos.length})
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`h-4 w-4 transition-transform ${mostrarConcluidos ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {mostrarConcluidos && (
            <ul className="mt-2 space-y-3 rounded-2xl border border-hairline bg-surface p-4">
              {concluidos.map((s) => (
                <li
                  key={s.descricao}
                  onClick={() => setServicoAberto(servicoAberto === s.descricao ? null : s.descricao)}
                  className="cursor-pointer"
                >
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-sm text-ink2">{s.descricao}</span>
                    <span className="shrink-0 text-xs text-muted">
                      concluído em {fmtDataCurta(s.ultimaData)}
                    </span>
                  </div>
                  <Barra avanco={100} concluido />
                  {servicoAberto === s.descricao && <DetalheServico arr={historico.get(s.descricao) ?? []} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
