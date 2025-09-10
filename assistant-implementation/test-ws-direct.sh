#!/bin/bash
# Direct WebSocket test with authentication

echo "Testing direct WebSocket connection..."

# Create a simple auth message
AUTH_MSG='{"type":"initialize_session","authToken":"test-token-123456789","userId":"test-user"}'

# Use websocat if available, otherwise use curl
if command -v websocat &> /dev/null; then
    echo "$AUTH_MSG" | websocat -n1 wss://d3m4wrd20w0beh.cloudfront.net/ws
else
    # Basic curl test
    curl -i -N \
        -H "Connection: Upgrade" \
        -H "Upgrade: websocket" \
        -H "Sec-WebSocket-Version: 13" \
        -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
        -H "Origin: https://d3m4wrd20w0beh.cloudfront.net" \
        https://d3m4wrd20w0beh.cloudfront.net/ws
fi
