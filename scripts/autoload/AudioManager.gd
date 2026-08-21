extends Node

# Procedural Audio Synthesizer for self-contained Military Tactical SFX in Godot 4
var players: Array[AudioStreamPlayer] = []
const POOL_SIZE = 8

func _ready() -> void:
	for i in range(POOL_SIZE):
		var p = AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		players.append(p)

func _get_available_player() -> AudioStreamPlayer:
	for p in players:
		if not p.playing:
			return p
	return players[0]

func play_tone(freq: float, duration: float, decay: float = 4.0, volume_db: float = -4.0, wave_type: String = "sine") -> void:
	var sample_rate = 22050
	var total_frames = int(sample_rate * duration)
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_8_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	
	var data = PackedByteArray()
	data.resize(total_frames)
	
	for i in range(total_frames):
		var t = float(i) / float(sample_rate)
		var env = exp(-decay * t)
		var val = 0.0
		
		if wave_type == "sine":
			val = sin(TAU * freq * t) * env
		elif wave_type == "square":
			val = (1.0 if sin(TAU * freq * t) > 0.0 else -1.0) * env
		elif wave_type == "noise":
			val = (randf() * 2.0 - 1.0) * env
		elif wave_type == "fm":
			var mod = sin(TAU * (freq * 0.5) * t) * 400.0
			val = sin(TAU * (freq + mod) * t) * env
			
		var byte_val = int(clamp((val * 0.8 + 1.0) * 127.5, 0.0, 255.0))
		data[i] = byte_val
		
	stream.data = data
	var p = _get_available_player()
	p.stream = stream
	p.volume_db = volume_db
	p.play()

# Tactical SFX Triggers
func play_click_ping() -> void:
	play_tone(1800.0, 0.12, 18.0, -2.0, "sine")

func play_typewriter_click() -> void:
	var f = randf_range(800.0, 1200.0)
	play_tone(f, 0.04, 35.0, -8.0, "square")

func play_upgrade_sfx() -> void:
	play_tone(950.0, 0.08, 12.0, -4.0, "sine")
	await get_tree().create_timer(0.06).timeout
	play_tone(1420.0, 0.15, 10.0, -3.0, "sine")

func play_alarm_siren() -> void:
	for repeat in range(3):
		play_tone(660.0, 0.25, 4.0, 0.0, "square")
		await get_tree().create_timer(0.2).timeout
		play_tone(880.0, 0.25, 4.0, 0.0, "square")
		await get_tree().create_timer(0.2).timeout

func play_target_lock_beep() -> void:
	play_tone(2400.0, 0.05, 25.0, -6.0, "sine")

func play_strike_explosion() -> void:
	play_tone(80.0, 1.2, 2.5, 2.0, "noise")
