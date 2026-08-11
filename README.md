# OpenCTI MCP Server

[![smithery badge](https://smithery.ai/badge/opencti-server)](https://smithery.ai/server/opencti-server)
[Traditional Chinese (繁體中文)](README.zh-TW.md)

<a href="https://glama.ai/mcp/servers/ml61kiz1gm"><img width="380" height="200" src="https://glama.ai/mcp/servers/ml61kiz1gm/badge" alt="OpenCTI Server MCP server" /></a>

## Overview
OpenCTI MCP Server is a Model Context Protocol (MCP) server that provides seamless integration with OpenCTI (Open Cyber Threat Intelligence) platform. It enables querying and retrieving threat intelligence data through a standardized interface.

## Features
- Fetch and search threat intelligence data
  - Get latest reports and search by ID
  - Search for malware information
  - Query indicators of compromise
  - Search for threat actors
- User and group management
  - List all users and groups
  - Get user details by ID
- STIX object operations
  - List attack patterns
  - Get campaign information by name
- System management
  - List connectors
  - View status templates
- File operations
  - List all files
  - Get file details by ID
- Reference data access
  - List marking definitions
  - View available labels
- Customizable query limits
- Full GraphQL query support
- Optional compact GCF response encoding (`RESPONSE_FORMAT=gcf`) for fewer tokens

## Prerequisites
- Node.js 16 or higher
- Access to an OpenCTI instance
- OpenCTI API token

## Installation

### Installing via Smithery

To install OpenCTI Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/opencti-server):

```bash
npx -y @smithery/cli install opencti-server --client claude
```

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/opencti-mcp-server.git

# Install dependencies
cd opencti-mcp-server
npm install

# Build the project
npm run build
```

## Configuration

### Environment Variables
Copy `.env.example` to `.env` and update with your OpenCTI credentials:
```bash
cp .env.example .env
```

Required environment variables:
- `OPENCTI_URL`: Your OpenCTI instance URL
- `OPENCTI_TOKEN`: Your OpenCTI API token

Optional environment variables:
- `RESPONSE_FORMAT`: Output encoding for tool results. `json` (default) returns standard JSON. `gcf` returns [Graph Compact Format](https://gcformat.com), a compact, lossless encoding that factors the repeated field names of a record array into a single header, so results use fewer tokens when they cross the LLM boundary. Falls back to JSON on any encoding error.

### MCP Settings
Create a configuration file in your MCP settings location:
```json
{
  "mcpServers": {
    "opencti": {
      "command": "node",
      "args": ["path/to/opencti-server/build/index.js"],
      "env": {
        "OPENCTI_URL": "${OPENCTI_URL}",  // Will be loaded from .env
        "OPENCTI_TOKEN": "${OPENCTI_TOKEN}",  // Will be loaded from .env
        "RESPONSE_FORMAT": "gcf"  // Optional: compact GCF encoding (default: json)
      }
    }
  }
}
```

### Security Notes
- Never commit `.env` file or API tokens to version control
- Keep your OpenCTI credentials secure
- The `.gitignore` file is configured to exclude sensitive files

## Available Tools

## Available Tools

### Reports
#### get_latest_reports
Retrieves the most recent threat intelligence reports.
```typescript
{
  "name": "get_latest_reports",
  "arguments": {
    "first": 10  // Optional, defaults to 10
  }
}
```

#### get_report_by_id
Retrieves a specific report by its ID.
```typescript
{
  "name": "get_report_by_id",
  "arguments": {
    "id": "report-uuid"  // Required
  }
}
```

### Search Operations
#### search_malware
Searches for malware information in the OpenCTI database.
```typescript
{
  "name": "search_malware",
  "arguments": {
    "query": "ransomware",
    "first": 10  // Optional, defaults to 10
  }
}
```

#### search_indicators
Searches for indicators of compromise.
```typescript
{
  "name": "search_indicators",
  "arguments": {
    "query": "domain",
    "first": 10  // Optional, defaults to 10
  }
}
```

#### search_threat_actors
Searches for threat actor information.
```typescript
{
  "name": "search_threat_actors",
  "arguments": {
    "query": "APT",
    "first": 10  // Optional, defaults to 10
  }
}
```

### User Management
#### get_user_by_id
Retrieves user information by ID.
```typescript
{
  "name": "get_user_by_id",
  "arguments": {
    "id": "user-uuid"  // Required
  }
}
```

#### list_users
Lists all users in the system.
```typescript
{
  "name": "list_users",
  "arguments": {}
}
```

#### list_groups
Lists all groups with their members.
```typescript
{
  "name": "list_groups",
  "arguments": {
    "first": 10  // Optional, defaults to 10
  }
}
```

### STIX Objects
#### list_attack_patterns
Lists all attack patterns in the system.
```typescript
{
  "name": "list_attack_patterns",
  "arguments": {
    "first": 10  // Optional, defaults to 10
  }
}
```

#### get_campaign_by_name
Retrieves campaign information by name.
```typescript
{
  "name": "get_campaign_by_name",
  "arguments": {
    "name": "campaign-name"  // Required
  }
}
```

### System Management
#### list_connectors
Lists all system connectors.
```typescript
{
  "name": "list_connectors",
  "arguments": {}
}
```

#### list_status_templates
Lists all status templates.
```typescript
{
  "name": "list_status_templates",
  "arguments": {}
}
```

### File Operations
#### get_file_by_id
Retrieves file information by ID.
```typescript
{
  "name": "get_file_by_id",
  "arguments": {
    "id": "file-uuid"  // Required
  }
}
```

#### list_files
Lists all files in the system.
```typescript
{
  "name": "list_files",
  "arguments": {}
}
```

### Reference Data
#### list_marking_definitions
Lists all marking definitions.
```typescript
{
  "name": "list_marking_definitions",
  "arguments": {}
}
```

#### list_labels
Lists all available labels.
```typescript
{
  "name": "list_labels",
  "arguments": {}
}
```

## Contributing
Contributions are welcome! Please feel free to submit pull requests.

## License
MIT License
