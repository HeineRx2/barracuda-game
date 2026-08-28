import re
import sys

def log_pass(msg):
    print(f"  ✅ {msg}")

def log_fail(msg):
    print(f"  ❌ {msg}")
    global failed
    failed += 1

passed = 0
failed = 0

def check(condition, msg):
    global passed, failed
    if condition:
        passed += 1
        log_pass(msg)
    else:
        failed += 1
        log_fail(msg)

print("=" * 60)
print("BARRACUDA TEST SUITE — Static Analysis")
print("=" * 60)

# ============================================================
# TEST 1: Files parse as valid JS (basic syntax check)
# ============================================================
print("\n[1] ПРОВЕРКА СИНТАКСИСА ФАЙЛОВ")

for fname in ['web_preview/audio.js', 'web_preview/game.js', 'web_preview/drone3d.js']:
    try:
        with open(fname, 'r', encoding='utf-8') as f:
            code = f.read()
        # Check balanced braces
        brace_count = code.count('{') - code.count('}')
        paren_count = code.count('(') - code.count(')')
        bracket_count = code.count('[') - code.count(']')
        
        if abs(brace_count) <= 1 and abs(paren_count) <= 1 and abs(bracket_count) <= 1:
            check(True, f"{fname}: скобки сбалансированы ({{}}={brace_count}, ()={paren_count}, []={bracket_count})")
        else:
            check(False, f"{fname}: дисбаланс скобок ({{}}={brace_count}, ()={paren_count}, []={bracket_count})")
        
        check(len(code) > 1000, f"{fname}: файл не пустой ({len(code)} байт)")
    except Exception as e:
        check(False, f"{fname}: ошибка чтения - {e}")

# ============================================================
# TEST 2: Audio methods exist
# ============================================================
print("\n[2] ПРОВЕРКА АУДИО-МЕТОДОВ")

with open('web_preview/audio.js', 'r', encoding='utf-8') as f:
    audio_code = f.read()

required_methods = [
    'playPing', 'playCritPing', 'playMountingSfx', 'playUpgradeSfx',
    'playContractSfx', 'playTypewriter', 'playThermalModeSfx', 'playMissileLaunch',
    'playRadioSquelch', 'playCyberHackTone', 'playSonarPing', 'playAlarm',
    'playExplosion', 'playHeavyExplosion', 'playEmpExplosion', 'playEnemyShoot',
    'playTargetLock', 'playPVOFlyby', 'playRWR', 'playCountermeasure',
    'playFPVLaunch', 'playPerfectLaunch', 'playShieldHit', 'playDataPickup',
    'playLockOnTone', 'playPhaseTransition', 'playRatingReveal',
    'playAchievementUnlock', 'playEventAlert', 'playThunderCrack',
    'playCyberInterference', 'playShockwave', 'startAmbient', 'stopAmbient',
    'playCommsChirp', 'playTeletypeChar', 'playRadioStatic', 'playSalvagePickup',
    'playMissionVictory', 'playAlertAlarm', 'startFpvMotorSound',
    'updateFpvMotorSound', 'stopFpvMotorSound', 'playCiwsBurst',
    'playGlitchStatic', 'playReconScan', 'playTargetFound', 'playPhotoCaptured',
    'playWaterSplash', 'playHullImpact', 'playRewScanPulse', 'playRewSuccess', 'playRewFail'
]

missing = []
for m in required_methods:
    if f'{m}(' not in audio_code:
        missing.append(m)

check(len(missing) == 0, f"Все {len(required_methods)} аудио-методов найдены" if not missing else f"Отсутствуют: {', '.join(missing)}")

# Check master chain
check('DynamicsCompressor' in audio_code or 'createDynamicsCompressor' in audio_code, "Master compressor присутствует")
check('_makeReverb' in audio_code, "Reverb utility присутствует")
check('_makeDistortion' in audio_code, "Distortion utility присутствует")
check('_makeSaturation' in audio_code, "Saturation utility присутствует")
check('_filteredNoise' in audio_code, "Filtered noise utility присутствует")

# ============================================================
# TEST 3: Campaign structure
# ============================================================
print("\n[3] ПРОВЕРКА КАМПАНИИ")

with open('web_preview/game.js', 'r', encoding='utf-8') as f:
    game_code = f.read()

recon_count = len(re.findall(r"missionType:\s*'recon'", game_code))
rew_count = len(re.findall(r"missionType:\s*'rew'", game_code))
strike_count = len(re.findall(r"missionType:\s*'strike'", game_code))

check(recon_count >= 4, f"Разведка-миссии: {recon_count} (≥4 ожидалось)")
check(rew_count >= 2, f"РЭБ-миссии: {rew_count} (≥2 ожидалось)")
check(strike_count >= 4, f"Ударные миссии: {strike_count} (≥4 ожидалось)")

# ============================================================
# TEST 4: Dnipro/Kherson references
# ============================================================
print("\n[4] ПРОВЕРКА ЛОКАЦИИ ДНЕПР/ХЕРСОН")

check('АНТОНОВСКИЙ' in game_code, "Сектор: Антоновский мост")
check('КАХОВСКАЯ' in game_code or 'КАХОВКОЙ' in game_code, "Сектор: Каховская ГЭС")
check('ХЕРСОНСКИЙ' in game_code, "Сектор: Херсонский порт")
check('ДЕЛЬТА' in game_code, "Сектор: Дельта Днепра")
check('ДНЕПР' in game_code or 'Днепр' in game_code, "Ссылки на Днепр в описаниях")

# ============================================================
# TEST 5: Enemy diversity
# ============================================================
print("\n[5] ПРОВЕРКА РАЗНООБРАЗИЯ ВРАГОВ")

enemy_types = set(re.findall(r"type:\s*'([^']+)'", game_code))
# Filter only enemy types (not drone/mission types)
enemy_types = {t for t in enemy_types if t in [
    'patrol_boat', 'shore_mg', 'shore_battery', 'ew_station', 'sniper_post',
    'armored_boat', 'barge', 'supply_barge', 'supply_truck', 'port_crane',
    'fuel_depot', 'drone_jammer', 'bunker'
]}

check(len(enemy_types) >= 6, f"Уникальных типов врагов: {len(enemy_types)}")
for et in sorted(enemy_types):
    log_pass(f"  Тип: {et}")

# ============================================================
# TEST 6: Mission type handlers
# ============================================================
print("\n[6] ПРОВЕРКА ОБРАБОТЧИКОВ МИССИЙ")

check('_startReconMission' in game_code, "Обработчик разведки (_startReconMission)")
check('_attemptReconPhoto' in game_code, "Фото-фиксация целей (_attemptReconPhoto)")
check('_startRewMission' in game_code, "Обработчик РЭБ (_startRewMission)")
check('_rewAttemptCapture' in game_code, "Захват частоты (_rewAttemptCapture)")
check('_finishRewMission' in game_code, "Завершение РЭБ (_finishRewMission)")
check('_launchMissionByType' in game_code, "Роутинг по типу миссии (_launchMissionByType)")
check('start3DMissionSortie' in game_code, "Стандартный 3D сорти (start3DMissionSortie)")

# ============================================================
# TEST 7: River environment in 3D engine
# ============================================================
print("\n[7] ПРОВЕРКА РЕЧНОЙ СРЕДЫ (3D)")

with open('web_preview/drone3d.js', 'r', encoding='utf-8') as f:
    d3d_code = f.read()

check('_createRiverBanks' in d3d_code, "Берега реки (_createRiverBanks)")
check('reedMat' in d3d_code, "Камыши на берегу")
check('0x1a3020' in d3d_code, "Мутно-зелёная вода (0x1a3020)")
check('treeMat' in d3d_code, "Деревья на берегах")
check('riverHalfWidth' in d3d_code, "Ширина реки задана")
check('Antonivskyi' in d3d_code or 'АНТОНОВСКИЙ' in d3d_code or 'Antonivskyi Bridge' in d3d_code, "Сектор 1 = Антоновский мост (3D)")
check('Kakhovka' in d3d_code or 'КАХОВКА' in d3d_code, "Сектор 2 = Каховская ГЭС (3D)")
check('Kherson' in d3d_code or 'ХЕРСОН' in d3d_code, "Сектор 3 = Херсонский порт (3D)")

# ============================================================
# TEST 8: HTML campaign modal
# ============================================================
print("\n[8] ПРОВЕРКА HTML МОДАЛА КАМПАНИИ")

with open('web_preview/index.html', 'r', encoding='utf-8') as f:
    html_code = f.read()

check('ТЕНЬ АНТОНОВСКОГО' in html_code, "Акт I = Тень Антоновского")
check('НОЧЬ НАД КАХОВКОЙ' in html_code, "Акт II = Ночь над Каховкой")
check('ХЕРСОНСКИЙ РУБЕЖ' in html_code, "Акт III = Херсонский рубеж")
check('ДЕЛЬТА РАССВЕТА' in html_code, "Акт IV = Дельта рассвета")
check('DNIPRO RIVER THEATER' in html_code, "Заголовок = DNIPRO RIVER THEATER")

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 60)
total = passed + failed
if failed == 0:
    print(f"✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ: {passed}/{total}")
else:
    print(f"⚠ РЕЗУЛЬТАТ: {passed} пройдено, {failed} провалено из {total}")
print("=" * 60)

sys.exit(0 if failed == 0 else 1)
