import { useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Obra } from './lib/types'
import TabBar, { type Aba } from './components/TabBar'
import Login from './screens/Login'
import ObraSetup from './screens/ObraSetup'
import Hoje from './screens/Hoje'
import Rdo from './screens/Rdo'
import Aprendizado from './screens/Aprendizado'
import Evolucao from './screens/Evolucao'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [obra, setObra] = useState<Obra | null | undefined>(undefined)
  const [aba, setAba] = useState<Aba>('hoje')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const carregarObra = useCallback(async () => {
    const { data } = await supabase
      .from('obras')
      .select('id, nome, ativa')
      .eq('ativa', true)
      .order('created_at', { ascending: false })
      .limit(1)
    setObra(data && data.length > 0 ? data[0] : null)
  }, [])

  useEffect(() => {
    if (session) {
      setObra(undefined)
      carregarObra()
    }
  }, [session, carregarObra])

  if (session === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-muted">Carregando…</div>
  }

  if (!session) return <Login />

  if (obra === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-muted">Carregando…</div>
  }

  if (obra === null) return <ObraSetup onCriada={carregarObra} />

  const userId = session.user.id

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-24 pt-6">
      {aba === 'hoje' && <Hoje userId={userId} obra={obra} onObraMudou={carregarObra} />}
      {aba === 'rdo' && <Rdo userId={userId} obra={obra} />}
      {aba === 'aprendizado' && <Aprendizado userId={userId} />}
      {aba === 'evolucao' && <Evolucao />}
      <TabBar aba={aba} onMudar={setAba} />
    </div>
  )
}
