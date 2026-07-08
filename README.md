# Revenue Control Mobile App

This Expo app is a mobile companion for the existing Streamlit web project.
The web app remains the main system. This app only reads from the mobile API.

## Start API

From `D:\khateeb`:

```powershell
python -m uvicorn mobile:app --host 0.0.0.0 --port 8003
```

API docs:

```text
http://127.0.0.1:8003/docs
```

## Start mobile app

From `D:\khateeb\mobile_app`:

```powershell
npm install
npm run web
```

For a real phone on the same Wi-Fi, update `LAN_API_HOST` in `App.js` to the
computer local network IP, for example:

```js
const LAN_API_HOST = "192.168.1.20";
```
