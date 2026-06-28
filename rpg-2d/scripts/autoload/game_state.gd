extends Node
## Estado global do jogo — registrado como autoload "GameState".
##
## Acesse de qualquer script com `GameState.gold`, `GameState.add_gold(10)`, etc.
## Use este nó para guardar dados que sobrevivem à troca de cenas:
## progresso, inventário, ouro, posição salva, flags de quests...

## Nome do herói (placeholder — depois vem de uma tela de criação de personagem).
var player_name: String = "Herói"

## Recursos do jogador.
var gold: int = 0
var level: int = 1
var experience: int = 0

## Emitido sempre que o ouro muda — útil para a HUD reagir.
signal gold_changed(new_total: int)


func add_gold(amount: int) -> void:
	gold = max(0, gold + amount)
	gold_changed.emit(gold)


func add_experience(amount: int) -> void:
	experience += amount
	# Regra simples de level-up: 100 de XP por nível.
	while experience >= level * 100:
		experience -= level * 100
		level += 1
