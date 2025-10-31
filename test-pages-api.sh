#!/bin/bash

echo "=== Testing Pages API ==="
echo ""

echo "1. Get all pages:"
curl -s https://yonetim.netrandevu.com/api/pages | jq '.'
echo ""
echo ""

echo "2. Get KVKK page:"
curl -s https://yonetim.netrandevu.com/api/pages/kvkk | jq '.'
echo ""
echo ""

echo "3. Get Hakkimizda page:"
curl -s https://yonetim.netrandevu.com/api/pages/hakkimizda | jq '.'
echo ""

