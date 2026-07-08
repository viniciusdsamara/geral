import { supabase } from './supabase'
import type { EfetivoItem, ServicoItem } from './types'

// CSV com BOM e ponto e vírgula: abre direto no Excel em pt-BR
function csv(linhas: (string | number | null | undefined)[][]): string {
  return (
    '﻿' +
    linhas
      .map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\r\n')
  )
}

function baixar(nome: string, conteudo: string) {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nome
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function exportarDados(userId: string): Promise<boolean> {
  const [obras, rdos, assuntos, aprendizados] = await Promise.all([
    supabase.from('obras').select('id, nome').eq('user_id', userId),
    supabase.from('rdos').select('*').eq('user_id', userId).order('data'),
    supabase.from('assuntos').select('id, nome').eq('user_id', userId),
    supabase.from('aprendizados').select('*').eq('user_id', userId).order('data'),
  ])
  if (obras.error || rdos.error || assuntos.error || aprendizados.error) return false

  const nomeObra = new Map((obras.data ?? []).map((o) => [o.id, o.nome]))
  const nomeAssunto = new Map((assuntos.data ?? []).map((a) => [a.id, a.nome]))

  const linhasRdos: (string | number | null)[][] = [
    ['obra', 'data', 'clima manhã', 'clima tarde', 'praticável manhã', 'praticável tarde', 'efetivo', 'total pessoas', 'serviços', 'equipamentos', 'ocorrências', 'relato'],
  ]
  for (const r of rdos.data ?? []) {
    const efetivo = (r.efetivo as EfetivoItem[]) ?? []
    const servicos = (r.servicos as ServicoItem[]) ?? []
    linhasRdos.push([
      nomeObra.get(r.obra_id) ?? '',
      r.data,
      r.clima_manha,
      r.clima_tarde,
      r.praticavel_manha ? 'sim' : 'não',
      r.praticavel_tarde ? 'sim' : 'não',
      efetivo.map((e) => `${e.funcao} x${e.qtd}`).join(' + '),
      efetivo.reduce((s, e) => s + (e.qtd || 0), 0),
      servicos.map((s) => `${s.descricao} (${s.avanco}%)`).join(' + '),
      r.equipamentos,
      r.ocorrencias,
      r.relato,
    ])
  }

  const linhasAprendizados: (string | null)[][] = [['data', 'assunto', 'texto']]
  for (const a of aprendizados.data ?? []) {
    linhasAprendizados.push([a.data, a.assunto_id ? (nomeAssunto.get(a.assunto_id) ?? '') : '', a.texto])
  }

  baixar('rdos.csv', csv(linhasRdos))
  baixar('aprendizados.csv', csv(linhasAprendizados))
  return true
}
