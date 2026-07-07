import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Perfil } from '../lib/types'

interface Props {
  meuId: string
  onVoltar: () => void
}

export default function Admin({ meuId, onVoltar }: Props) {
  const [perfis, setPerfis] = useState<Perfil[] | null>(null)

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('perfis')
      .select('*')
      .order('criado_em', { ascending: false })
    setPerfis((data as Perfil[]) ?? [])
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function alternarAprovacao(p: Perfil) {
    setPerfis((ps) =>
      ps?.map((x) => (x.user_id === p.user_id ? { ...x, aprovado: !x.aprovado } : x)) ?? null,
    )
    const { error } = await supabase
      .from('perfis')
      .update({ aprovado: !p.aprovado })
      .eq('user_id', p.user_id)
    if (error) carregar()
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-10 pt-6">
      <header className="mb-5 flex items-center gap-2">
        <button onClick={onVoltar} aria-label="Voltar" className="rounded-lg p-2 text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-semibold">Administração</h1>
          <p className="text-sm text-ink2">Quem pode entrar no app.</p>
        </div>
      </header>

      {perfis === null && <p className="text-sm text-muted">Carregando…</p>}

      <div className="space-y-2">
        {perfis?.map((p) => (
          <div
            key={p.user_id}
            className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.email}</p>
              <p className="text-xs text-muted">
                {p.admin
                  ? 'Administrador'
                  : p.aprovado
                    ? 'Acesso liberado'
                    : 'Aguardando aprovação'}
                {' · '}
                {new Date(p.criado_em).toLocaleDateString('pt-BR')}
              </p>
            </div>
            {p.user_id === meuId ? (
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
                você
              </span>
            ) : (
              <button
                onClick={() => alternarAprovacao(p)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                  p.aprovado
                    ? 'border border-hairline text-danger'
                    : 'bg-accent text-white'
                }`}
              >
                {p.aprovado ? 'Revogar' : 'Aprovar'}
              </button>
            )}
          </div>
        ))}
      </div>

      {perfis !== null && perfis.length === 1 && (
        <p className="mt-4 text-center text-sm text-muted">
          Quando alguém criar uma conta, ela aparece aqui aguardando sua aprovação.
        </p>
      )}
    </div>
  )
}
