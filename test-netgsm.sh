#!/bin/bash

# NetGSM API Test Script
# Usage: ./test-netgsm.sh YOUR_USERNAME YOUR_PASSWORD

USERCODE="${1:-8503036723}"
PASSWORD="${2:-Ozan.1903}"
PHONE="905551234567"  # Test için numara

echo "🔧 Testing NetGSM API..."
echo "Username: $USERCODE"
echo "Phone: $PHONE"
echo ""

# XML Request
XML="<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<mainbody>
  <header>
    <company dil=\"TR\">Netgsm</company>
    <usercode>$USERCODE</usercode>
    <password>$PASSWORD</password>
    <type>1:n</type>
    <msgheader>$USERCODE</msgheader>
  </header>
  <body>
    <msg><![CDATA[Test mesaji - NetRandevu]]></msg>
    <no>$PHONE</no>
  </body>
</mainbody>"

echo "📤 Sending request to NetGSM..."
RESPONSE=$(curl -s -X POST https://api.netgsm.com.tr/sms/send/xml \
  -H "Content-Type: application/xml" \
  -d "$XML")

echo "📥 Response: $RESPONSE"
echo ""

# Parse response
CODE=$(echo "$RESPONSE" | cut -d' ' -f1)

case "$CODE" in
  "00"|"01")
    echo "✅ SUCCESS! SMS sent successfully."
    echo "Bulk ID: $(echo "$RESPONSE" | cut -d' ' -f2)"
    ;;
  "20")
    echo "❌ ERROR 20: Mesaj metninde hata var"
    ;;
  "30")
    echo "❌ ERROR 30: Geçersiz kullanıcı adı veya şifre"
    echo ""
    echo "🔍 Kontrol edin:"
    echo "  1. NetGSM panelinde API kullanıcısı oluşturdunuz mu?"
    echo "  2. Kullanıcı adı ve şifre doğru mu?"
    echo "  3. API erişimi aktif mi?"
    ;;
  "40")
    echo "❌ ERROR 40: Mesaj başlığı (header) hatalı"
    ;;
  "50")
    echo "❌ ERROR 50: Abone hesabınız ile API erişim izniz bulunmamaktadır"
    echo ""
    echo "🔍 Hesabınızın API kullanıcı tipinde olduğundan emin olun!"
    ;;
  "70")
    echo "❌ ERROR 70: Hatalı sorgulama"
    ;;
  *)
    echo "❌ UNKNOWN ERROR: $CODE"
    ;;
esac
