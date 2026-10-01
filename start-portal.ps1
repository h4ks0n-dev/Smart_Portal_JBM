param([int]$Port=3000)
$env:PORT=$Port
$env:HOST="0.0.0.0"
node server.js
