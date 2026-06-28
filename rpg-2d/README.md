# RPG 2D 🗡️

Um RPG 2D em desenvolvimento, feito com **Godot 4** (gratuito e open-source).

Este é o projeto inicial — já roda com um personagem que se movimenta em um mapa,
câmera que segue o player e uma estrutura de pastas pronta pra crescer.

---

## 🚀 Como rodar

1. Baixe o **Godot 4.3+** (gratuito): https://godotengine.org/download
   - Use a versão **standard** (não precisa da .NET/C# por enquanto — usamos GDScript).
2. Abra o Godot → **Import** → selecione o arquivo `project.godot` desta pasta.
3. Clique em **Play** (▶, ou tecle F5).
4. Ande com as **setas** ou **WASD**.

> Na primeira abertura o Godot gera a pasta `.godot/` (cache) — ela é ignorada pelo git.

---

## 🎮 Controles atuais

| Tecla            | Ação        |
|------------------|-------------|
| Setas / WASD     | Mover       |
| Espaço           | Interagir (ainda sem efeito — reservado) |

---

## 📁 Estrutura do projeto

```
rpg-2d/
├── project.godot          # Configuração do projeto (cena inicial, input, etc.)
├── icon.svg               # Ícone provisório do jogo
├── scenes/
│   ├── world/World.tscn   # Cena principal (o "mapa")
│   └── player/Player.tscn # O personagem jogável
├── scripts/
│   ├── player/player.gd       # Movimento do player
│   └── autoload/game_state.gd # Estado global (ouro, level, XP) — singleton
├── assets/
│   ├── sprites/           # Imagens de personagens, objetos, UI
│   ├── tilesets/          # Tiles do mapa
│   └── audio/             # Música e efeitos sonoros
└── docs/
    ├── GDD.md             # Game Design Document (a visão do jogo)
    └── ASSETS_GRATIS.md   # Onde baixar arte/áudio grátis e legal
```

---

## 🗺️ Próximos passos sugeridos

- [ ] Substituir o sprite provisório por um personagem de verdade (veja `docs/ASSETS_GRATIS.md`)
- [ ] Adicionar um **TileMap** pro mapa com colisão
- [ ] Animações de caminhada (AnimatedSprite2D ou AnimationPlayer)
- [ ] NPCs e diálogos
- [ ] Sistema de batalha
- [ ] HUD (vida, ouro) lendo do `GameState`
- [ ] Salvar / carregar jogo

Veja a visão completa em [`docs/GDD.md`](docs/GDD.md).

---

## 🛠️ Tecnologia

- **Engine:** Godot 4.3 (GL Compatibility — roda até em PC fraco e exporta pra web)
- **Linguagem:** GDScript
- **Resolução base:** 320×180 (pixel art), escalada com `keep`

---

Feito com 💛 — bom desenvolvimento!
