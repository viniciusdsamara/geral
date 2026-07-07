import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fmtDataCurta, hojeISO } from '../lib/dates'
import type { EfetivoItem, Obra, Rdo as RdoTipo, RdoFoto, ServicoItem } from '../lib/types'

interface Props {
  userId: string
  obra: Obra
}

const CLIMAS = ['Ensolarado', 'Nublado', 'Chuvoso'] as const

interface FotoComUrl extends RdoFoto {
  url: string
}

export default function Rdo({ userId, obra }: Props) {
  const [modo, setModo] = useState<'lista' | 'form'>('lista')
  const [lista, setLista] = useState<RdoTipo[]>([])
  const [data, setData] = useState(hojeISO())
  const [rdoId, setRdoId] = useState<string | null>(null)
  const [climaManha, setClimaManha] = useState<string | null>(null)
  const [climaTarde, setClimaTarde] = useState<string | null>(null)
  const [praticavelManha, setPraticavelManha] = useState(true)
  const [praticavelTarde, setPraticavelTarde] = useState(true)
  const [efetivo, setEfetivo] = useState<EfetivoItem[]>([])
  const [servicos, setServicos] = useState<ServicoItem[]>([])
  const [equipamentos, setEquipamentos] = useState('')
  const [ocorrencias, setOcorrencias] = useState('')
  const [fotos, setFotos] = useState<FotoComUrl[]>([])
  const [sujo, setSujo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galeriaRef = useRef<HTMLInputElement>(null)

  const carregarFotos = useCallback(async (id: string) => {
    const { data: rows } = await supabase
      .from('rdo_fotos')
      .select('*')
      .eq('rdo_id', id)
      .order('created_at')
    const lista = (rows as RdoFoto[]) ?? []
    if (lista.length === 0) {
      setFotos([])
      return
    }
    const { data: assinadas } = await supabase.storage
      .from('rdo-fotos')
      .createSignedUrls(lista.map((f) => f.path), 3600)
    setFotos(
      lista.map((f, i) => ({ ...f, url: assinadas?.[i]?.signedUrl ?? '' })),
    )
  }, [])

  const carregar = useCallback(async () => {
    const { data: r } = await supabase
      .from('rdos')
      .select('*')
      .eq('obra_id', obra.id)
      .eq('data', data)
      .maybeSingle()
    const rdo = r as RdoTipo | null
    setRdoId(rdo?.id ?? null)
    setClimaManha(rdo?.clima_manha ?? null)
    setClimaTarde(rdo?.clima_tarde ?? null)
    setPraticavelManha(rdo?.praticavel_manha ?? true)
    setPraticavelTarde(rdo?.praticavel_tarde ?? true)
    setEfetivo(rdo?.efetivo ?? [])
    setServicos(rdo?.servicos ?? [])
    setEquipamentos(rdo?.equipamentos ?? '')
    setOcorrencias(rdo?.ocorrencias ?? '')
    setSujo(false)
    if (rdo) carregarFotos(rdo.id)
    else setFotos([])
  }, [obra.id, data, carregarFotos])

  useEffect(() => {
    carregar()
  }, [carregar])

  const carregarLista = useCallback(async () => {
    const { data: rows } = await supabase
      .from('rdos')
      .select('*')
      .eq('obra_id', obra.id)
      .order('data', { ascending: false })
    setLista((rows as RdoTipo[]) ?? [])
  }, [obra.id])

  useEffect(() => {
    carregarLista()
  }, [carregarLista])

  // Salvamento automático: 1s depois da última alteração
  useEffect(() => {
    if (!sujo) return
    const timer = setTimeout(() => {
      salvar()
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sujo, climaManha, climaTarde, praticavelManha, praticavelTarde, efetivo, servicos, equipamentos, ocorrencias])

  function marcar<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setSujo(true)
    }
  }

  async function salvar(): Promise<string | null> {
    setSalvando(true)
    const { data: salvo, error } = await supabase
      .from('rdos')
      .upsert(
        {
          user_id: userId,
          obra_id: obra.id,
          data,
          clima_manha: climaManha,
          clima_tarde: climaTarde,
          praticavel_manha: praticavelManha,
          praticavel_tarde: praticavelTarde,
          efetivo,
          servicos,
          equipamentos: equipamentos || null,
          ocorrencias: ocorrencias || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'obra_id,data' },
      )
      .select('id')
      .single()
    setSalvando(false)
    if (error) return null
    setRdoId(salvo.id)
    setSujo(false)
    return salvo.id
  }

  async function adicionarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (arquivos.length === 0) return
    setEnviandoFoto(true)
    const id = rdoId ?? (await salvar())
    if (!id) {
      setEnviandoFoto(false)
      return
    }
    for (const arquivo of arquivos) {
      const ext = arquivo.name.split('.').pop() || 'jpg'
      const path = `${userId}/${id}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('rdo-fotos').upload(path, arquivo)
      if (!error) {
        await supabase.from('rdo_fotos').insert({ user_id: userId, rdo_id: id, path })
      }
    }
    await carregarFotos(id)
    setEnviandoFoto(false)
  }

  async function removerFoto(f: FotoComUrl) {
    setFotos((fs) => fs.filter((x) => x.id !== f.id))
    await supabase.from('rdo_fotos').delete().eq('id', f.id)
    await supabase.storage.from('rdo-fotos').remove([f.path])
  }

  const hoje = hojeISO()

  function abrir(dia: string) {
    setData(dia)
    setModo('form')
  }

  async function voltarParaLista() {
    if (sujo) await salvar()
    await carregarLista()
    setModo('lista')
  }

  async function salvarEVoltar() {
    const id = await salvar()
    if (id) {
      await carregarLista()
      setModo('lista')
    }
  }

  if (modo === 'lista') {
    const temHoje = lista.some((r) => r.data === hoje)
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-xl font-semibold">RDO</h1>
          <p className="text-sm text-ink2">{obra.nome}</p>
        </header>

        {!temHoje && (
          <button
            onClick={() => abrir(hoje)}
            className="w-full rounded-2xl bg-accent py-3.5 text-sm font-semibold text-white"
          >
            Começar o RDO de hoje
          </button>
        )}

        {lista.length === 0 && (
          <p className="pt-2 text-center text-sm text-muted">
            Os RDOs salvos aparecem aqui, um por dia.
          </p>
        )}

        <div className="space-y-2">
          {lista.map((r) => {
            const pessoas = r.efetivo.reduce((s, e) => s + (e.qtd || 0), 0)
            const partes = [
              `${r.servicos.length} serviço${r.servicos.length === 1 ? '' : 's'}`,
              pessoas > 0 ? `${pessoas} no efetivo` : null,
              r.ocorrencias ? 'ocorrências' : null,
            ].filter(Boolean)
            return (
              <button
                key={r.id}
                onClick={() => abrir(r.data)}
                className="w-full rounded-2xl border border-hairline bg-surface p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {r.data === hoje ? 'Hoje' : fmtDataCurta(r.data)}
                  </span>
                  {(!r.praticavel_manha || !r.praticavel_tarde) && (
                    <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
                      impraticável
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted">{partes.join(' · ')}</p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={voltarParaLista}
            aria-label="Voltar"
            className="-ml-2 rounded-lg p-2 text-muted"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">
            {data === hoje ? 'RDO de hoje' : `RDO · ${fmtDataCurta(data)}`}
          </h1>
        </div>
        <span className="text-xs text-muted">
          {salvando || sujo ? 'salvando…' : rdoId ? 'salvo ✓' : ''}
        </span>
      </header>

      <section className="rounded-2xl border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold">Clima</h2>
        {(
          [
            ['Manhã', climaManha, marcar(setClimaManha), praticavelManha, marcar(setPraticavelManha)],
            ['Tarde', climaTarde, marcar(setClimaTarde), praticavelTarde, marcar(setPraticavelTarde)],
          ] as const
        ).map(([rotulo, clima, setClima, praticavel, setPraticavel]) => (
          <div key={rotulo} className="mb-3 last:mb-0">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-ink2">{rotulo}</span>
              <button
                onClick={() => setPraticavel(!praticavel)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  praticavel
                    ? 'bg-accent/10 text-accent'
                    : 'bg-danger/10 text-danger'
                }`}
              >
                {praticavel ? 'Praticável' : 'Impraticável'}
              </button>
            </div>
            <div className="flex gap-2">
              {CLIMAS.map((c) => (
                <button
                  key={c}
                  onClick={() => setClima(clima === c ? null : c)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                    clima === c
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-hairline text-ink2'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold">Efetivo</h2>
        <div className="space-y-2">
          {efetivo.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={item.funcao}
                onChange={(e) =>
                  marcar(setEfetivo)(efetivo.map((x, j) => (j === i ? { ...x, funcao: e.target.value } : x)))
                }
                placeholder="Função (ex.: Pedreiro)"
                className="min-w-0 flex-1 rounded-xl border border-hairline bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <input
                type="number"
                min={0}
                value={item.qtd || ''}
                onChange={(e) =>
                  marcar(setEfetivo)(efetivo.map((x, j) => (j === i ? { ...x, qtd: Number(e.target.value) } : x)))
                }
                placeholder="Qtd"
                className="w-16 rounded-xl border border-hairline bg-bg px-2 py-2 text-center text-sm outline-none focus:border-accent"
              />
              <button
                onClick={() => marcar(setEfetivo)(efetivo.filter((_, j) => j !== i))}
                aria-label="Remover"
                className="p-1 text-muted"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => marcar(setEfetivo)([...efetivo, { funcao: '', qtd: 1 }])}
          className="mt-2 text-sm font-medium text-accent"
        >
          + Adicionar função
        </button>
      </section>

      <section className="rounded-2xl border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold">Serviços executados</h2>
        <div className="space-y-2">
          {servicos.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={s.descricao}
                onChange={(e) =>
                  marcar(setServicos)(servicos.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)))
                }
                placeholder="Serviço (ex.: Alvenaria 2º pav.)"
                className="min-w-0 flex-1 rounded-xl border border-hairline bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={s.avanco || ''}
                  onChange={(e) =>
                    marcar(setServicos)(
                      servicos.map((x, j) =>
                        j === i ? { ...x, avanco: Math.min(100, Number(e.target.value)) } : x,
                      ),
                    )
                  }
                  placeholder="0"
                  className="w-14 rounded-xl border border-hairline bg-bg px-2 py-2 text-center text-sm outline-none focus:border-accent"
                />
                <span className="text-xs text-muted">%</span>
              </div>
              <button
                onClick={() => marcar(setServicos)(servicos.filter((_, j) => j !== i))}
                aria-label="Remover"
                className="p-1 text-muted"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => marcar(setServicos)([...servicos, { descricao: '', avanco: 0 }])}
          className="mt-2 text-sm font-medium text-accent"
        >
          + Adicionar serviço
        </button>
      </section>

      <section className="rounded-2xl border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold">Equipamentos</h2>
        <textarea
          value={equipamentos}
          onChange={(e) => marcar(setEquipamentos)(e.target.value)}
          placeholder="Ex.: 1 betoneira, 1 retroescavadeira…"
          rows={2}
          className="w-full resize-none rounded-xl border border-hairline bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </section>

      <section className="rounded-2xl border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold">Ocorrências</h2>
        <textarea
          value={ocorrencias}
          onChange={(e) => marcar(setOcorrencias)(e.target.value)}
          placeholder="Atrasos, faltas, interferências, visitas…"
          rows={3}
          className="w-full resize-none rounded-xl border border-hairline bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </section>

      <section className="rounded-2xl border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold">Fotos</h2>
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((f) => (
            <div key={f.id} className="group relative aspect-square overflow-hidden rounded-xl">
              <img src={f.url} alt={f.legenda ?? 'Foto do RDO'} className="h-full w-full object-cover" />
              <button
                onClick={() => removerFoto(f)}
                aria-label="Remover foto"
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
          <button
            onClick={() => cameraRef.current?.click()}
            disabled={enviandoFoto}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-hairline text-muted disabled:opacity-50"
          >
            {enviandoFoto ? (
              <span className="text-xs">Enviando…</span>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                  <path
                    d="M4 8a2 2 0 0 1 2-2h1.5l1.2-1.8A1.5 1.5 0 0 1 10 3.5h4a1.5 1.5 0 0 1 1.3.7L16.5 6H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
                <span className="text-[11px] font-medium">Câmera</span>
              </>
            )}
          </button>
          <button
            onClick={() => galeriaRef.current?.click()}
            disabled={enviandoFoto}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-hairline text-muted disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.5" />
              <path d="M21 15l-4.5-4.5L9 18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] font-medium">Galeria</span>
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={adicionarFotos}
          className="hidden"
        />
        <input
          ref={galeriaRef}
          type="file"
          accept="image/*"
          multiple
          onChange={adicionarFotos}
          className="hidden"
        />
      </section>

      <button
        onClick={salvarEVoltar}
        disabled={salvando}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {salvando ? 'Salvando…' : 'Salvar RDO'}
      </button>
    </div>
  )
}
