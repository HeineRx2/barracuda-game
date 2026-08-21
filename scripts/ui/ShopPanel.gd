extends Control

@onready var btn_comms: Button = $VBox/CommsItem/BtnBuy
@onready var btn_sonar: Button = $VBox/SonarItem/BtnBuy
@onready var btn_armor: Button = $VBox/ArmorItem/BtnBuy
@onready var btn_optics: Button = $VBox/OpticsItem/BtnBuy

@onready var lbl_comms_tier: Label = $VBox/CommsItem/VBoxInfo/TierLabel
@onready var lbl_sonar_tier: Label = $VBox/SonarItem/VBoxInfo/TierLabel
@onready var lbl_armor_tier: Label = $VBox/ArmorItem/VBoxInfo/TierLabel
@onready var lbl_optics_tier: Label = $VBox/OpticsItem/VBoxInfo/TierLabel

@onready var lbl_comms_cost: Label = $VBox/CommsItem/BtnBuy/CostLabel
@onready var lbl_sonar_cost: Label = $VBox/SonarItem/BtnBuy/CostLabel
@onready var lbl_armor_cost: Label = $VBox/ArmorItem/BtnBuy/CostLabel
@onready var lbl_optics_cost: Label = $VBox/OpticsItem/BtnBuy/CostLabel

func _ready() -> void:
	GameState.connect("data_updated", Callable(self, "_on_data_updated"))
	GameState.connect("upgrade_purchased", Callable(self, "_on_upgrade_purchased"))
	GameState.connect("capacity_reset", Callable(self, "_on_capacity_reset"))
	
	btn_comms.connect("pressed", Callable(self, "_on_buy_comms_pressed"))
	btn_sonar.connect("pressed", Callable(self, "_on_buy_sonar_pressed"))
	btn_armor.connect("pressed", Callable(self, "_on_buy_armor_pressed"))
	btn_optics.connect("pressed", Callable(self, "_on_buy_optics_pressed"))
	
	update_all_labels()

func update_all_labels() -> void:
	# Tier levels
	lbl_comms_tier.text = "MK %d // +%.1f MB/CLK" % [GameState.comms_level + 1, (GameState.comms_level * 1.5 + 1.0) * GameState.get_global_multiplier()]
	lbl_sonar_tier.text = "MK %d // +%.1f MB/SEC" % [GameState.sonar_level + 1, (GameState.sonar_level * 2.0) * GameState.get_global_multiplier()]
	lbl_armor_tier.text = "MK %d // +%.1f MB/SEC" % [GameState.armor_level + 1, (GameState.armor_level * 1.2) * GameState.get_global_multiplier()]
	lbl_optics_tier.text = "MK %d // +%.1f MB/CLK" % [GameState.optics_level + 1, (GameState.optics_level * 3.0) * GameState.get_global_multiplier()]
	
	# Costs
	lbl_comms_cost.text = "%.0f MB" % GameState.get_comms_cost()
	lbl_sonar_cost.text = "%.0f MB" % GameState.get_sonar_cost()
	lbl_armor_cost.text = "%.0f MB" % GameState.get_armor_cost()
	lbl_optics_cost.text = "%.0f MB" % GameState.get_optics_cost()
	
	# Button disabled state & colors
	btn_comms.disabled = (GameState.data_mb < GameState.get_comms_cost())
	btn_sonar.disabled = (GameState.data_mb < GameState.get_sonar_cost())
	btn_armor.disabled = (GameState.data_mb < GameState.get_armor_cost())
	btn_optics.disabled = (GameState.data_mb < GameState.get_optics_cost())

func _on_data_updated(_current: float, _max_mb: float, _percent: float) -> void:
	update_all_labels()

func _on_upgrade_purchased(_id: String, _tier: int) -> void:
	update_all_labels()

func _on_capacity_reset() -> void:
	update_all_labels()

func _on_buy_comms_pressed() -> void:
	if GameState.buy_comms():
		play_button_feedback(btn_comms)

func _on_buy_sonar_pressed() -> void:
	if GameState.buy_sonar():
		play_button_feedback(btn_sonar)

func _on_buy_armor_pressed() -> void:
	if GameState.buy_armor():
		play_button_feedback(btn_armor)

func _on_buy_optics_pressed() -> void:
	if GameState.buy_optics():
		play_button_feedback(btn_optics)

func play_button_feedback(btn: Button) -> void:
	var tw = create_tween()
	tw.tween_property(btn, "scale", Vector2(1.08, 1.08), 0.05)
	tw.tween_property(btn, "scale", Vector2(1.0, 1.0), 0.08)
