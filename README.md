# Mercotrace starter

```
backend/   Spring Boot 3 (Java 17) + MySQL + JWT      -> http://localhost:8080
web/       React (Vite)                               -> http://localhost:5173
mobile/    React Native (Expo)
shared/    API client + validators used by BOTH web and mobile
```

Change `shared/api.js` or `shared/validators.js` once and both apps pick it up.
Change the backend once and both apps get the new behaviour.

## 1. Backend
Requires Java 17+, Maven, and MySQL running locally.

```bash
cd backend
export DB_USER=root DB_PASSWORD=yourpassword      # Windows PowerShell: $env:DB_PASSWORD="yourpassword"
mvn spring-boot:run
```
The `mercotrace` database and tables are created automatically, and the seed user is added on first start:

| Email | Mobile | Password |
|---|---|---|
| admin@mercotrace.com | 9999999999 | Admin@123 |

Change these with `SEED_EMAIL`, `SEED_MOBILE`, `SEED_PASSWORD`, `SEED_USERNAME`. The password is stored as a BCrypt hash.
Before deploying, set a real `JWT_SECRET` (32+ characters).

## 2. Web
```bash
cd web
npm install
npm run dev
```
API address is in `web/.env` (`VITE_API_URL`).

## 3. Mobile
```bash
cd mobile
npm install
npx expo install --fix     # aligns package versions with your installed Expo SDK
npx expo start
```
Set the API address in `mobile/src/config.js`:
- Android emulator: `http://10.0.2.2:8080` (default)
- iOS simulator: `http://localhost:8080` (default)
- Real phone: your computer's LAN IP, e.g. `http://192.168.1.20:8080`, on the same Wi-Fi.

## API
| Endpoint | Purpose |
|---|---|
| POST /api/auth/login `{identifier, password}` | identifier = email OR mobile |
| POST /api/auth/refresh `{refreshToken}` | new token pair |
| GET / PUT /api/profile | read / update username, name, email, mobile, address |
| PUT /api/profile/password `{currentPassword, newPassword}` | change password |
| GET /api/dashboard | commodity counts |
| GET, POST /api/commodities; PUT, DELETE /api/commodities/{id} | commodity CRUD (per user) |

## Next steps
- Switch `ddl-auto=update` to Flyway migrations + `validate` for production.
- Serve the API over HTTPS and restrict `CORS_ORIGINS` to your web domain.
- Add OTP login for mobile numbers (SMS provider) if you do not want passwords there.
