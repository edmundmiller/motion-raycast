# Motion Raycast AI Tools

This document describes the AI-powered tools available in the Motion Raycast extension. These tools enable natural language interactions with your Motion tasks and projects through Raycast's AI Chat and AI Commands.

## 🚀 Available AI Tools

### 1. Create Motion Task
**Tool Name:** `create-motion-task`
**Description:** Create new Motion tasks using natural language

**Features:**
- **Natural Language Date Parsing:** "today", "tomorrow", "next Monday", "in 3 days"
- **Smart Priority Detection:** "urgent", "high priority", "low", "critical"
- **Project Matching:** Automatically finds matching projects by name
- **Duration Support:** Specify task duration in minutes
- **Deadline Type:** Automatically sets hard/soft deadlines based on priority

**Example Prompts:**
- "Create a task called 'Review quarterly report' due tomorrow with high priority"
- "Add urgent task 'Fix production bug' for project Infrastructure with 2 hour duration"
- "Create a low priority task 'Update documentation' for next Friday"

### 2. Search Motion Tasks
**Tool Name:** `search-motion-tasks`
**Description:** Search and filter existing Motion tasks with intelligent parsing

**Features:**
- **Natural Language Queries:** "urgent tasks", "completed items", "pending work"
- **Multi-criteria Filtering:** Priority, completion status, assignee, project
- **Smart Sorting:** Results sorted by priority and due date
- **Overdue Detection:** Automatically flags overdue tasks
- **Rich Formatting:** Detailed task information with emojis and metadata

**Example Prompts:**
- "Show me all urgent tasks that are pending"
- "Find completed tasks in project Marketing"
- "Search for tasks assigned to John"
- "Show overdue high priority tasks"

### 3. Update Task Status
**Tool Name:** `update-task-status`
**Description:** Update task priorities and completion status

**Features:**
- **Task Identification:** Find tasks by name or ID
- **Natural Language Updates:** "mark as complete", "set priority to high"
- **Multiple Task Handling:** Smart disambiguation when multiple matches found
- **Change Tracking:** Shows before/after values for all changes
- **Status Mapping:** Intelligent mapping of status descriptions

**Example Prompts:**
- "Mark task 'Review report' as complete"
- "Set priority of 'Bug fix' to urgent"
- "Mark 'Documentation update' as done"

### 4. Get Task Summary
**Tool Name:** `get-task-summary`
**Description:** Generate comprehensive task analytics and insights

**Features:**
- **Overall Statistics:** Total, completed, pending, overdue task counts
- **Today's Tasks:** New tasks created today
- **Urgent Task Alerts:** Highlights tasks requiring immediate attention
- **Priority Breakdown:** Task distribution across priority levels
- **Project Analytics:** Tasks per project with completion rates
- **Smart Recommendations:** Actionable insights based on task patterns

**Example Prompts:**
- "Give me a summary of my tasks"
- "Show me today's task overview"
- "What's my current workload status?"

### 5. Search Motion Projects
**Tool Name:** `search-projects`
**Description:** Search and analyze Motion projects with task statistics

**Features:**
- **Project Search:** Find projects by name or description
- **Task Analytics:** Automatic task count and completion statistics
- **Priority Breakdown:** Task priority distribution per project
- **Timeline Information:** Creation and update dates
- **Progress Tracking:** Completion percentages and progress indicators

**Example Prompts:**
- "Show me all projects"
- "Find projects containing 'marketing'"
- "What projects need attention?"

## 🎯 Usage Examples

### Natural Language Task Creation
```
"Create a high priority task called 'Prepare presentation' due next Monday 
with 2 hours duration for the Marketing project"
```

### Complex Task Searches
```
"Show me all urgent and high priority tasks that are still pending, 
focusing on the Development project"
```

### Task Management
```
"Mark the 'Code review' task as complete and update the 'Bug fix' 
task to high priority"
```

### Analytics and Insights
```
"Give me a summary of my workload including overdue tasks and 
today's priorities"
```

## 🔧 Setup and Configuration

### Prerequisites
1. **Motion API Key:** Set up in Raycast preferences
2. **Raycast Pro:** Required for AI functionality
3. **Workspace Access:** Ensure your API key has proper permissions

### Default Settings
Configure these in Raycast preferences for better AI tool performance:
- **Default Workspace ID:** Auto-assigns tasks to your primary workspace
- **Default Project ID:** Automatically adds tasks to a specific project
- **Default Priority:** Sets standard priority level for new tasks
- **Default Duration:** Standard task duration in minutes

### AI Chat Usage
1. Open Raycast AI Chat
2. Type `@motion` to access Motion tools
3. Use natural language to describe what you want to do
4. The AI will automatically select and use the appropriate tool

### AI Commands
- Access through "Ask Motion" in Raycast root search
- Direct natural language interaction with your Motion data
- Context-aware responses based on your current tasks and projects

## 🌟 Advanced Features

### Smart Date Parsing
The AI tools understand various date formats:
- **Relative:** "today", "tomorrow", "next week"
- **Specific Days:** "next Monday", "this Friday"
- **Date Math:** "in 3 days", "in 2 weeks"
- **Standard Formats:** "2024-01-15", "Jan 15"

### Priority Intelligence
Natural language priority detection:
- **Urgent/Critical/ASAP** → ASAP priority
- **High/Important** → HIGH priority
- **Medium/Normal** → MEDIUM priority
- **Low/Minor** → LOW priority

### Project Matching
Smart project assignment:
- **Exact Match:** Finds projects with exact name matches
- **Partial Match:** Intelligent substring matching
- **Fuzzy Matching:** Handles typos and variations
- **Context-Aware:** Suggests alternatives when no match found

## 🛠 Troubleshooting

### Common Issues
1. **"No tasks found":** Check your Motion API key and workspace access
2. **"Could not parse date":** Use simpler date formats like "tomorrow" or "next Monday"
3. **"Project not found":** Verify project names or use exact matches
4. **"Rate limiting":** Motion API has rate limits; wait a moment and try again

### Error Messages
The AI tools provide detailed error messages with troubleshooting tips:
- **401/403 errors:** Check API key configuration
- **400 errors:** Verify request parameters
- **404 errors:** Confirm task/project IDs are correct

## 📊 Performance Tips

### Optimizing Searches
- Use specific keywords for better task/project matching
- Include priority or status filters to narrow results
- Specify workspaces for faster queries

### Best Practices
- Use descriptive task names for easier searching
- Set consistent project naming conventions
- Regularly review and complete old tasks
- Take advantage of the task summary tool for periodic reviews

## 🔮 Future Enhancements

Planned improvements for future versions:
- **Calendar Integration:** Schedule task due dates based on calendar availability
- **Team Collaboration:** Multi-user task assignment and tracking
- **Custom Workflows:** Personalized task creation templates
- **Advanced Analytics:** Productivity metrics and trends
- **Voice Commands:** Audio-based task creation and updates

---

## 💡 Tips for Better AI Interactions

1. **Be Specific:** Include details like priority, due date, and project
2. **Use Natural Language:** The AI understands conversational phrases
3. **Combine Actions:** Create and assign tasks in a single command
4. **Ask for Help:** Use phrases like "show me my workload" for insights
5. **Iterate:** If the AI doesn't understand, try rephrasing your request

The Motion AI tools are designed to make task management as natural as having a conversation with a personal assistant. Experiment with different phrasings to discover the full capabilities!