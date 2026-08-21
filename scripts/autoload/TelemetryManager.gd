extends Node

# Telemetry and Anti-Cheat Batching Manager (FACEIT-Grade Telemetry Architecture)
var click_buffer: Array[Dictionary] = []
var batch_timer: float = 0.0
const BATCH_INTERVAL_SEC: float = 2.0

var last_click_timestamp: float = 0.0

func _ready() -> void:
	last_click_timestamp = Time.get_unix_time_from_system()

func _process(delta: float) -> void:
	batch_timer += delta
	if batch_timer >= BATCH_INTERVAL_SEC:
		batch_timer = 0.0
		flush_telemetry_batch()

func record_click(pos: Vector2, gain: float) -> void:
	var now = Time.get_unix_time_from_system()
	var dt = now - last_click_timestamp
	last_click_timestamp = now
	
	var click_sample = {
		"t": now,
		"dt": dt,
		"x": pos.x,
		"y": pos.y,
		"g": gain,
		"entropy": calculate_click_entropy(pos, dt)
	}
	click_buffer.append(click_sample)

func calculate_click_entropy(pos: Vector2, dt: float) -> float:
	# Measure human variance in jitter and time
	var pos_hash = fmod(pos.x * 12.9898 + pos.y * 78.233, 1.0)
	var time_hash = fmod(dt * 43758.5453, 1.0)
	return abs(pos_hash - time_hash)

func flush_telemetry_batch() -> void:
	if click_buffer.is_empty():
		return
		
	var payload = {
		"session_id": "MOCK_SESSION_BARRACUDA_ALPHA",
		"timestamp": Time.get_unix_time_from_system(),
		"sample_count": click_buffer.size(),
		"clicks": click_buffer.duplicate(true),
		"client_state": {
			"data_mb": GameState.data_mb,
			"prestige": GameState.prestige_blueprints
		}
	}
	
	# In actual deployment, this sends JSON via HTTP POST to Node.js backend:
	# e.g. /api/v1/telemetry/validate-batch
	# print("[TELEMETRY] Flushed Batch: %d samples to anti-cheat buffer" % click_buffer.size())
	
	click_buffer.clear()
