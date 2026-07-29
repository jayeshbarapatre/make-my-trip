#!/bin/bash
# End-to-end user journey test against the local backend
BASE="http://localhost:5000/api/v1"
TS=$(date +%s)
PASS=0; FAIL=0

check() { # name, condition
  if [ "$2" = "true" ]; then PASS=$((PASS+1)); echo "  PASS: $1"; else FAIL=$((FAIL+1)); echo "  FAIL: $1 -- $3"; fi
}

json() { python -c "import json,sys
try:
  d=json.load(sys.stdin)
  v=d
  for k in sys.argv[1].split('.'):
    v=v[int(k)] if k.isdigit() else v.get(k)
    if v is None: break
  print(v if v is not None else '')
except Exception as e:
  print('')" "$1"; }

echo "=== 1. AUTH: register two users ==="
U1=$(curl -s -m 15 -X POST $BASE/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Alice Traveller\",\"email\":\"alice$TS@test.com\",\"password\":\"alicepass123\",\"phone\":\"9000000001\"}")
T1=$(echo "$U1" | json data.token); ID1=$(echo "$U1" | json data.user.id)
U2=$(curl -s -m 15 -X POST $BASE/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Bob Explorer\",\"email\":\"bob$TS@test.com\",\"password\":\"bobpass12345\",\"phone\":\"9000000002\"}")
T2=$(echo "$U2" | json data.token); ID2=$(echo "$U2" | json data.user.id)
check "register alice" $([ -n "$T1" ] && echo true || echo false) "$U1"
check "register bob" $([ -n "$T2" ] && echo true || echo false) "$U2"

echo "=== 2. AUTH: login + session restore ==="
L1=$(curl -s -m 15 -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"alice$TS@test.com\",\"password\":\"alicepass123\"}")
T1=$(echo "$L1" | json data.token)
check "login alice" $([ -n "$T1" ] && echo true || echo false) "$L1"
P1=$(curl -s -m 15 $BASE/auth/profile -H "Authorization: Bearer $T1")
check "profile restore returns data.user" $([ "$(echo "$P1" | json data.user.name)" = "Alice Traveller" ] && echo true || echo false) "$P1"
BAD=$(curl -s -m 15 -X POST $BASE/auth/login -H "Content-Type: application/json" -d "{\"email\":\"alice$TS@test.com\",\"password\":\"wrongpass99\"}")
check "wrong password rejected" $([ "$(echo "$BAD" | json message)" = "Invalid email or password." ] && echo true || echo false) "$BAD"

echo "=== 3. FLIGHT: search -> details -> book ==="
FS=$(curl -s -m 20 "$BASE/flights/search?from=Delhi&to=Mumbai")
FID=$(echo "$FS" | json data.0.id); FPRICE=$(echo "$FS" | json data.0.price); FSEATS=$(echo "$FS" | json data.0.seatsAvailable)
check "flight search from Firestore" $([ -n "$FID" ] && echo true || echo false) "$FS"
FD=$(curl -s -m 15 "$BASE/flights/$FID")
check "flight details" $([ "$(echo "$FD" | json data.id)" = "$FID" ] && echo true || echo false) "$FD"
FB=$(curl -s -m 20 -X POST $BASE/bookings/flights -H "Content-Type: application/json" -H "Authorization: Bearer $T1" -d "{\"type\":\"flight\",\"flightId\":\"$FID\",\"totalAmount\":$FPRICE,\"fromCity\":\"Delhi\",\"toCity\":\"Mumbai\",\"departureDate\":\"2026-08-05\",\"passengers\":[\"Alice Traveller\"],\"userEmail\":\"alice$TS@test.com\",\"userName\":\"Alice\"}")
FBID=$(echo "$FB" | json data.id)
check "flight booking created" $([ "$(echo "$FB" | json success)" = "True" ] && echo true || echo false) "$FB"
FSEATS2=$(curl -s -m 15 "$BASE/flights/$FID" | json data.seatsAvailable)
check "flight seats decremented ($FSEATS -> $FSEATS2)" $([ "$FSEATS2" = "$((FSEATS-1))" ] && echo true || echo false)

echo "=== 4. HOTEL: search -> book ==="
HS=$(curl -s -m 20 "$BASE/hotels?city=Mumbai&checkIn=2026-08-10&checkOut=2026-08-12")
HID=$(echo "$HS" | json data.0.id); HNAME=$(echo "$HS" | json data.0.name)
check "hotel search" $([ -n "$HID" ] && echo true || echo false) "$HS"
HB=$(curl -s -m 20 -X POST $BASE/bookings/hotels -H "Content-Type: application/json" -H "Authorization: Bearer $T1" -d "{\"type\":\"hotel\",\"hotelId\":\"$HID\",\"totalAmount\":8000,\"hotelName\":\"$HNAME\",\"fromCity\":\"$HNAME\",\"departureDate\":\"2026-08-10\",\"returnDate\":\"2026-08-12\",\"rooms\":1,\"nights\":2,\"userEmail\":\"alice$TS@test.com\"}")
check "hotel booking created" $([ "$(echo "$HB" | json success)" = "True" ] && echo true || echo false) "$HB"

echo "=== 5. TRAIN: search -> book ==="
TS_R=$(curl -s -m 20 "$BASE/trains?from=Delhi&to=Mumbai")
TRID=$(echo "$TS_R" | json data.0.id)
check "train search" $([ -n "$TRID" ] && echo true || echo false) "$TS_R"
TB=$(curl -s -m 20 -X POST $BASE/bookings/trains -H "Content-Type: application/json" -H "Authorization: Bearer $T1" -d "{\"type\":\"train\",\"trainId\":\"$TRID\",\"totalAmount\":2100,\"fromCity\":\"Delhi\",\"toCity\":\"Mumbai\",\"departureDate\":\"2026-08-07\",\"passengers\":[{\"name\":\"Alice\",\"age\":30}],\"userEmail\":\"alice$TS@test.com\"}")
check "train booking created" $([ "$(echo "$TB" | json success)" = "True" ] && echo true || echo false) "$TB"

echo "=== 6. BUS: search -> book ==="
BS=$(curl -s -m 20 "$BASE/buses?from=Bangalore")
BID=$(echo "$BS" | json data.0.id)
check "bus search" $([ -n "$BID" ] && echo true || echo false) "$BS"
BB=$(curl -s -m 20 -X POST $BASE/bookings/buses -H "Content-Type: application/json" -H "Authorization: Bearer $T1" -d "{\"type\":\"bus\",\"busId\":\"$BID\",\"totalAmount\":950,\"fromCity\":\"Bangalore\",\"toCity\":\"Agra\",\"departureDate\":\"2026-08-09\",\"passengers\":[{\"name\":\"Alice\"}],\"userEmail\":\"alice$TS@test.com\"}")
check "bus booking created" $([ "$(echo "$BB" | json success)" = "True" ] && echo true || echo false) "$BB"

echo "=== 7. CAB: search -> book ==="
CS=$(curl -s -m 20 "$BASE/cabs?from=Pune")
CID=$(echo "$CS" | json data.0.id)
check "cab search" $([ -n "$CID" ] && echo true || echo false) "$CS"
CB=$(curl -s -m 20 -X POST $BASE/bookings/cabs -H "Content-Type: application/json" -H "Authorization: Bearer $T1" -d "{\"type\":\"cab\",\"cabId\":\"$CID\",\"totalAmount\":600,\"fromCity\":\"Pune\",\"toCity\":\"Airport\",\"departureDate\":\"2026-08-01\",\"userEmail\":\"alice$TS@test.com\"}")
check "cab booking created" $([ "$(echo "$CB" | json success)" = "True" ] && echo true || echo false) "$CB"

echo "=== 8. MY TRIPS: isolation ==="
MT1=$(curl -s -m 20 "$BASE/bookings/user/me" -H "Authorization: Bearer $T1")
N1=$(echo "$MT1" | python -c "import json,sys; print(len(json.load(sys.stdin)['data']))")
check "alice sees 5 bookings (got $N1)" $([ "$N1" = "5" ] && echo true || echo false) "$MT1"
MT2=$(curl -s -m 20 "$BASE/bookings/user/me" -H "Authorization: Bearer $T2")
N2=$(echo "$MT2" | python -c "import json,sys; print(len(json.load(sys.stdin)['data']))")
check "bob sees 0 bookings (got $N2)" $([ "$N2" = "0" ] && echo true || echo false) "$MT2"
CROSS=$(curl -s -m 15 -o /dev/null -w "%{http_code}" "$BASE/bookings/$FBID" -H "Authorization: Bearer $T2")
check "bob cannot read alice's booking (403, got $CROSS)" $([ "$CROSS" = "403" ] && echo true || echo false)
NOAUTH=$(curl -s -m 15 -o /dev/null -w "%{http_code}" "$BASE/bookings/user/me")
check "unauthenticated bookings rejected (401, got $NOAUTH)" $([ "$NOAUTH" = "401" ] && echo true || echo false)

echo "=== 9. BOOKING DETAILS + CANCEL ==="
BD=$(curl -s -m 15 "$BASE/bookings/$FBID" -H "Authorization: Bearer $T1")
check "alice reads own booking" $([ "$(echo "$BD" | json success)" = "True" ] && echo true || echo false) "$BD"
CN=$(curl -s -m 15 -X PUT "$BASE/bookings/cancel/$FBID" -H "Authorization: Bearer $T1")
check "cancel booking" $([ "$(echo "$CN" | json data.status)" = "cancelled" ] && echo true || echo false) "$CN"
CN2=$(curl -s -m 15 -X PUT "$BASE/bookings/cancel/$FBID" -H "Authorization: Bearer $T1")
check "double-cancel rejected" $([ "$(echo "$CN2" | json message)" = "Booking is already cancelled" ] && echo true || echo false) "$CN2"

echo "=== 10. PROFILE UPDATE ==="
UP=$(curl -s -m 15 -X PUT $BASE/user/update -H "Content-Type: application/json" -H "Authorization: Bearer $T1" -d '{"name":"Alice T. Updated","phone":"9111111111"}')
check "profile update" $([ "$(echo "$UP" | json data.user.name)" = "Alice T. Updated" ] && echo true || echo false) "$UP"

echo "=== 11. PASSWORD RESET FLOW ==="
FP=$(curl -s -m 25 -X POST $BASE/auth/forgot-password -H "Content-Type: application/json" -d "{\"email\":\"alice$TS@test.com\"}")
check "forgot-password accepted" $([ "$(echo "$FP" | json success)" = "True" ] && echo true || echo false) "$FP"

echo ""
echo "RESULT: $PASS passed, $FAIL failed"
echo "ALICE_EMAIL=alice$TS@test.com"
