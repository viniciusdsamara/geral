extends CharacterBody2D
## Player do RPG 2D.
##
## Movimento top-down (estilo Zelda / JRPG de mapa). Usa as ações de input
## "move_up/down/left/right" definidas no project.godot (setas + WASD).

## Velocidade de movimento em pixels por segundo.
@export var speed: float = 80.0

## Direção para a qual o player está virado (usada depois para animações).
var facing: Vector2 = Vector2.DOWN


func _physics_process(_delta: float) -> void:
	# Lê as 4 direções como um vetor (-1..1 em cada eixo).
	var direction := Input.get_vector("move_left", "move_right", "move_up", "move_down")

	velocity = direction * speed
	move_and_slide()

	# Guarda a última direção em que andou, para animações/interação futuras.
	if direction != Vector2.ZERO:
		facing = direction
