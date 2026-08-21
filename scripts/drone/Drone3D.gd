extends Node3D

@onready var boat_mesh: Node3D = $BoatMesh
@onready var satcom_module: Node3D = $BoatMesh/SatComModule
@onready var flir_module: Node3D = $BoatMesh/FLIRModule
@onready var armor_module: Node3D = $BoatMesh/ArmorModule
@onready var waterjets_module: Node3D = $BoatMesh/WaterjetsModule
@onready var missiles_module: Node3D = $BoatMesh/MissilesModule

var idle_time: float = 0.0
var bounce_impulse: float = 0.0

func _ready() -> void:
	GameState.connect("upgrade_purchased", Callable(self, "_on_upgrade_purchased"))
	GameState.connect("capacity_reset", Callable(self, "_on_capacity_reset"))
	update_modular_attachments()

func _process(delta: float) -> void:
	idle_time += delta
	# Dynamic hydrodynamic heave, pitch, and roll on 3D stormy waves
	var heave = sin(idle_time * 2.8) * 0.15 + cos(idle_time * 1.9) * 0.08
	var pitch = sin(idle_time * 2.2) * 0.04 + (bounce_impulse * 0.06)
	var roll = cos(idle_time * 1.7) * 0.05
	
	boat_mesh.position.y = heave - (bounce_impulse * 0.25)
	boat_mesh.rotation.x = pitch
	boat_mesh.rotation.z = roll
	
	if bounce_impulse > 0.0:
		bounce_impulse = lerp(bounce_impulse, 0.0, delta * 8.0)
		
	# Rotate radar dishes
	if satcom_module and satcom_module.visible:
		var dishes = satcom_module.get_node_or_null("Dishes")
		if dishes:
			dishes.rotate_y(delta * 2.0)

func trigger_click_impulse() -> void:
	bounce_impulse = 1.0

func _on_upgrade_purchased(_upgrade_id: String, _tier: int) -> void:
	update_modular_attachments()

func _on_capacity_reset() -> void:
	update_modular_attachments()

func update_modular_attachments() -> void:
	if satcom_module: satcom_module.visible = (GameState.comms_level > 0)
	if flir_module: flir_module.visible = (GameState.optics_level > 0)
	if armor_module: armor_module.visible = (GameState.armor_level > 0)
	if waterjets_module: waterjets_module.visible = (GameState.sonar_level > 0)
	if missiles_module: missiles_module.visible = (GameState.prestige_blueprints > 0)
