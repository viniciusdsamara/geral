# Mapa da Planilha do Victor — Casa M&A

> Guia para navegar e **dominar** o sistema de gestão de obra do Victor
> (arquivo `Cliente_Casa_MA_12.06.xlsx`, 33 abas).
> Objetivo: você conseguir explicar e reconstruir cada parte sozinho.

## A lógica geral (o ciclo)

O arquivo não é um monte de abas soltas — é um **ciclo fechado** de gestão
financeira de obra. Entendeu o fluxo, entendeu 80% do método:

```
LEVANTAMENTOS  →  PLAN ORC  →  RESUMO ORC  →  CONTROLE DE APROPRIAÇÕES
                                                      ↓
GRUPOS A CONTRATAR  ←  PROJEÇÃO / FLUXO  ←  PAINEL  ←──┘
```

1. **Levanta** o que tem (quantitativos).
2. **Orça** cada serviço (material + mão de obra).
3. **Resume** por grandes grupos pra enxergar o todo.
4. **Aproxima** (apropria) cada compra real contra o orçamento.
5. Lê a **saúde** da obra no painel (economia x estouro x resultado).
6. **Projeta** o caixa: quando entra e quando sai dinheiro.
7. Controla **o que falta contratar**.

## As abas que importam (por ordem de prioridade pra aprender)

### 1. PLAN ORC — o orçamento analítico (a base de tudo)
- Estrutura em **WBS** (códigos hierárquicos: `9` → `9.1` → `9.1.3`).
- Cada serviço tem: UN, QUANT, **preço unitário separado em MATERIAL e MÃO DE OBRA**, preço total.
- Organizado por **fases**: Projetos → Cinza (estrutura/alvenaria) → Acabamento.
- **Por que separar MAT e MDO?** Porque você contrata e controla separado —
  material você compra, mão de obra você contrata empreiteiro. É a base da apropriação.

### 2. RESUMO ORC — o orçamento sintético
- Os ~20 grandes grupos (Terraplanagem, Alvenarias, Esquadrias, Pisos...) com **% do total**.
- Serve pra responder rápido: "onde está o dinheiro da obra?"
- Na Casa M&A: Alvenarias = 17%, Esquadrias = 12%, Forros/acabamento = 8%. É aqui que você foca atenção.

### 3. CONTROLE DE APROPRIAÇÕES — o coração do controle
- Cada **Pedido** de compra amarrado ao código WBS do orçamento.
- Colunas-chave: FORNECEDOR · VALOR CONTRATADO · ORÇAMENTO · VALOR PAGO · A PAGAR.
- É aqui que se descobre se um serviço **estourou** ou **economizou** vs o orçado.
- **Esse é o documento que você atualiza toda semana** quando estiver tocando obra.

### 4. PAINEL — o dashboard da saúde financeira
- Resume tudo num cartão: Valor Inicial · Contratado · A Contratar · **Economia** ·
  **Estouro** · **Resultado Líquido** · Pago · A Pagar · Total a Gastar.
- Compara duas datas (coluna DIF) pra ver evolução.
- **É o número que você leva pro cliente e pra reunião.** Decorar essa lógica = imponência.

### 5. PROJEÇÃO / FLUXO FINANCEIRO — o caixa no tempo
- Distribui os pagamentos por mês (Previsão de Caixa x Gastos).
- Mostra **resultado mês a mês** — se vai faltar dinheiro e quando.
- Foi aqui que o travamento do financiamento apareceu (meses iniciais negativos).

### 6. GRUPOS A CONTRATAR / CONTROLE DE CONTRATAÇÕES — o que falta comprar
- Lista de serviços ainda não contratados, com **saldo** e **responsável** (Victor/Vinicius).
- É a sua lista de "o que negociar a seguir".

### Abas de apoio (quantitativos e mapas)
- LEVANTAMENTO, VALOR POR AMBIENTE, MAPA REVESTIMENTO, MADEIRAMENTO, PORTAS,
  TIJOLOS, TELHAS, HVAC, LOUÇAS E METAIS, LEV.MARCENARIA — todos **alimentam** o orçamento
  com quantidades. São o "de onde vem cada número" do PLAN ORC.
- CONSOLIDADO — comparativo orçado x contratado com coluna de **saving** por item.

## Como estudar este arquivo (ordem prática)

1. Abra **RESUMO ORC** e entenda os grandes grupos e %.
2. Escolha UM grupo (ex.: Alvenarias) e siga ele no **PLAN ORC** — veja a composição MAT+MDO.
3. Ache esse mesmo grupo no **CONTROLE DE APROPRIAÇÕES** — veja contratado vs orçado.
4. Veja como ele entra no **PAINEL** (economia/estouro).
5. Por fim veja no **PROJEÇÃO** quando ele é pago.
6. Repita com outro grupo. Em ~5 grupos você entende o ciclo inteiro.

> Meta: conseguir pegar a planilha de uma obra nova **em branco** e preencher esse
> ciclo do zero. Aí você não depende mais de ninguém pra controlar uma obra.
