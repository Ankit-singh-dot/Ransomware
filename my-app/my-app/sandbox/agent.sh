
echo "[AEGIS-AGENT] Starting file monitor on /sandbox/data..."


API_URL="http://host.docker.internal:3000/api/events"
CONTAINER_ID=$(hostname)


until curl -s "http://host.docker.internal:3000/api/agent" > /dev/null; do
  echo "[AEGIS-AGENT] Waiting for AEGIS control plane at $API_URL..."
  sleep 2
done
echo "[AEGIS-AGENT] Connected to control plane!"


inotifywait -m -r -e create -e modify -e move -e delete --format '%w%f %e' /sandbox/data | while read FILE EVENT; do
  EVENT_TYPE="UNKNOWN"
  case "$EVENT" in
    *CREATE*|*MODIFY*) EVENT_TYPE="FILE_WRITE" ;;
    *MOVED_TO*)        EVENT_TYPE="FILE_RENAME" ;;
    *DELETE*)          EVENT_TYPE="FILE_DELETE" ;;
  esac
  
  if [ "$EVENT_TYPE" != "UNKNOWN" ]; then
    # Stream event to AEGIS engine
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "[{
        \"timestamp\": \"$(date -Iseconds)\",
        \"containerId\": \"aegis-target\",
        \"eventType\": \"$EVENT_TYPE\",
        \"filePath\": \"$FILE\",
        \"processName\": \"docker-process\"
      }]" > /dev/null
  fi
done
