const fs = require('fs');
let lines = fs.readFileSync('index.html', 'utf8').split('\n');

// Find the orphaned help content between techtree-modal closing and settings-modal
// The techtree modal ends, then there's orphaned help content, then SETTINGS MODAL starts
let settingsStart = -1;
let orphanStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<!-- SETTINGS MODAL -->')) {
    // First occurrence of SETTINGS MODAL comment
    if (settingsStart === -1) {
      settingsStart = i;
      // Look backwards from here to find the end of techtree-modal
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].trim() === '</div>') {
          // Check if the line before the </div> chain is end of techtree
          // We want to find where the clean code ends after techtree-modal
          continue;
        }
        break;
      }
    }
  }
}

// Find the second SETTINGS MODAL (the real one after the orphan)
let realSettingsIdx = -1;
for (let i = settingsStart + 1; i < lines.length; i++) {
  if (lines[i].includes('<!-- SETTINGS MODAL -->')) {
    realSettingsIdx = i;
    break;
  }
}

if (realSettingsIdx > 0) {
  // Remove from settingsStart (the orphan marker) to realSettingsIdx-1
  console.log(`Removing orphan lines ${settingsStart + 1} to ${realSettingsIdx}`);
  lines.splice(settingsStart, realSettingsIdx - settingsStart);
  fs.writeFileSync('index.html', lines.join('\n'));
  console.log('Done. File updated.');
} else {
  // No second settings modal, just remove orphan content after first SETTINGS MODAL comment
  // Find the actual <div id="settings-modal"> after the comment
  let divIdx = -1;
  for (let i = settingsStart + 1; i < lines.length; i++) {
    if (lines[i].includes('id="settings-modal"')) {
      divIdx = i;
      break;
    }
  }
  if (divIdx > settingsStart + 1) {
    console.log(`Removing orphan lines ${settingsStart + 2} to ${divIdx}`);
    lines.splice(settingsStart + 1, divIdx - settingsStart - 1);
    fs.writeFileSync('index.html', lines.join('\n'));
    console.log('Done. File updated.');
  } else {
    console.log('No orphan content found to remove.');
  }
}
