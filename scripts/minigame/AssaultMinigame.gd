extends Control

@onready var target_container: Control = $TargetContainer
@onready var target_sprite: TextureRect = $TargetContainer/TargetSprite
@onready var crosshair: Control = $Crosshair
@onready var lock_progress_bar: ProgressBar = $HUD/LockProgressContainer/LockProgressBar
@onready var lock_status_label: Label = $HUD/LockProgressContainer/LockStatusLabel
@onready var timer_label: Label = $HUD/TopBanner/TimerLabel
@onready var alert_flash: ColorRect = $AlertFlash

var is_active: bool = false
var match_duration: float = 10.0
var time_remaining: float = 10.0
var lock_duration: float = 0.0
var required_lock_time: float = 6.5 # Must maintain lock for 6.5s out of 10s total

# Target Motion Variables
var target_vel: Vector2 = Vector2.ZERO
var target_pos: Vector2 = Vector2.ZERO
var screen_size: Vector2 = Vector2(1920, 1080)
var lock_radius: float = 130.0

var beep_timer: float = 0.0

func _ready() -> void:
	visible = false
	GameState.connect("assault_started", Callable(self, "_on_assault_started"))

func _process(delta: float) -> void:
	if not is_active:
		return
		
	# Follow mouse with crosshair
	crosshair.global_position = get_global_mouse_position()
	
	# Move target with evasive physics
	update_target_movement(delta)
	
	# Check crosshair distance to target
	var dist = crosshair.global_position.distance_to(target_container.global_position)
	var is_locked = dist <= lock_radius
	
	if is_locked:
		lock_duration += delta
		crosshair.modulate = Color(1.0, 0.2, 0.2, 1.0) # Red hot lock
		beep_timer += delta
		if beep_timer >= 0.2:
			beep_timer = 0.0
			if has_node("/root/AudioManager"):
				get_node("/root/AudioManager").play_target_lock_beep()
	else:
		crosshair.modulate = Color(0.0, 1.0, 0.4, 0.8) # Green searching
		
	# Update timers and UI
	time_remaining -= delta
	timer_label.text = "TIME TO LOSS: %.1fs" % max(time_remaining, 0.0)
	
	var lock_percent = clamp((lock_duration / required_lock_time) * 100.0, 0.0, 100.0)
	lock_progress_bar.value = lock_percent
	
	if is_locked:
		lock_status_label.text = ">>> TARGET LOCK ACQUIRED (%.0f%%) <<<" % lock_percent
		lock_status_label.add_theme_color_override("font_color", Color(1.0, 0.2, 0.2))
	else:
		lock_status_label.text = "SEARCHING TARGET... ACQUIRE LOCK (%.0f%%)" % lock_percent
		lock_status_label.add_theme_color_override("font_color", Color(0.2, 1.0, 0.4))
		
	# Win / Loss Condition
	if lock_duration >= required_lock_time:
		on_assault_success()
	elif time_remaining <= 0.0:
		on_assault_failed()

func update_target_movement(delta: float) -> void:
	# Random evasive acceleration
	var accel = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)).normalized() * 400.0
	target_vel += accel * delta
	target_vel = target_vel.limit_length(320.0)
	
	target_pos += target_vel * delta
	
	# Clamp to screen bounds with bounce
	var margin = 200.0
	if target_pos.x < margin:
		target_pos.x = margin
		target_vel.x = abs(target_vel.x)
	elif target_pos.x > screen_size.x - margin:
		target_pos.x = screen_size.x - margin
		target_vel.x = -abs(target_vel.x)
		
	if target_pos.y < margin:
		target_pos.y = margin
		target_vel.y = abs(target_vel.y)
	elif target_pos.y > screen_size.y - margin:
		target_pos.y = screen_size.y - margin
		target_vel.y = -abs(target_vel.y)
		
	target_container.global_position = target_pos

func _on_assault_started() -> void:
	visible = true
	is_active = true
	time_remaining = match_duration
	lock_duration = 0.0
	screen_size = get_viewport_rect().size
	target_pos = screen_size * 0.5
	target_container.global_position = target_pos
	target_vel = Vector2(randf_range(-200.0, 200.0), randf_range(-200.0, 200.0))
	
	# Red flash alert animation
	alert_flash.modulate.a = 0.7
	var tw = create_tween()
	tw.tween_property(alert_flash, "modulate:a", 0.0, 0.6)

func on_assault_success() -> void:
	is_active = false
	lock_status_label.text = ">>> KINETIC MISSILE IMPACT CONFIRMED! <<<"
	lock_status_label.add_theme_color_override("font_color", Color(1.0, 0.9, 0.2))
	
	# Explosion screen flash
	alert_flash.color = Color(1.0, 1.0, 1.0, 1.0)
	alert_flash.modulate.a = 1.0
	var tw = create_tween()
	tw.tween_property(alert_flash, "modulate:a", 0.0, 0.8)
	
	await get_tree().create_timer(1.2).timeout
	visible = false
	GameState.complete_assault(true)

func on_assault_failed() -> void:
	is_active = false
	lock_status_label.text = "TARGET LOST // ASSAULT ABORTED"
	lock_status_label.add_theme_color_override("font_color", Color(1.0, 0.1, 0.1))
	
	await get_tree().create_timer(1.2).timeout
	visible = false
	GameState.complete_assault(false)
