extends Control

@onready var title_label: Label = $VBox/HeaderContainer/TitleLabel
@onready var timestamp_label: Label = $VBox/HeaderContainer/TimestampLabel
@onready var body_label: RichTextLabel = $VBox/BodyContainer/BodyLabel
@onready var status_indicator: ColorRect = $VBox/HeaderContainer/StatusIndicator

var target_text: String = ""
var displayed_char_count: int = 0
var typewriter_speed: float = 0.025
var typewriter_timer: float = 0.0
var is_typing: bool = false

func _ready() -> void:
	GameState.connect("dossier_message_unlocked", Callable(self, "_on_dossier_message_unlocked"))
	# Show initial directive
	var init_lore = GameState.DOSSIER_LORE[0]
	_on_dossier_message_unlocked(init_lore["title"], init_lore["text"], init_lore["timestamp"])

func _process(delta: float) -> void:
	if is_typing:
		typewriter_timer += delta
		if typewriter_timer >= typewriter_speed:
			typewriter_timer = 0.0
			displayed_char_count += 1
			body_label.text = target_text.substr(0, displayed_char_count) + "█"
			if randf() > 0.4 and has_node("/root/AudioManager"):
				get_node("/root/AudioManager").play_typewriter_click()
				
			if displayed_char_count >= target_text.length():
				body_label.text = target_text
				is_typing = false
				
	# Pulse status indicator
	var pulse = (sin(Time.get_ticks_msec() * 0.005) + 1.0) * 0.5
	status_indicator.modulate.a = 0.5 + pulse * 0.5

func _on_dossier_message_unlocked(title: String, body: String, timestamp: String) -> void:
	title_label.text = title
	timestamp_label.text = timestamp
	target_text = body
	displayed_char_count = 0
	is_typing = true
	typewriter_timer = 0.0
	
	# Small bounce tween for dossier update
	var tween = create_tween()
	tween.tween_property(self, "modulate", Color(1.3, 1.3, 1.3, 1.0), 0.1)
	tween.tween_property(self, "modulate", Color(1.0, 1.0, 1.0, 1.0), 0.2)
