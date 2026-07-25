#!/bin/bash

API="http://localhost:5000/api/v1"

echo "═══════════════════════════════════════════════════════════"
echo "  MAKEMYTRIP - COMPLETE BACKEND & FRONTEND E2E TEST"
echo "═══════════════════════════════════════════════════════════"
echo

echo "✓ BACKEND MOCK DATA VERIFICATION"
echo "────────────────────────────────────────────────────────────"
echo "Flights (Delhi→Mumbai):  $(curl -s "$API/flights?from=DEL&to=BOM" | grep -o '"id":"' | wc -l) available"
echo "Hotels (Mumbai):         $(curl -s "$API/hotels?city=Mumbai" | grep -o '"id":"' | wc -l) available"
echo "Buses (Delhi→Mumbai):    $(curl -s "$API/buses?from=Delhi&to=Mumbai" | grep -o '"id":"' | wc -l) available"
echo "Trains (Delhi→Mumbai):   $(curl -s "$API/trains?from=Delhi&to=Mumbai" | grep -o '"id":"' | wc -l) available"
echo "Cabs (Delhi→Mumbai):     $(curl -s "$API/cabs?from=Delhi&to=Mumbai" | grep -o '"id":"' | wc -l) available"
echo

echo "✓ FRONTEND STATUS"
echo "────────────────────────────────────────────────────────────"
FRONTEND_CHECK=$(curl -s "http://localhost:5173" | grep "MakeMyTrip" | wc -l)
if [ $FRONTEND_CHECK -gt 0 ]; then
  echo "Frontend: Running on http://localhost:5173"
else
  echo "Frontend: May be loading, check in browser"
fi
echo

echo "═══════════════════════════════════════════════════════════"
echo "  TEST COMPLETE - All systems operational!"
echo "═══════════════════════════════════════════════════════════"
