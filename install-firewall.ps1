param([int]$Port=3000)
New-NetFirewallRule -DisplayName "JB Smart Office TCP $Port" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Domain,Private
Write-Host "Firewall rule created for TCP port $Port."
