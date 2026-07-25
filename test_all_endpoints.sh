#!/bin/bash

BACKEND="http://localhost:5000/api/v1"

echo "=== Testing All Endpoints ==="
echo

echo "✓ FLIGHTS:"
curl -s "$BACKEND/flights?from=DEL&to=BOM" | jq '.data | length' 2>/dev/null || echo "Failed"
echo

echo "✓ HOTELS:"
curl -s "$BACKEND/hotels?city=Mumbai" | jq '. | length' 2>/dev/null || echo "Failed"
echo

echo "✓ BUSES:"
curl -s "$BACKEND/buses?from=DEL&to=BOM" | jq '. | length' 2>/dev/null || echo "Failed"
echo

echo "✓ TRAINS:"
curl -s "$BACKEND/trains?from=DEL&to=BOM" | jq '. | length' 2>/dev/null || echo "Failed"
echo

echo "✓ CABS:"
curl -s "$BACKEND/cabs?from=DEL&to=BOM" | jq '. | length' 2>/dev/null || echo "Failed"
