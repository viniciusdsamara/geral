import type { EfetivoItem, ServicoItem } from './types'
import { fmtDataLonga } from './dates'

// Gera uma imagem (JPEG) do RDO para compartilhar por WhatsApp/e-mail.
// Sempre no tema claro: é um documento, não uma tela.
export interface DadosRdoImagem {
  obraNome: string
  data: string
  climaManha: string | null
  climaTarde: string | null
  praticavelManha: boolean
  praticavelTarde: boolean
  efetivo: EfetivoItem[]
  servicos: ServicoItem[]
  equipamentos: string
  ocorrencias: string
  relato: string
  fotosUrls: string[]
}

const W = 1080
const M = 72
const CONT = W - 2 * M
const INK = '#0b0b0b'
const INK2 = '#52514e'
const MUTED = '#6f6d66'
const HAIRLINE = '#e1e0d9'
const ACCENT = '#2a78d6'

function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => res(img)
    img.onerror = rej
    img.src = url
  })
}

function quebrar(ctx: CanvasRenderingContext2D, texto: string, max: number): string[] {
  const linhas: string[] = []
  for (const paragrafo of texto.split('\n')) {
    let atual = ''
    for (const palavra of paragrafo.split(' ')) {
      const teste = atual ? `${atual} ${palavra}` : palavra
      if (ctx.measureText(teste).width > max && atual) {
        linhas.push(atual)
        atual = palavra
      } else {
        atual = teste
      }
    }
    linhas.push(atual)
  }
  return linhas
}

export async function gerarImagemRdo(d: DadosRdoImagem): Promise<Blob | null> {
  const imagens: HTMLImageElement[] = []
  for (const url of d.fotosUrls.slice(0, 6)) {
    try {
      imagens.push(await carregarImagem(url))
    } catch {
      // foto inacessível: segue sem ela
    }
  }

  const desenhar = (comFotos: boolean): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = 8000
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fcfcfb'
    ctx.fillRect(0, 0, W, 8000)
    const sans = 'system-ui, -apple-system, sans-serif'
    let y = M + 20

    ctx.fillStyle = INK
    ctx.font = `600 46px ${sans}`
    for (const l of quebrar(ctx, d.obraNome, CONT)) {
      ctx.fillText(l, M, y)
      y += 58
    }
    ctx.fillStyle = INK2
    ctx.font = `400 32px ${sans}`
    ctx.fillText(`RDO — ${fmtDataLonga(d.data)}`, M, y)
    y += 28

    const separador = () => {
      y += 24
      ctx.strokeStyle = HAIRLINE
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(M, y)
      ctx.lineTo(W - M, y)
      ctx.stroke()
      y += 52
    }

    const secao = (titulo: string) => {
      ctx.fillStyle = ACCENT
      ctx.font = `600 28px ${sans}`
      ctx.fillText(titulo.toUpperCase(), M, y)
      y += 44
    }

    const corpo = (texto: string) => {
      ctx.fillStyle = INK
      ctx.font = `400 32px ${sans}`
      for (const l of quebrar(ctx, texto, CONT)) {
        ctx.fillText(l, M, y)
        y += 44
      }
      y += 8
    }

    separador()

    const climaLinha = (rotulo: string, clima: string | null, praticavel: boolean) =>
      `${rotulo}: ${clima ?? '—'}${praticavel ? '' : ' (impraticável)'}`
    if (d.climaManha || d.climaTarde || !d.praticavelManha || !d.praticavelTarde) {
      secao('Clima')
      corpo(
        `${climaLinha('Manhã', d.climaManha, d.praticavelManha)} · ${climaLinha('Tarde', d.climaTarde, d.praticavelTarde)}`,
      )
      y += 16
    }

    const efetivo = d.efetivo.filter((e) => e.funcao.trim())
    if (efetivo.length > 0) {
      secao('Efetivo')
      const total = efetivo.reduce((s, e) => s + (e.qtd || 0), 0)
      corpo(`${efetivo.map((e) => `${e.qtd} ${e.funcao}`).join(' · ')}  (${total} no total)`)
      y += 16
    }

    const servicos = d.servicos.filter((s) => s.descricao.trim())
    if (servicos.length > 0) {
      secao('Serviços executados')
      for (const s of servicos) {
        corpo(`•  ${s.descricao} — ${s.avanco}%`)
        y -= 8
      }
      y += 24
    }

    if (d.relato.trim()) {
      secao('Relato do dia')
      corpo(d.relato.trim())
      y += 16
    }
    if (d.equipamentos.trim()) {
      secao('Equipamentos')
      corpo(d.equipamentos.trim())
      y += 16
    }
    if (d.ocorrencias.trim()) {
      secao('Ocorrências')
      corpo(d.ocorrencias.trim())
      y += 16
    }

    if (comFotos && imagens.length > 0) {
      secao('Fotos')
      const gap = 16
      const cel = (CONT - 2 * gap) / 3
      imagens.forEach((img, i) => {
        const col = i % 3
        const lin = Math.floor(i / 3)
        const px = M + col * (cel + gap)
        const py = y + lin * (cel + gap)
        const escala = Math.max(cel / img.width, cel / img.height)
        const sw = cel / escala
        const sh = cel / escala
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(px, py, cel, cel, 16)
        ctx.clip()
        ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, px, py, cel, cel)
        ctx.restore()
      })
      y += Math.ceil(imagens.length / 3) * (cel + gap) + 16
    }

    ctx.fillStyle = MUTED
    ctx.font = `400 24px ${sans}`
    ctx.fillText('Gerado pelo RDO Diário', M, y + 20)
    y += 60

    // recorta na altura final
    const final = document.createElement('canvas')
    final.width = W
    final.height = Math.min(8000, y + M / 2)
    final.getContext('2d')!.drawImage(canvas, 0, 0)
    return final
  }

  const paraBlob = (c: HTMLCanvasElement) =>
    new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', 0.88))

  try {
    return await paraBlob(desenhar(true))
  } catch {
    // canvas contaminado por foto sem CORS: gera sem as fotos
    try {
      return await paraBlob(desenhar(false))
    } catch {
      return null
    }
  }
}
