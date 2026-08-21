extends CanvasLayer

@onready var progress_bar: ProgressBar = $BottomPanel/VBox/ProgressBarContainer/DataProgressBar
@onready var progress_glow: ColorRect = $BottomPanel/VBox/ProgressBarContainer/ProgressGlow
@onready var progress_label: Label = $BottomPanel/VBox/ProgressBarContainer/ProgressLabel
@onready var btn_assault: Button = $BottomPanel/VBox/AssaultButtonContainer/BtnAssault
@onready var assault_hazard_rect: ColorRect = $BottomPanel/VBox/AssaultButtonContainer/HazardRect
@onready var assault_label: Label = $BottomPanel/VBox/AssaultButtonContainer/AssaultLabel

# Top Bar Telemetry Labels
@onready var lbl_current_mb: Label = $TopBar/HBox/LeftMetrics/BufferLabel
@onready var lbl_passive_rate: Label = $TopBar/HBox/CenterMetrics/PassiveLabel
@onready var lbl_click_power: Label = $TopBar/HBox/CenterMetrics/ClickLabel
@onready var lbl_multiplier: Label = $TopBar/HBox/RightMetrics/MultiplierLabel
@onready var lbl_mission_time: Label = $TopBar/HBox/RightMetrics/TimeLabel

var mission_start_time: float = 0.0

func _ready() -> void:
	GameState.connect("data_updated", Callable(self, "_on_data_updated"))
	GameState.connect("capacity_reached", Callable(self, "_on_capacity_reached"))
	GameState.connect("capacity_reset", Callable(self, "_on_capacity_reset"))
	btn_assault.connect("pressed", Callable(self, "_on_assault_pressed"))
	
	mission_start_time = Time.get_unix_time_from_system()
	update_hud_state(GameState.data_mb, GameState.max_capacity_mb, 0.0)

func _process(_delta: float) -> void:
	# Update military mission time (UTC simulation)
	var elapsed = Time.get_unix_time_from_system() - mission_start_time
	var mins = int(elapsed / 60.0)
	var secs = int(fmod(elapsed, 60.0))
	var msecs = int(fmod(elapsed * 100.0, 100.0))
	lbl_mission_time.text = "T+%02d:%02d.%02d UTC" % [mins, secs, msecs]
	
	# Keep assault shader updated
	var mat = assault_hazard_rect.material as ShaderMaterial
	if mat:
		mat.set_shader_parameter("is_active", GameState.data_mb >= GameState.max_capacity_mb)

func update_hud_state(current_mb: float, max_mb: float, percent: float) -> void:
	progress_bar.max_value = max_mb
	progress_bar.value = current_mb
	progress_label.text = "DATA BUFFER: %.1f / %.0f MB (%.1f%%)" % [current_mb, max_mb, percent]
	
	# Top bar labels
	lbl_current_mb.text = "BUFFER: %.1f MB" % current_mb
	lbl_passive_rate.text = "SIGINT PASSIVE: +%.1f MB/s" % GameState.get_total_passive_income()
	lbl_click_power.text = "UPLINK POWER: +%.1f MB/clk" % GameState.get_total_click_power()
	
	var mult = GameState.get_global_multiplier()
	lbl_multiplier.text = "GLOBAL EFFICIENCY: x%.1f [%d BLUEPRINTS]" % [mult, GameState.prestige_blueprints]
	
	# Assault button state
	var is_ready = current_mb >= max_mb
	btn_assault.disabled = not is_ready
	
	if is_ready:
		assault_label.text = ">>> INITIATE ASSAULT PROTOCOL [READY] <<<"
		assault_label.add_theme_color_override("font_color", Color(1.0, 0.95, 0.2))
	else:
		assault_label.text = "ASSAULT PROTOCOL LOCKED // BUFFER NOT FULL"
		assault_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))

func _on_data_updated(current_mb: float, max_mb: float, percent: float) -> void:
	update_hud_state(current_mb, max_mb, percent)

func _on_capacity_reached() -> void:
	update_hud_state(GameState.data_mb, GameState.max_capacity_mb, 100.0)
	# Trigger alert flash
	var tw = create_tween()
	tw.tween_property(btn_assault, "scale", Vector2(1.05, 1.05), 0.1)
	tw.tween_property(btn_assault, "scale", Vector2(1.0, 1.0), 0.1)

func _on_capacity_reset() -> void:
	update_hud_state(GameState.data_mb, GameState.max_capacity_mb, 0.0)

func _on_assault_pressed() -> void:
	if GameState.data_mb >= GameState.max_capacity_mb:
		GameState.trigger_assault_start()
