import { describe, it, expect } from "vitest";
import { TOOL_DEFINITIONS } from "../tools";

const EXPECTED_TOOLS = [
  "shell_exec",
  "file_read",
  "file_write",
  "file_list",
  "memory_query",
  "web_search",
  "deploy",
];

describe("TOOL_DEFINITIONS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(TOOL_DEFINITIONS)).toBe(true);
    expect(TOOL_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it("contains all expected tools", () => {
    const toolNames = TOOL_DEFINITIONS.map((t) => t.name);
    for (const expected of EXPECTED_TOOLS) {
      expect(toolNames, `should include tool "${expected}"`).toContain(expected);
    }
  });

  for (const toolName of EXPECTED_TOOLS) {
    describe(`tool: ${toolName}`, () => {
      it("has name, description, and inputSchema", () => {
        const tool = TOOL_DEFINITIONS.find((t) => t.name === toolName);
        expect(tool).toBeDefined();
        expect(tool!.name).toBe(toolName);
        expect(typeof tool!.description).toBe("string");
        expect(tool!.description.length).toBeGreaterThan(0);
        expect(tool!.inputSchema).toBeDefined();
        expect(typeof tool!.inputSchema).toBe("object");
      });

      it("has inputSchema with type object", () => {
        const tool = TOOL_DEFINITIONS.find((t) => t.name === toolName)!;
        expect(tool.inputSchema.type).toBe("object");
      });

      it("has inputSchema with properties", () => {
        const tool = TOOL_DEFINITIONS.find((t) => t.name === toolName)!;
        expect(tool.inputSchema.properties).toBeDefined();
        expect(typeof tool.inputSchema.properties).toBe("object");
      });

      it("has inputSchema with required array", () => {
        const tool = TOOL_DEFINITIONS.find((t) => t.name === toolName)!;
        expect(Array.isArray(tool.inputSchema.required)).toBe(true);
      });
    });
  }
});

describe("shell_exec tool", () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === "shell_exec")!;

  it("requires 'command' field", () => {
    expect(tool.inputSchema.required).toContain("command");
  });

  it("has command property of type string", () => {
    const properties = tool.inputSchema.properties as Record<string, { type: string }>;
    expect(properties.command.type).toBe("string");
  });

  it("includes optional working_directory and timeout_ms", () => {
    const properties = tool.inputSchema.properties as Record<string, unknown>;
    expect(properties.working_directory).toBeDefined();
    expect(properties.timeout_ms).toBeDefined();
  });
});

describe("file_read tool", () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === "file_read")!;

  it("requires 'path' field", () => {
    expect(tool.inputSchema.required).toContain("path");
  });
});

describe("file_write tool", () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === "file_write")!;

  it("requires 'path' and 'content' fields", () => {
    expect(tool.inputSchema.required).toContain("path");
    expect(tool.inputSchema.required).toContain("content");
  });
});

describe("memory_query tool", () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === "memory_query")!;

  it("requires 'query' field", () => {
    expect(tool.inputSchema.required).toContain("query");
  });

  it("has optional limit and source properties", () => {
    const properties = tool.inputSchema.properties as Record<string, unknown>;
    expect(properties.limit).toBeDefined();
    expect(properties.source).toBeDefined();
  });
});

describe("deploy tool", () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === "deploy")!;

  it("requires 'name' and 'port' fields", () => {
    expect(tool.inputSchema.required).toContain("name");
    expect(tool.inputSchema.required).toContain("port");
  });
});
