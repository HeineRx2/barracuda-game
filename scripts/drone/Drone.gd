extends Control

@onready var drone_sprite: TextureRect = $DroneContainer/DroneSprite
@onready var drone_container: Control = $DroneContainer
@onready var splash_particles: CPUParticles2D = $SplashParticles
@onready var spark_particles: CPUParticles2D = $SparkParticles
@onready var floating_text_container: Node2D = $FloatingTextContainer

var base_texture: Texture2D = preload("res://assets/textures/drone_base.jpg")
var upgraded_texture: Texture2D = preload("res://assets/textures/drone_upgraded.jpg")

var is_hovered: bool = false
var idle_time: float = 0.0

func _ready() -> void:
	GameState.connect("upgrade_purchased", Callable(self, "_on_upgrade_purchased"))
	GameState.connect("capacity_reset", Callable(self, "_on_capacity_reset"))
	update_visual_evolution()

func _process(delta: float) -> void:
	# Subtle hydrodynamic bobbing in stormy waves
	idle_time += delta
	var bob_y = sin(idle_time * 2.2) * 6.0
	var bob_rot = sin(idle_time * 1.5) * 1.5
	drone_container.position.y = bob_y
	drone_container.rotation_degrees = bob_rot

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			trigger_click_action(event.global_position)

func trigger_click_action(click_pos: Vector2) -> void:
	# 1. Physics bounce tween (Juicy impact)
	var tween = create_tween().set_parallel(false)
	tween.tween_property(drone_container, "scale", Vector2(1.12, 0.88), 0.05).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(drone_container, "scale", Vector2(0.95, 1.05), 0.08).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(drone_container, "scale", Vector2(1.0, 1.0), 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	
	# 2. Particles trigger
	splash_particles.position = get_local_mouse_position()
	splash_particles.restart()
	splash_particles.emitting = true
	
	spark_particles.position = get_local_mouse_position()
	spark_particles.restart()
	spark_particles.emitting = true
	
	# 3. Floating '+X MB' indicator
	spawn_floating_text(get_local_mouse_position(), GameState.get_total_click_power())
	
	# 4. Notify GameState
	GameState.on_drone_clicked(click_pos)

func spawn_floating_text(pos: Vector2, amount: float) -> void:
	var label = Label.new()
	var formatted = "+%.1f MB" % amount if amount < 10.0 else "+%d MB" % int(amount)
	label.text = formatted
	label.position = pos + Vector2(-40, -20)
	label.modulate = Color(0.0, 1.0, 0.45, 1.0)
	
	# Typography styling: green with black outline
	label.add_theme_color_override("font_color", Color(0.2, 1.0, 0.4))
	label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 1))
	label.add_theme_constant_override("shadow_offset_x", 2)
	label.add_theme_constant_override("shadow_offset_y", 2)
	label.add_theme_font_size_override("font_size", 22)
	
	floating_text_container.add_child(label)
	
	var drift_tween = create_tween().set_parallel(true)
	var random_x = randf_range(-30.0, 30.0)
	drift_tween.tween_property(label, "position", label.position + Vector2(random_x, -70.0), 0.75).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	drift_tween.tween_property(label, "modulate:a", 0.0, 0.75).set_trans(Tween.TRANS_EXPO).set_ease(Tween.EASE_IN)
	drift_tween.chain().tween_callback(Callable(label, "queue_free"))

func _on_upgrade_purchased(_upgrade_id: String, _new_tier: int) -> void:
	update_visual_evolution()

func _on_capacity_reset() -> void:
	update_visual_evolution()

func update_visual_evolution() -> void:
	# Check upgrade levels to switch sprite / hull state
	var total_tier = GameState.comms_level + GameState.sonar_level + GameState.armor_level + GameState.optics_level
	if total_tier >= 3 or GameState.prestige_blueprints > 0:
		drone_sprite.texture = upgraded_texture
	else:
		drone_sprite.texture = base_texture
