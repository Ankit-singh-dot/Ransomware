#!/bin/bash
# AEGIS Safe Ransomware Simulator
# ================================
# This simulator ONLY operates on synthetic files inside /sandbox/data.
# It does NOT access the host filesystem, personal files, or real data.
# It does NOT spread, persist, or communicate with real C2 infrastructure.
# Its sole purpose is to generate ransomware-like filesystem behavior for AEGIS testing.

set -e

MODE="${1:-normal}"
DATA_DIR="/sandbox/data"
SPEED="${2:-fast}" # slow, normal, fast

echo "[SIMULATOR] Mode: $MODE"
echo "[SIMULATOR] Data dir: $DATA_DIR"
echo "[SIMULATOR] Speed: $SPEED"

case $SPEED in
  slow)   DELAY=0.5;;
  normal) DELAY=0.2;;
  fast)   DELAY=0.05;;
  *)      DELAY=0.1;;
esac

# ─── NORMAL MODE ─────────────────────────────────────────────────
normal_workload() {
  echo "[SIMULATOR] Running normal workload..."
  
  # Simulate normal file operations: occasional reads, rare writes
  for i in $(seq 1 20); do
    # Read a random file
    FILE=$(find "$DATA_DIR" -type f 2>/dev/null | shuf -n 1)
    if [ -n "$FILE" ]; then
      cat "$FILE" > /dev/null 2>&1
      echo "[NORMAL] Read: $FILE"
    fi
    
    # Occasionally write a log entry (normal behavior)
    if [ $((i % 5)) -eq 0 ]; then
      echo "[INFO] Normal operation at $(date)" >> "$DATA_DIR/logs/normal_activity.log"
      echo "[NORMAL] Write: $DATA_DIR/logs/normal_activity.log"
    fi
    
    sleep "$DELAY"
  done
  
  echo "[SIMULATOR] Normal workload complete"
}

# ─── RANSOMWARE SIMULATION ──────────────────────────────────────
ransomware_simulation() {
  echo "[SIMULATOR] ⚠️  Starting ransomware simulation (SAFE - synthetic files only)..."
  echo "[SIMULATOR] Target: $DATA_DIR"
  
  echo "[SIMULATOR] Phase 0: Dropping ransom note & contacting C2"
  echo "YOUR FILES HAVE BEEN ENCRYPTED - THIS IS A SIMULATION" > "$DATA_DIR/RANSOM_NOTE.txt"
  echo "This file was created by the AEGIS safe ransomware simulator." >> "$DATA_DIR/RANSOM_NOTE.txt"
  
  # Trigger the C2 Network Traceback
  ping -c 5 198.51.100.42 > /dev/null 2>&1 &

  # Phase 1: Rapid file modification
  echo "[SIMULATOR] Phase 1: Rapid file modification"
  find "$DATA_DIR" -type f -name "*.txt" | while read -r FILE; do
    # Overwrite with random data (simulates encryption)
    dd if=/dev/urandom bs=1024 count=2 2>/dev/null > "$FILE"
    echo "[RANSOMWARE] Modified: $FILE"
    sleep "$DELAY"
  done
  
  # Phase 2: Mass rename with suspicious extension
  echo "[SIMULATOR] Phase 2: Mass file rename"
  find "$DATA_DIR" -type f -name "*.conf" | while read -r FILE; do
    mv "$FILE" "${FILE}.locked"
    echo "[RANSOMWARE] Renamed: $FILE -> ${FILE}.locked"
    sleep "$DELAY"
  done
  
  # Phase 3: Attack CSV files
  echo "[SIMULATOR] Phase 3: Modifying data files"
  find "$DATA_DIR" -type f -name "*.csv" | while read -r FILE; do
    dd if=/dev/urandom bs=512 count=1 2>/dev/null > "$FILE"
    echo "[RANSOMWARE] Encrypted: $FILE"
    sleep "$DELAY"
  done
  
  # Phase 4: Attack markdown files
  echo "[SIMULATOR] Phase 4: Modifying project files"
  find "$DATA_DIR" -type f -name "*.md" | while read -r FILE; do
    dd if=/dev/urandom bs=256 count=1 2>/dev/null > "$FILE"
    mv "$FILE" "${FILE}.encrypted"
    echo "[RANSOMWARE] Encrypted+Renamed: $FILE"
    sleep "$DELAY"
  done
  
  echo "[SIMULATOR] ⚠️  Ransomware simulation complete"
}

# ─── MAIN ────────────────────────────────────────────────────────
case $MODE in
  normal)
    normal_workload
    ;;
  ransomware)
    ransomware_simulation
    ;;
  *)
    echo "[SIMULATOR] Unknown mode: $MODE. Use 'normal' or 'ransomware'"
    exit 1
    ;;
esac
