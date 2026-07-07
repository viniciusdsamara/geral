import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ObraSetup({ onCriada }: { onCriada: () => void }) {
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setCarregando(true)
    setErro('')
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user.id
    if (!uid) {
      setErro('Sessão expirada — recarregue a página e entre de novo.')
      setCarregando(false)
      return
    }
    const { error } = await supabase.from('obras').insert({ nome: nome.trim(), user_id: uid })
    if (error) {
      setErro('Não foi possível criar a obra — verifique a conexão e tente de novo.')
      setCarregando(false)
      return
    }
    onCriada()
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <form onSubmit={criar} className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold">Qual é a sua obra?</h1>
        <p className="mb-6 text-sm text-ink2">
          Os RDOs ficam ligados à obra ativa. Quando mudar de obra, o histórico desta fica guardado.
        </p>
        <input
          autoFocus
          required
          placeholder="Ex.: Residencial Aurora — Torre B"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mb-3 w-full rounded-xl border border-hairline bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
        />
        {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {carregando ? 'Criando…' : 'Começar'}
        </button>
      </form>
    </div>
  )
}
