import { supabase } from '../lib/supabase'

export default function AguardandoAprovacao({ onRecarregar }: { onRecarregar: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-surface">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-6 w-6 text-muted">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        </div>
        <h1 className="mb-1 text-xl font-semibold">Aguardando aprovação</h1>
        <p className="mb-6 text-sm text-ink2">
          Sua conta foi criada, mas o acesso ao app precisa ser liberado pelo administrador.
        </p>
        <button
          onClick={onRecarregar}
          className="mb-2 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white"
        >
          Já fui aprovado — verificar
        </button>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full py-2 text-sm text-ink2"
        >
          Sair
        </button>
      </div>
    </div>
  )
}
