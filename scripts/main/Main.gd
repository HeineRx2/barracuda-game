extends Control

@onready var ocean_rect: ColorRect = $EnvironmentLayer/StormOcean
@onready var drone: Control = $GameLayer/Drone
@onready var hud: CanvasLayer = $HUD
@onready var minigame: Control = $AssaultMinigame

func _ready() -> void:
	# Ensure proper screen sizing and responsive layout
	get_tree().root.connect("size_changed", Callable(self, "_on_viewport_size_changed"))
	_on_viewport_size_changed()

func _on_viewport_size_changed() -> void:
	var vp_size = get_viewport_rect().size
	custom_minimum_size = vp_size
