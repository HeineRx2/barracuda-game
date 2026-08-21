import os
import shutil
import glob

brain_dir = r"C:\Users\User\.gemini\antigravity-ide\brain\16937443-8519-479f-8540-34d473794f23"
target_textures = r"c:\Users\User\barracuda\assets\textures"

os.makedirs(target_textures, exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\assets\audio", exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\assets\fonts", exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\scenes\main", exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\scenes\drone", exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\scenes\ui", exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\scenes\minigame", exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\scripts\autoload", exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\scripts\main", exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\scripts\drone", exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\scripts\ui", exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\scripts\minigame", exist_ok=True)
os.makedirs(r"c:\Users\User\barracuda\shaders", exist_ok=True)

# Find latest images by prefix
def copy_latest(prefix, target_name):
    matches = glob.glob(os.path.join(brain_dir, f"{prefix}*.jpg"))
    if matches:
        latest = max(matches, key=os.path.getmtime)
        dest = os.path.join(target_textures, target_name)
        shutil.copyfile(latest, dest)
        print(f"Copied {latest} -> {dest}")

copy_latest("barracuda_drone_stealth", "drone_base.jpg")
copy_latest("barracuda_upgraded", "drone_upgraded.jpg")
copy_latest("enemy_warship_target", "enemy_target.jpg")
print("Folders and assets initialized successfully.")
