export interface Perfil {
  user_id: string
  email: string
  aprovado: boolean
  admin: boolean
  criado_em: string
}

export interface Obra {
  id: string
  nome: string
  ativa: boolean
}

export interface EfetivoItem {
  funcao: string
  qtd: number
}

export interface ServicoItem {
  descricao: string
  avanco: number // 0–100
}

export interface Rdo {
  id: string
  obra_id: string
  data: string
  clima_manha: string | null
  clima_tarde: string | null
  praticavel_manha: boolean
  praticavel_tarde: boolean
  efetivo: EfetivoItem[]
  servicos: ServicoItem[]
  equipamentos: string | null
  ocorrencias: string | null
}

export interface RdoFoto {
  id: string
  rdo_id: string
  path: string
  legenda: string | null
}

export interface Assunto {
  id: string
  nome: string
}

export interface Aprendizado {
  id: string
  assunto_id: string | null
  data: string
  texto: string
  created_at: string
}

export interface Retrospectiva {
  id: string
  semana_inicio: string
  semana_fim: string
  conteudo_md: string
  created_at: string
}

export interface Tarefa {
  id: string
  data: string
  titulo: string
  concluida: boolean
}
