# JB Smart Office — Internal Company Portal

JB Mechanical Metal Industries LLC — **Precision in Motion. Expertise at Work.**

This package is an internal pilot/MVP for centralized IT and administration workflows.

### Modules
- Dashboard
- IT Helpdesk / tickets
- Asset register
- Purchasing requests
- Inventory / low-stock visibility
- Employee onboarding
- Maintenance schedule
- Management reports
- Admin user management
- User password change

### Run
```powershell
npm start
```
Or:
```powershell
.\start-portal.ps1 -Port 3001
```
Then open `http://SERVER-IP:PORT` from an authorized company PC.

### Pilot credentials
All seeded pilot accounts use `ChangeMe123!`. Change them before real use.

### Production target
`Department PC -> HTTPS/IIS -> JB Smart Office -> SQL Server`

Authentication target: company Microsoft/Active Directory or Entra ID accounts with role/department mapping.

See `DEPLOYMENT.md` for the LAN deployment checklist.
