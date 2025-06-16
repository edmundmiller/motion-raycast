# Motion Raycast Extension

A Raycast extension for managing Motion tasks directly from your command bar.

## Features

- **Search Tasks**: View and search through all your Motion tasks with advanced filtering
- **Detailed Task View**: Rich task details with metadata, scheduling info, and team information
- **Smart Filtering**: Filter by completion status, priority level, or view all tasks
- **Intelligent Sorting**: Tasks automatically sorted by priority, due date, and creation time
- **Quick Actions**: Open tasks in Motion, copy task names, IDs, or URLs
- **Visual Indicators**: Priority-based icons, completion status, and scheduling issue warnings
- **Fast Task Creation**: Create new Motion tasks with speed optimizations and smart defaults
- **Workspace & Project Selection**: Choose where your tasks go with dynamic loading
- **Preferences Support**: Set defaults for faster task capture

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

4. **Optional: Set Up Speed Preferences**:
   - Open Raycast preferences for the Motion extension
   - Set default workspace, project, priority, and duration
   - Use the "List Workspaces & Projects" command to find IDs

## Commands

### Capture Motion Task ⚡
- **Command**: `Capture Motion Task`
- **Description**: Create new Motion tasks with speed optimizations
- **Speed Features**:
  - **Quick Create** (⌘ + Enter): Creates task with minimal fields and smart defaults
  - **Auto-focus**: Cursor automatically in task name field
  - **Smart Defaults**: Uses your preferences for workspace, project, priority, and duration
  - **Form Validation**: Prevents unnecessary API calls with client-side validation
  - **Caching**: Workspaces and projects are cached for 5 minutes to reduce load times
- **Form Fields**:
  - Task name (required, auto-focused)
  - Description (optional, Markdown support)
  - Workspace selection with icons (👥 Team, 👤 Individual)
  - Project selection (optional, dynamically loaded)
  - Priority with visual indicators (🔴 ASAP, 🟠 High, 🟡 Medium, 🔵 Low)
  - Due date picker
  - Deadline type (Hard/Soft/None)
  - Duration in minutes

### List Workspaces & Projects 📋
- **Command**: `List Workspaces & Projects`
- **Description**: View all workspaces and projects with their IDs
- **Purpose**: Helps you find workspace and project IDs for setting up preferences
- **Features**:
  - **One-Click Preference Setup**: Set default workspace, project, priority, and duration with single clicks
  - **Copy IDs**: Copy workspace and project IDs to clipboard for manual preference setup
  - **Quick Setup Sections**: Organized sections for priorities (🔴 ASAP, 🟠 High, 🟡 Medium, 🔵 Low) and durations (15, 30, 60, 120 minutes)
  - **Visual Organization**: View project counts and descriptions
  - **Search**: Search through workspaces and projects
  - **Preference Management**: Clear defaults and access Raycast preferences

### Preference Setup Options

#### Option 1: One-Click Setup (Recommended)
1. Run **"List Workspaces & Projects"**
2. Click on any workspace to **"Set as Default Workspace"**
3. Click on any project to **"Set as Default Project"** 
4. Choose a priority from the **"Set Default Priority"** section
5. Choose a duration from the **"Set Default Duration"** section
6. Done! Your preferences are now set for lightning-fast task creation

#### Option 2: Manual Setup
1. Run **"List Workspaces & Projects"** to find IDs
2. Copy workspace and project IDs
3. Open Raycast Preferences → Extensions → Motion
4. Paste the IDs and set your preferred priority and duration

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

## Speed Optimization Features

### 🚀 Quick Create Mode
- Press **⌘ + Enter** in the task capture form for instant task creation
- Uses smart defaults from your preferences
- Skips optional fields for maximum speed
- Perfect for rapid task capture during meetings or brainstorming

### 📋 Smart Caching
- Workspaces and projects are cached for 5 minutes
- Reduces API calls and improves form loading speed
- Cache automatically refreshes when needed

### ⚙️ Preferences for Speed
Set these preferences to make task creation lightning-fast:

- **Default Workspace ID**: Your most-used workspace
- **Default Project ID**: Your most-used project (optional)
- **Default Priority**: Your preferred priority level
- **Default Duration**: Your typical task duration in minutes

### 🎯 Auto-Focus & Validation
- Task name field is automatically focused when form opens
- Client-side validation prevents unnecessary API calls
- Smart error messages with troubleshooting tips

## Keyboard Shortcuts

### Task Capture Form
- **Enter**: Create Task (full form submission)
- **⌘ + Enter**: Quick Create (minimal fields, smart defaults)
- **⌘ + T**: Create Test Task (for debugging)
- **⌘ + D**: Run Debug Test (for troubleshooting)

### List Workspaces & Projects
- **Enter**: Set as Default (workspace/project/priority/duration)
- **⌘ + C**: Copy ID to clipboard
- **⌘ + ⇧ + C**: Copy Workspace ID (from project view)
- **⌘ + Backspace**: Clear Default Project

### Task List
- **Enter**: Show task details
- **⌘ + C**: Copy task name
- **⌘ + ⇧ + C**: Copy task ID
- **⌘ + ⌥ + C**: Copy task URL

## Actions Available
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