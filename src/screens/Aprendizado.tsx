import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fmtDataLonga, hojeISO } from '../lib/dates'
import type { Aprendizado as AprendizadoTipo, Assunto } from '../lib/types'
import Donut, { type Fatia } from '../components/Donut'

interface Props {
  userId: string
}

const DIAS_GRAFICO = 30

export default function Aprendizado({ userId }: Props) {
  const [texto, setTexto] = useState('')
  const [assuntos, setAssuntos] = useState<Assunto[]>([])
  const [assuntoSel, setAssuntoSel] = useState<string | null>(null)
  const [novoAssunto, setNovoAssunto] = useState<string | null>(null)
  const [registros, setRegistros] = useState<AprendizadoTipo[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [erroRede, setErroRede] = useState(false)

  const carregar = useCallback(async () => {
    const desde = new Date()
    desde.setDate(desde.getDate() - DIAS_GRAFICO)
    const desdeISO = desde.toISOString().slice(0, 10)
    const [a, r] = await Promise.all([
      supabase.from('assuntos').select('id, nome').eq('user_id', userId).order('nome'),
      supabase
        .from('aprendizados')
        .select('*')
        .eq('user_id', userId)
        .gte('data', desdeISO)
        .order('created_at', { ascending: false }),
    ])
    if (a.error || r.error) {
      setErroRede(true)
      return
    }
    setErroRede(false)
    setAssuntos((a.data as Assunto[]) ?? [])
    setRegistros((r.data as AprendizadoTipo[]) ?? [])
  }, [userId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function salvarRegistro(e: React.FormEvent) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    setSalvando(true)
    setErro('')
    let assuntoId = assuntoSel
    if (novoAssunto !== null && novoAssunto.trim()) {
      const { data, error } = await supabase
        .from('assuntos')
        .insert({ nome: novoAssunto.trim(), user_id: userId })
        .select('id')
        .single()
      if (error) {
        setErro('Não foi possível salvar — verifique a conexão. Seu texto continua aqui.')
        setSalvando(false)
        return
      }
      assuntoId = data?.id ?? null
    }
    const { error } = await supabase.from('aprendizados').insert({
      texto: t,
      assunto_id: assuntoId,
      data: hojeISO(),
      user_id: userId,
    })
    setSalvando(false)
    if (error) {
      // o texto fica no campo: nada se perde
      setErro('Não foi possível salvar — verifique a conexão. Seu texto continua aqui.')
      return
    }
    setTexto('')
    setNovoAssunto(null)
    carregar()
  }

  async function remover(id: string) {
    setRegistros((rs) => rs.filter((r) => r.id !== id))
    const { error } = await supabase.from('aprendizados').delete().eq('id', id)
    if (error) carregar()
  }

  const nomeAssunto = (id: string | null) =>
    id ? (assuntos.find((a) => a.id === id)?.nome ?? 'Sem assunto') : 'Sem assunto'

  const contagem = new Map<string, number>()
  for (const r of registros) {
    const nome = nomeAssunto(r.assunto_id)
    contagem.set(nome, (contagem.get(nome) ?? 0) + 1)
  }
  const fatias: Fatia[] = [...contagem.entries()].map(([nome, qtd]) => ({ nome, qtd }))

  const porDia = new Map<string, AprendizadoTipo[]>()
  for (const r of registros) {
    const lista = porDia.get(r.data) ?? []
    lista.push(r)
    porDia.set(r.data, lista)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Aprendizado</h1>

      {erroRede && (
        <button
          onClick={carregar}
          className="w-full rounded-xl border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger"
        >
          Sem conexão — toque para tentar de novo
        </button>
      )}

      <form onSubmit={salvarRegistro} className="rounded-2xl border border-hairline bg-surface p-4">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="O que você aprendeu hoje?"
          rows={3}
          className="w-full resize-none rounded-xl border border-hairline bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {assuntos.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setAssuntoSel(assuntoSel === a.id ? null : a.id)
                setNovoAssunto(null)
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                assuntoSel === a.id && novoAssunto === null
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-hairline text-ink2'
              }`}
            >
              {a.nome}
            </button>
          ))}
          {novoAssunto === null ? (
            <button
              type="button"
              onClick={() => {
                setNovoAssunto('')
                setAssuntoSel(null)
              }}
              className="rounded-full border border-dashed border-hairline px-3 py-1 text-xs font-medium text-muted"
            >
              + assunto
            </button>
          ) : (
            <input
              autoFocus
              value={novoAssunto}
              onChange={(e) => setNovoAssunto(e.target.value)}
              onBlur={() => {
                if (!novoAssunto.trim()) setNovoAssunto(null)
              }}
              placeholder="Novo assunto"
              className="w-32 rounded-full border border-accent bg-bg px-3 py-1 text-xs outline-none"
            />
          )}
        </div>
        {erro && <p className="mt-2 text-xs font-medium text-danger">{erro}</p>}
        <button
          type="submit"
          disabled={salvando || !texto.trim()}
          className="mt-3 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {salvando ? 'Salvando…' : 'Registrar'}
        </button>
      </form>

      {fatias.length > 0 && (
        <section className="rounded-2xl border border-hairline bg-surface p-4">
          <h2 className="mb-1 text-sm font-semibold">Onde você está aprendendo</h2>
          <p className="mb-4 text-xs text-muted">últimos {DIAS_GRAFICO} dias</p>
          <Donut fatias={fatias} />
        </section>
      )}

      {[...porDia.entries()].map(([dia, lista]) => (
        <section key={dia}>
          <h3 className="mb-2 px-1 text-xs font-medium text-muted">
            {dia === hojeISO() ? 'Hoje' : fmtDataLonga(dia)}
          </h3>
          <div className="space-y-2">
            {lista.map((r) => (
              <article
                key={r.id}
                className="group rounded-2xl border border-hairline bg-surface p-3.5"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-accent">
                    {nomeAssunto(r.assunto_id)}
                  </span>
                  <button
                    onClick={() => remover(r.id)}
                    aria-label="Apagar registro"
                    className="-mr-1 -mt-1 p-2 text-muted"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{r.texto}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
