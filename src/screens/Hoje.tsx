import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { addDias, diffDias, fmtDataLonga, hojeISO } from '../lib/dates'
import type { Obra, Rdo, Tarefa } from '../lib/types'
import ProgressRing from '../components/ProgressRing'
import { exportarDados } from '../lib/exportar'

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
  const [erroRede, setErroRede] = useState(false)
  const [avisos, setAvisos] = useState<string[]>([])

  const carregar = useCallback(async () => {
    // Tarefas não concluídas de dias anteriores rolam para hoje
    await supabase
      .from('tarefas')
      .update({ data: hoje })
      .eq('user_id', userId)
      .eq('concluida', false)
      .lt('data', hoje)
    const [r, a, t] = await Promise.all([
      supabase
        .from('rdos')
        .select('*')
        .eq('user_id', userId)
        .eq('obra_id', obra.id)
        .eq('data', hoje)
        .maybeSingle(),
      supabase.from('aprendizados').select('id').eq('user_id', userId).eq('data', hoje),
      supabase.from('tarefas').select('*').eq('user_id', userId).eq('data', hoje).order('created_at'),
    ])
    if (r.error || a.error || t.error) {
      setErroRede(true)
      return
    }
    setErroRede(false)
    setRdo(r.data as Rdo | null)
    setQtdAprendizados(a.data?.length ?? 0)
    setTarefas((t.data as Tarefa[]) ?? [])

    // Avisos discretos: só informação, sem cobrança
    const { data: todos } = await supabase
      .from('rdos')
      .select('data, servicos')
      .eq('user_id', userId)
      .eq('obra_id', obra.id)
      .order('data')
    const novos: string[] = []
    if (todos && todos.length > 0) {
      const ontem = addDias(hoje, -1)
      const ontemFoiDomingo = new Date(`${ontem}T12:00:00`).getDay() === 0
      const temOntem = todos.some((x) => x.data === ontem)
      const temAnteriores = todos.some((x) => x.data < ontem)
      if (!ontemFoiDomingo && !temOntem && temAnteriores) {
        novos.push('O RDO de ontem ficou em branco — dá para lançar retroativo na aba RDO.')
      }
      const historico = new Map<string, { data: string; avanco: number }[]>()
      for (const x of todos) {
        for (const s of x.servicos as { descricao: string; avanco: number }[]) {
          const k = s.descricao.trim()
          if (!k) continue
          const arr = historico.get(k) ?? []
          arr.push({ data: x.data, avanco: s.avanco })
          historico.set(k, arr)
        }
      }
      const ultimaData = todos[todos.length - 1].data
      let parados = 0
      for (const arr of historico.values()) {
        const ultimo = arr[arr.length - 1]
        if (ultimo.avanco >= 100 || arr.length < 2) continue
        let inicio = ultimo.data
        for (let i = arr.length - 2; i >= 0 && arr[i].avanco === ultimo.avanco; i--) inicio = arr[i].data
        if (diffDias(inicio, ultimaData) >= 5) parados++
      }
      if (parados > 0) {
        novos.push(
          parados === 1
            ? '1 serviço está sem avanço há mais de 5 dias — veja na aba Obra.'
            : `${parados} serviços estão sem avanço há mais de 5 dias — veja na aba Obra.`,
        )
      }
    }
    setAvisos(novos.filter((a) => !sessionStorage.getItem(`aviso-${hoje}-${a}`)))
  }, [userId, obra.id, hoje])

  function dispensarAviso(a: string) {
    sessionStorage.setItem(`aviso-${hoje}-${a}`, '1')
    setAvisos((av) => av.filter((x) => x !== a))
  }

  useEffect(() => {
    carregar()
  }, [carregar])

  async function adicionarTarefa(e: React.FormEvent) {
    e.preventDefault()
    const titulo = novaTarefa.trim()
    if (!titulo) return
    setNovaTarefa('')
    const { error } = await supabase.from('tarefas').insert({ titulo, data: hoje, user_id: userId })
    if (error) {
      // devolve o texto para o campo: nada digitado se perde
      setNovaTarefa(titulo)
      setErroRede(true)
      return
    }
    carregar()
  }

  async function alternarTarefa(t: Tarefa) {
    setTarefas((ts) => ts.map((x) => (x.id === t.id ? { ...x, concluida: !x.concluida } : x)))
    const { error } = await supabase.from('tarefas').update({ concluida: !t.concluida }).eq('id', t.id)
    if (error) carregar()
  }

  async function removerTarefa(id: string) {
    setTarefas((ts) => ts.filter((x) => x.id !== id))
    const { error } = await supabase.from('tarefas').delete().eq('id', id)
    if (error) carregar()
  }

  async function criarNovaObra(e: React.FormEvent) {
    e.preventDefault()
    const nome = (nomeNovaObra ?? '').trim()
    if (!nome) return
    // Cria a nova primeiro; se falhar, a obra atual segue intacta.
    const { error } = await supabase.from('obras').insert({ nome, user_id: userId })
    if (error) {
      setErroRede(true)
      return
    }
    await supabase.from('obras').update({ ativa: false }).eq('id', obra.id)
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
                onClick={async () => {
                  setMenuAberto(false)
                  const ok = await exportarDados(userId)
                  if (!ok) setErroRede(true)
                }}
                className="block w-full px-4 py-2.5 text-left text-sm"
              >
                Exportar dados (CSV)
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

      {erroRede && (
        <button
          onClick={carregar}
          className="w-full rounded-xl border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger"
        >
          Sem conexão — toque para tentar de novo
        </button>
      )}

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

      {avisos.map((a) => (
        <div
          key={a}
          className="flex items-start gap-2 rounded-xl border border-hairline bg-surface px-3 py-2.5"
        >
          <p className="flex-1 text-xs leading-relaxed text-ink2">{a}</p>
          <button
            onClick={() => dispensarAviso(a)}
            aria-label="Dispensar aviso"
            className="-mr-1 -mt-0.5 p-1 text-muted"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}

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
