import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fmtDataLonga, hojeISO } from '../lib/dates'
import type { Obra, Rdo, Tarefa } from '../lib/types'
import ProgressRing from '../components/ProgressRing'

interface Props {
  userId: string
  obra: Obra
  onObraMudou: () => void
  ehAdmin: boolean
  onAbrirAdmin: () => void
}

function progressoRdo(r: Rdo | null): { valor: number; detalhe: string } {
  if (!r) return { valor: 0, detalhe: 'não iniciado' }
  const secoes = [
    Boolean(r.clima_manha || r.clima_tarde),
    r.efetivo.length > 0,
    r.servicos.length > 0,
    Boolean(r.relato),
    Boolean(r.equipamentos || r.ocorrencias),
  ]
  const n = secoes.filter(Boolean).length
  return { valor: n / 5, detalhe: `${n} de 5 seções` }
}

export default function Hoje({ userId, obra, onObraMudou, ehAdmin, onAbrirAdmin }: Props) {
  const hoje = hojeISO()
  const [rdo, setRdo] = useState<Rdo | null>(null)
  const [qtdAprendizados, setQtdAprendizados] = useState(0)
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [novaTarefa, setNovaTarefa] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)
  const [nomeNovaObra, setNomeNovaObra] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const [r, a, t] = await Promise.all([
      supabase.from('rdos').select('*').eq('obra_id', obra.id).eq('data', hoje).maybeSingle(),
      supabase.from('aprendizados').select('id').eq('data', hoje),
      supabase.from('tarefas').select('*').eq('data', hoje).order('created_at'),
    ])
    setRdo(r.data as Rdo | null)
    setQtdAprendizados(a.data?.length ?? 0)
    setTarefas((t.data as Tarefa[]) ?? [])
  }, [obra.id, hoje])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function adicionarTarefa(e: React.FormEvent) {
    e.preventDefault()
    const titulo = novaTarefa.trim()
    if (!titulo) return
    setNovaTarefa('')
    await supabase.from('tarefas').insert({ titulo, data: hoje, user_id: userId })
    carregar()
  }

  async function alternarTarefa(t: Tarefa) {
    setTarefas((ts) => ts.map((x) => (x.id === t.id ? { ...x, concluida: !x.concluida } : x)))
    await supabase.from('tarefas').update({ concluida: !t.concluida }).eq('id', t.id)
  }

  async function removerTarefa(id: string) {
    setTarefas((ts) => ts.filter((x) => x.id !== id))
    await supabase.from('tarefas').delete().eq('id', id)
  }

  async function criarNovaObra(e: React.FormEvent) {
    e.preventDefault()
    const nome = (nomeNovaObra ?? '').trim()
    if (!nome) return
    await supabase.from('obras').update({ ativa: false }).eq('id', obra.id)
    await supabase.from('obras').insert({ nome, user_id: userId })
    setNomeNovaObra(null)
    onObraMudou()
  }

  const concluidas = tarefas.filter((t) => t.concluida).length
  const rdoInfo = progressoRdo(rdo)

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{fmtDataLonga(hoje)}</h1>
          <p className="text-sm text-ink2">{obra.nome}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Menu"
            className="rounded-full p-2 text-muted"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </button>
          {menuAberto && (
            <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-hairline bg-surface py-1 shadow-sm">
              {ehAdmin && (
                <button
                  onClick={() => {
                    setMenuAberto(false)
                    onAbrirAdmin()
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm"
                >
                  Administração
                </button>
              )}
              <button
                onClick={() => {
                  setMenuAberto(false)
                  setNomeNovaObra('')
                }}
                className="block w-full px-4 py-2.5 text-left text-sm"
              >
                Mudar de obra
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="block w-full px-4 py-2.5 text-left text-sm text-danger"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {nomeNovaObra !== null && (
        <form
          onSubmit={criarNovaObra}
          className="space-y-3 rounded-2xl border border-hairline bg-surface p-4"
        >
          <p className="text-sm text-ink2">
            A obra atual será arquivada (o histórico fica guardado). Qual o nome da nova obra?
          </p>
          <input
            autoFocus
            required
            value={nomeNovaObra}
            onChange={(e) => setNomeNovaObra(e.target.value)}
            placeholder="Nome da nova obra"
            className="w-full rounded-xl border border-hairline bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNomeNovaObra(null)}
              className="flex-1 rounded-xl border border-hairline py-2.5 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white"
            >
              Trocar
            </button>
          </div>
        </form>
      )}

      <section className="rounded-2xl border border-hairline bg-surface p-4">
        <div className="flex justify-around">
          <ProgressRing valor={rdoInfo.valor} cor="var(--ring-rdo)" rotulo="RDO" detalhe={rdoInfo.detalhe} />
          <ProgressRing
            valor={qtdAprendizados > 0 ? 1 : 0}
            cor="var(--ring-apr)"
            rotulo="Aprendizado"
            detalhe={
              qtdAprendizados === 0
                ? 'nada ainda'
                : `${qtdAprendizados} registro${qtdAprendizados > 1 ? 's' : ''}`
            }
          />
          <ProgressRing
            valor={tarefas.length === 0 ? 0 : concluidas / tarefas.length}
            cor="var(--ring-tar)"
            rotulo="Tarefas"
            detalhe={tarefas.length === 0 ? 'sem tarefas' : `${concluidas} de ${tarefas.length}`}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold">Tarefas do dia</h2>
        <ul className="space-y-1">
          {tarefas.map((t) => (
            <li key={t.id} className="group flex items-center gap-3 py-1.5">
              <button
                onClick={() => alternarTarefa(t)}
                aria-label={t.concluida ? 'Desmarcar' : 'Concluir'}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  t.concluida ? 'border-accent bg-accent text-white' : 'border-muted'
                }`}
              >
                {t.concluida && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${t.concluida ? 'text-muted line-through' : ''}`}>
                {t.titulo}
              </span>
              <button
                onClick={() => removerTarefa(t.id)}
                aria-label="Remover tarefa"
                className="-mr-1 p-2 text-muted"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={adicionarTarefa} className="mt-2 flex gap-2">
          <input
            value={novaTarefa}
            onChange={(e) => setNovaTarefa(e.target.value)}
            placeholder="Nova tarefa…"
            className="flex-1 rounded-xl border border-hairline bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            aria-label="Adicionar tarefa"
            className="rounded-xl bg-accent px-4 text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      </section>
    </div>
  )
}
