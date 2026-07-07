import { useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Obra, Perfil } from './lib/types'
import TabBar, { type Aba } from './components/TabBar'
import Login from './screens/Login'
import ObraSetup from './screens/ObraSetup'
import Hoje from './screens/Hoje'
import Rdo from './screens/Rdo'
import Aprendizado from './screens/Aprendizado'
import Evolucao from './screens/Evolucao'
import AguardandoAprovacao from './screens/AguardandoAprovacao'
import Admin from './screens/Admin'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined)
  const [obra, setObra] = useState<Obra | null | undefined>(undefined)
  const [aba, setAba] = useState<Aba>('hoje')
  const [adminAberto, setAdminAberto] = useState(false)
  const [erroConexao, setErroConexao] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const carregarPerfil = useCallback(async () => {
    // Filtra pelo próprio id: admin enxerga todos os perfis via RLS,
    // e sem o filtro a consulta retornaria mais de uma linha.
    const { data: s } = await supabase.auth.getSession()
    const uid = s.session?.user.id
    if (!uid) {
      setPerfil(null)
      return
    }
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()
    if (error) {
      // Sem rede não dá para saber o status: melhor avisar do que
      // mostrar "aguardando aprovação" para quem já é aprovado.
      setErroConexao(true)
      return
    }
    setPerfil((data as Perfil | null) ?? null)
  }, [])

  const carregarObra = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession()
    const uid = s.session?.user.id
    if (!uid) {
      setObra(null)
      return
    }
    const { data, error } = await supabase
      .from('obras')
      .select('id, nome, ativa')
      .eq('user_id', uid)
      .eq('ativa', true)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) {
      // Sem rede, não mostrar o cadastro de obra (criaria duplicada)
      setErroConexao(true)
      return
    }
    setObra(data && data.length > 0 ? data[0] : null)
  }, [])

  useEffect(() => {
    if (session) {
      setPerfil(undefined)
      setObra(undefined)
      carregarPerfil()
      carregarObra()
    }
  }, [session, carregarPerfil, carregarObra])

  if (session === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-muted">Carregando…</div>
  }

  if (!session) return <Login />

  if (erroConexao) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="mb-1 text-xl font-semibold">Sem conexão</h1>
          <p className="mb-6 text-sm text-ink2">
            Não foi possível falar com o servidor. Verifique o sinal e tente de novo.
          </p>
          <button
            onClick={() => {
              setErroConexao(false)
              setPerfil(undefined)
              setObra(undefined)
              carregarPerfil()
              carregarObra()
            }}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    )
  }

  if (perfil === undefined || obra === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-muted">Carregando…</div>
  }

  if (!perfil?.aprovado) {
    return (
      <AguardandoAprovacao
        onRecarregar={() => {
          setPerfil(undefined)
          carregarPerfil()
          carregarObra()
        }}
      />
    )
  }

  const userId = session.user.id

  if (adminAberto && perfil.admin) {
    return <Admin meuId={userId} onVoltar={() => setAdminAberto(false)} />
  }

  if (obra === null) return <ObraSetup onCriada={carregarObra} />

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-24 pt-6">
      {aba === 'hoje' && (
        <Hoje
          userId={userId}
          obra={obra}
          onObraMudou={carregarObra}
          ehAdmin={perfil.admin}
          onAbrirAdmin={() => setAdminAberto(true)}
        />
      )}
      {aba === 'rdo' && <Rdo userId={userId} obra={obra} />}
      {aba === 'aprendizado' && <Aprendizado userId={userId} />}
      {aba === 'evolucao' && <Evolucao userId={userId} />}
      <TabBar aba={aba} onMudar={setAba} />
    </div>
  )
}
