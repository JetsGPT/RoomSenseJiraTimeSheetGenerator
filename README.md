# Jira Sprint Report Generator

A beautiful, modern React application to generate and edit detailed sprint reports from Jira. Built with React, TypeScript, Vite, and shadcn/ui components.

## Features

- 📊 **Detailed Sprint Reports**: View worklogs, story points, and time differences for each ticket
- ✏️ **Fully Editable**: Click any text or value to edit it on the fly - all changes are saved locally
- 💾 **Local Storage**: All data persists in your browser - no need to reload from Jira unless you want fresh data
- 👥 **Per-User Breakdown**: See individual contributions and summaries
- 📈 **Utilization Metrics**: Track planned vs actual hours with color-coded indicators
- 💬 **Comments Integration**: View and edit all comments for each issue
- 📥 **CSV Export**: Export reports for further analysis
- 🎨 **Modern UI**: Beautiful, responsive design with shadcn/ui components

## Setup

### Prerequisites

- Node.js 18+ and npm

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   - Navigate to `http://localhost:5173`
   - The Vite dev server will automatically proxy API requests to avoid CORS issues

### Production Build

1. **Build the React app**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   NODE_ENV=production npm run server
   ```

3. **Open your browser**:
   - Navigate to `http://localhost:3000`

## Usage

1. **Configure Jira Settings**:
   - Enter your Jira domain, email, API token, board ID, project key, and hours per story point
   - Configuration is automatically saved to local storage

2. **Load Jira Data**:
   - Click the "Load Jira Info" button to fetch fresh data from Jira
   - This will fetch the active sprint, issues, worklogs, and comments

3. **Edit Data**:
   - Click on any text or value displayed on the page to edit it
   - Changes are automatically saved to local storage
   - You can edit:
     - Sprint name and dates
     - User names
     - Ticket summaries, story points, hours logged
     - Comments
     - Summary table values

4. **Export**:
   - Click "Export as CSV" to download the report

## Configuration

- **Jira Domain**: Your Jira instance URL (e.g., `https://jetsgpt.atlassian.net`)
- **Email**: Your Atlassian account email
- **API Token**: Your Jira API token (get it from https://id.atlassian.com/manage/api-tokens)
- **Board ID**: The numeric ID of your Jira board
- **Project Key**: Your project key (e.g., `RoomSense`)
- **Hours per Story Point**: Conversion factor (default: 1)

## Important Notes

### CORS Handling

The application automatically handles CORS by:
- Using a proxy server in development (Vite dev server)
- Using the Express proxy server in production
- All API requests go through `/api/jira-proxy` endpoint

### Story Points Field

The application tries to detect story points from common custom field IDs (`customfield_10016`, `customfield_10020`). If your Jira instance uses a different custom field ID, modify the `getStoryPoints()` function in `src/services/jiraService.ts`.

### Local Storage

All data is stored in your browser's local storage:
- Configuration: `jira-config`
- Sprint data: `sprint-data`

To clear all data, use your browser's developer tools to clear local storage.

## Project Structure

```
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── ConfigSection.tsx
│   │   ├── SprintInfo.tsx
│   │   ├── UserBreakdown.tsx
│   │   ├── SummaryTable.tsx
│   │   └── EditableCell.tsx
│   ├── hooks/            # Custom React hooks
│   │   └── useLocalStorage.ts
│   ├── services/         # API services
│   │   └── jiraService.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   └── formatHours.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── server.js             # Express server for API proxy
├── vite.config.js        # Vite configuration
└── package.json
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling
- **Express** - Backend API proxy
- **Lucide React** - Icons

## Troubleshooting

- **"No active sprint found"**: Check that your board ID is correct and there's an active sprint
- **CORS errors**: The proxy should handle this automatically. Make sure the dev server is running
- **Empty report**: Verify your API token is correct and has proper permissions
- **Missing worklogs**: Ensure worklogs exist for the sprint time period
- **Type errors**: Make sure TypeScript is properly installed: `npm install -D typescript`

## License

MIT
