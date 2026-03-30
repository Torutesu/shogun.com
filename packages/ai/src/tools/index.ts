export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "shell_exec",
    description:
      "Execute a shell command on the user's cloud computer. Use for running scripts, installing packages, building projects, etc.",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute",
        },
        working_directory: {
          type: "string",
          description: "Working directory (default: /home/user)",
        },
        timeout_ms: {
          type: "number",
          description: "Timeout in milliseconds (default: 30000)",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "file_read",
    description: "Read the contents of a file on the user's cloud computer.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute path to the file",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "file_write",
    description: "Create or overwrite a file on the user's cloud computer.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute path for the file",
        },
        content: {
          type: "string",
          description: "Content to write",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "file_list",
    description: "List files and directories at a given path.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute directory path (default: /home/user)",
        },
      },
      required: [],
    },
  },
  {
    name: "memory_query",
    description:
      "Search the user's work memory. Use this to find past context about what the user has worked on, decisions made, meetings, etc.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language search query",
        },
        limit: {
          type: "number",
          description: "Max results to return (default: 10)",
        },
        source: {
          type: "string",
          enum: ["screen_capture", "meeting_transcript", "chat", "file", "manual"],
          description: "Filter by memory source type",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "web_search",
    description: "Search the web for information.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "deploy",
    description:
      "Deploy a service from the user's cloud computer to a public subdomain (name.syogun.com).",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Service name (becomes subdomain)",
        },
        port: {
          type: "number",
          description: "Port the service runs on",
        },
        directory: {
          type: "string",
          description: "Directory containing the project",
        },
      },
      required: ["name", "port"],
    },
  },
];
