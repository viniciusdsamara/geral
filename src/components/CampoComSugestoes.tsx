import { useMemo, useState } from 'react'
import { normalizar } from '../lib/texto'

// Campo de texto com sugestões por prefixo (estilo barra de pesquisa):
// enquanto digita, mostra as opções já usadas que começam com as mesmas
// letras, ignorando maiúsculas e acentos.

interface Props {
  valor: string
  onMudar: (v: string) => void
  opcoes: string[]
  placeholder?: string
  className?: string
}

export default function CampoComSugestoes({ valor, onMudar, opcoes, placeholder, className }: Props) {
  const [aberto, setAberto] = useState(false)

  const sugestoes = useMemo(() => {
    const q = normalizar(valor.trim())
    const candidatas = q ? opcoes.filter((o) => normalizar(o).startsWith(q)) : opcoes
    return candidatas.filter((o) => normalizar(o) !== q).slice(0, 6)
  }, [valor, opcoes])

  return (
    <div className={`relative ${className ?? ''}`}>
      <input
        value={valor}
        onChange={(e) => {
          onMudar(e.target.value)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {aberto && sugestoes.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-hairline bg-surface shadow-sm">
          {sugestoes.map((s) => (
            <li key={s} className="border-b border-hairline last:border-b-0">
              <button
                type="button"
                onMouseDown={(e) => {
                  // mousedown (antes do blur do input) para o toque não "sumir" com a lista
                  e.preventDefault()
                  onMudar(s)
                  setAberto(false)
                }}
                className="block w-full truncate px-3 py-2.5 text-left text-sm text-ink2"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
