# Motion Raycast Extension

A Raycast extension for managing Motion tasks directly from your command bar.

## Features

- **Search Tasks**: View and search through all your Motion tasks with advanced filtering
- **Detailed Task View**: Rich task details with metadata, scheduling info, and team information
- **Smart Filtering**: Filter by completion status, priority level, or view all tasks
- **Intelligent Sorting**: Tasks automatically sorted by priority, due date, and creation time
- **Quick Actions**: Open tasks in Motion, copy task names, IDs, or URLs
- **Visual Indicators**: Priority-based icons, completion status, and scheduling issue warnings
- **Task Creation**: Create new Motion tasks directly from Raycast with full form support

## Setup

1. **Get your Motion API Key**:
   - Go to [Motion Settings > API](https://app.usemotion.com/settings/api)
   - Generate a new API key
   - Copy the key

2. **Install the Extension**:
   - Run `npm install && npm run dev` in the extension directory
   - Open Raycast and you'll see the Motion commands

3. **Configure API Key**:
   - When you first run a Motion command, Raycast will prompt you for your API key
   - Paste the API key you copied from Motion
   - The key will be securely stored in your system keychain

## Commands

### Search Tasks
- **Command**: `Search Tasks`
- **Description**: Lists all your Motion tasks with advanced search and filtering
- **Features**:
  - Priority indicators (🔴 ASAP, 🟠 High, 🟡 Medium, 🔵 Low)
  - Task status and project information
  - Due date display with intelligent sorting
  - Assignee information and team details
  - Completion status indicators
  - Scheduling issue warnings
  - **Filter Dropdown**: Filter by completion status or priority level
  - **Detailed View**: Press Enter or click "Show Details" for comprehensive task information

### Capture Motion Task
- **Command**: `Capture Motion Task`
- **Description**: Create new Motion tasks with a comprehensive form
- **Features**:
  - Task name and description (with Markdown support)
  - Priority selection with visual indicators
  - Due date picker
  - Deadline type configuration (Hard/Soft/None)
  - Duration settings
  - Automatic Motion scheduling integration

### Actions Available
- **Show Details**: Opens detailed task view with full metadata (Enter)
- **Open in Motion**: Opens the task in the Motion web app
- **Copy Task Name**: Copies the task name to clipboard (⌘C)
- **Copy Task ID**: Copies the task ID to clipboard (⌘⇧C)
- **Copy Task URL**: Copies the Motion task URL to clipboard (⌘⌥C)

## Development

To develop this extension:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## API Integration

This extension uses the Motion API v1. The following endpoints are currently integrated:

- `GET /v1/tasks` - List all tasks with filtering options

## Troubleshooting

- **"Failed to load tasks"**: Check that your API key is correct and has the necessary permissions
- **Empty task list**: Verify you have tasks in your Motion workspace
- **API errors**: Ensure your Motion account is active and the API key hasn't expired