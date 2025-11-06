# Quick Start Guide

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend server (in one terminal):
   ```bash
   npm run server
   ```

3. Start the React dev server (in another terminal):
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Features

✅ **Fully Editable**: Click any text/value on the page to edit it
✅ **Auto-Save**: All changes are saved to localStorage automatically
✅ **Load Jira Data**: Click "Load Jira Info" to fetch fresh data from Jira
✅ **Export CSV**: Export your report as CSV

## Editing Data

- Click on any displayed text or value to edit it
- Press Enter to save, Escape to cancel
- Changes are automatically saved to localStorage
- Only reload from Jira when you click "Load Jira Info"

## Troubleshooting

If you see TypeScript errors in your IDE:
- Restart your TypeScript server (VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")
- The code will work fine when running - these are often IDE cache issues

If the app doesn't load:
- Make sure both servers are running (backend on port 3000, frontend on port 5173)
- Check browser console for errors
- Verify your API token is correct

