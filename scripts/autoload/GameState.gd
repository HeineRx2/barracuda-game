extends Node

signal data_updated(current_mb: float, max_mb: float, percent: float)
signal capacity_reached
signal capacity_reset
signal upgrade_purchased(upgrade_id: String, new_tier: int)
signal assault_started
signal assault_completed(success: bool, blueprint_gain: int)
signal drone_clicked(click_pos: Vector2, gain_amount: float)
signal dossier_message_unlocked(title: String, body: String, timestamp: String)

var data_mb: float = 0.0
var max_capacity_mb: float = 100.0
var base_click_power: float = 1.0
var base_passive_income: float = 0.0
var prestige_blueprints: int = 0

# Upgrade Tiers
var comms_level: int = 0
var sonar_level: int = 0
var armor_level: int = 0
var optics_level: int = 0

# Dossier Lore Tracking
var current_dossier_stage: int = 0

const DOSSIER_LORE = [
	{
		"stage": 0,
		"threshold": 0.0,
		"title": "DIRECTIVE 001 // SECURE DEPLOYMENT",
		"timestamp": "03:14:22Z // BLACK SEA SECTOR 4",
		"text": "Autonomous surface vessel BARRACUDA deployed under storm cover. Mission: Penetrate enemy maritime radar envelope and siphon classified telemetry."
	},
	{
		"stage": 1,
		"threshold": 25.0,
		"title": "INTERCEPT // ENEMY FREQUENCY 142.85 MHz",
		"timestamp": "03:18:05Z // SIGINT RECORDING",
		"text": "Command: 'Coast radar report anomalous fast surface blip approaching perimeter at 42 knots. Thermal footprint negligible. Deploy optical sweep.'"
	},
	{
		"stage": 2,
		"threshold": 50.0,
		"title": "DECRYPT // NAVAL SATELLITE UPLINK",
		"timestamp": "03:22:40Z // CIPHER KEY: ARES-9",
		"text": "Siphoning carrier strike group battle-management logs. Enemy AWACS locked to northern sector. Barracuda carbon skin deflecting Ka-band pulse radar."
	},
	{
		"stage": 3,
		"threshold": 75.0,
		"title": "CRITICAL // WARSHIP TARGET VECTOR",
		"timestamp": "03:27:12Z // FLIR THERMAL LOCK",
		"text": "Corvette class 'Admiral G.' detected at Bearing 045°, Range 7.2km. Telemetry buffer reaching critical threshold. Prepare for precision ASSAULT strike."
	},
	{
		"stage": 4,
		"threshold": 100.0,
		"title": "AUTHORIZED // KINETIC STRIKE PROTOCOL",
		"timestamp": "03:31:00Z // WAR ROOM OVERRIDE",
		"text": "Buffer at 100% capacity. War room authorization granted. Initiate ASSAULT mode: maintain crosshair lock to execute strike and extract Elite Blueprint."
	}
]

func _ready() -> void:
	emit_signal("data_updated", data_mb, max_capacity_mb, 0.0)
	check_dossier_progression()

func _process(delta: float) -> void:
	var passive = get_total_passive_income()
	if passive > 0.0 and data_mb < max_capacity_mb:
		add_data(passive * delta, false, Vector2.ZERO)

func get_global_multiplier() -> float:
	return 1.0 + (float(prestige_blueprints) * 0.5)

func get_total_click_power() -> float:
	var bonus_click = float(comms_level) * 1.5 + float(optics_level) * 3.0
	return (base_click_power + bonus_click) * get_global_multiplier()

func get_total_passive_income() -> float:
	var bonus_passive = float(sonar_level) * 2.0 + float(armor_level) * 1.2
	return bonus_passive * get_global_multiplier()

func add_data(amount: float, from_click: bool = false, click_pos: Vector2 = Vector2.ZERO) -> void:
	var prev_mb = data_mb
	data_mb = clamp(data_mb + amount, 0.0, max_capacity_mb)
	var percent = (data_mb / max_capacity_mb) * 100.0
	
	emit_signal("data_updated", data_mb, max_capacity_mb, percent)
	
	if from_click:
		emit_signal("drone_clicked", click_pos, amount)
		
	if prev_mb < max_capacity_mb and data_mb >= max_capacity_mb:
		emit_signal("capacity_reached")
		
	check_dossier_progression()

func on_drone_clicked(pos: Vector2) -> void:
	var gain = get_total_click_power()
	add_data(gain, true, pos)
	if has_node("/root/AudioManager"):
		get_node("/root/AudioManager").play_click_ping()
	if has_node("/root/TelemetryManager"):
		get_node("/root/TelemetryManager").record_click(pos, gain)

# Upgrade Pricing Logic
func get_comms_cost() -> float:
	return 10.0 * pow(1.45, comms_level)

func get_sonar_cost() -> float:
	return 25.0 * pow(1.5, sonar_level)

func get_armor_cost() -> float:
	return 50.0 * pow(1.55, armor_level)

func get_optics_cost() -> float:
	return 100.0 * pow(1.6, optics_level)

func buy_comms() -> bool:
	var cost = get_comms_cost()
	if data_mb >= cost:
		data_mb -= cost
		comms_level += 1
		emit_signal("upgrade_purchased", "comms", comms_level)
		emit_signal("data_updated", data_mb, max_capacity_mb, (data_mb / max_capacity_mb) * 100.0)
		if has_node("/root/AudioManager"):
			get_node("/root/AudioManager").play_upgrade_sfx()
		return true
	return false

func buy_sonar() -> bool:
	var cost = get_sonar_cost()
	if data_mb >= cost:
		data_mb -= cost
		sonar_level += 1
		emit_signal("upgrade_purchased", "sonar", sonar_level)
		emit_signal("data_updated", data_mb, max_capacity_mb, (data_mb / max_capacity_mb) * 100.0)
		if has_node("/root/AudioManager"):
			get_node("/root/AudioManager").play_upgrade_sfx()
		return true
	return false

func buy_armor() -> bool:
	var cost = get_armor_cost()
	if data_mb >= cost:
		data_mb -= cost
		armor_level += 1
		emit_signal("upgrade_purchased", "armor", armor_level)
		emit_signal("data_updated", data_mb, max_capacity_mb, (data_mb / max_capacity_mb) * 100.0)
		if has_node("/root/AudioManager"):
			get_node("/root/AudioManager").play_upgrade_sfx()
		return true
	return false

func buy_optics() -> bool:
	var cost = get_optics_cost()
	if data_mb >= cost:
		data_mb -= cost
		optics_level += 1
		emit_signal("upgrade_purchased", "optics", optics_level)
		emit_signal("data_updated", data_mb, max_capacity_mb, (data_mb / max_capacity_mb) * 100.0)
		if has_node("/root/AudioManager"):
			get_node("/root/AudioManager").play_upgrade_sfx()
		return true
	return false

func check_dossier_progression() -> void:
	var percent = (data_mb / max_capacity_mb) * 100.0
	for i in range(DOSSIER_LORE.size()):
		var entry = DOSSIER_LORE[i]
		if percent >= entry["threshold"] and current_dossier_stage <= i:
			current_dossier_stage = i + 1
			emit_signal("dossier_message_unlocked", entry["title"], entry["text"], entry["timestamp"])

# Prestige Assault Logic
func trigger_assault_start() -> void:
	emit_signal("assault_started")
	if has_node("/root/AudioManager"):
		get_node("/root/AudioManager").play_alarm_siren()

func complete_assault(success: bool) -> void:
	if success:
		prestige_blueprints += 1
		data_mb = 0.0
		# Reset standard upgrades for prestige loop, scaling capacity
		comms_level = 0
		sonar_level = 0
		armor_level = 0
		optics_level = 0
		max_capacity_mb = 100.0 * (1.0 + float(prestige_blueprints) * 0.25)
		current_dossier_stage = 0
		emit_signal("capacity_reset")
		emit_signal("assault_completed", true, 1)
		emit_signal("data_updated", data_mb, max_capacity_mb, 0.0)
		check_dossier_progression()
		if has_node("/root/AudioManager"):
			get_node("/root/AudioManager").play_strike_explosion()
	else:
		emit_signal("assault_completed", false, 0)
