# JB Smart Office — Internal Pilot Deployment

## 1. Server requirements
- Windows Server or dedicated Windows PC on the company LAN
- Node.js LTS installed
- Static/reserved LAN IP recommended
- Company firewall policy permitting the chosen internal TCP port

## 2. Install
Extract the folder to e.g. `D:\JB-Smart-Office`.

Open PowerShell in the folder:

```powershell
npm start
```

For port 3001:

```powershell
.\start-portal.ps1 -Port 3001
```

## 3. Allow LAN access
Run PowerShell as Administrator:

```powershell
.\install-firewall.ps1 -Port 3001
```

Find the server IPv4 address with `ipconfig`, then from an authorized department PC open:

`http://SERVER-IP:3001`

## 4. Test health
Open:

`http://SERVER-IP:3001/api/health`

Expected response contains `"ok":true`.

## 5. Accounts
All pilot accounts use `@jbmech.net` and the temporary password `ChangeMe123!` in the included account register. Change every password before operational use.

## 6. Data
The MVP stores data in `data/db.json`. Back up this file daily during the pilot.

## 7. Production hardening before wider rollout
1. Move data to SQL Server.
2. Use Microsoft Entra ID / Active Directory authentication if available.
3. Put the app behind IIS with HTTPS.
4. Add scheduled backups and restore testing.
5. Add audit logging for administrative actions.
6. Replace temporary seeded accounts with real named employee accounts.
7. Restrict server and database access using least privilege.
