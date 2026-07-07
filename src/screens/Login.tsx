import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setCarregando(true)
    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) setErro('E-mail ou senha incorretos.')
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password: senha })
      if (error) setErro(error.message)
      else if (!data.session) setAviso('Conta criada! Verifique seu e-mail para confirmar.')
    }
    setCarregando(false)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold">RDO Diário</h1>
        <p className="mb-8 text-sm text-ink2">Seu diário de obra e aprendizado.</p>
        <form onSubmit={enviar} className="space-y-3">
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-hairline bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-xl border border-hairline bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {erro && <p className="text-sm text-danger">{erro}</p>}
          {aviso && <p className="text-sm text-accent">{aviso}</p>}
          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {carregando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
        <button
          onClick={() => {
            setModo(modo === 'entrar' ? 'criar' : 'entrar')
            setErro('')
            setAviso('')
          }}
          className="mt-4 w-full text-center text-sm text-ink2"
        >
          {modo === 'entrar' ? 'Primeira vez aqui? Criar conta' : 'Já tenho conta. Entrar'}
        </button>
      </div>
    </div>
  )
}
