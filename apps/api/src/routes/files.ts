import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { fileWriteSchema } from "@shogun/shared";
import type { AuthVariables } from "../middleware/auth";
import { z } from "zod";

type FileVariables = AuthVariables & { machineId: string; flyAppName: string };

const files = new Hono<{ Variables: FileVariables }>();

// ---------------------------------------------------------------------------
// Agent proxy helper
// ---------------------------------------------------------------------------

async function callAgent(
  machineId: string,
  path: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<Response> {
  // TODO: resolve actual Fly internal address once container agent is built
  const agentUrl = `http://${machineId}.vm.flycast:8080${path}`;
  return fetch(agentUrl, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// GET / - list directory
files.get("/", async (c) => {
  const machineId = c.get("machineId");
  const path = c.req.query("path") ?? "/home/user";

  try {
    const res = await callAgent(machineId, `/files?path=${encodeURIComponent(path)}`, "GET");
    const data = await res.json();
    return c.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list directory";
    return c.json({ error: { code: "AGENT_ERROR", message, status: 502 } }, 502);
  }
});

// GET /read - read file content
files.get("/read", async (c) => {
  const machineId = c.get("machineId");
  const path = c.req.query("path");

  if (!path) {
    return c.json({ error: { code: "MISSING_PATH", message: "path query parameter is required", status: 400 } }, 400);
  }

  try {
    const res = await callAgent(machineId, `/files/read?path=${encodeURIComponent(path)}`, "GET");
    const data = await res.json();
    return c.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read file";
    return c.json({ error: { code: "AGENT_ERROR", message, status: 502 } }, 502);
  }
});

// POST /write - write file
files.post("/write", zValidator("json", fileWriteSchema), async (c) => {
  const machineId = c.get("machineId");
  const { path, content } = c.req.valid("json");

  try {
    const res = await callAgent(machineId, "/files/write", "POST", { path, content });
    const data = await res.json();
    return c.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to write file";
    return c.json({ error: { code: "AGENT_ERROR", message, status: 502 } }, 502);
  }
});

// POST /mkdir - create directory
files.post("/mkdir", zValidator("json", z.object({ path: z.string().min(1).max(4096) })), async (c) => {
  const machineId = c.get("machineId");
  const { path } = c.req.valid("json");

  try {
    const res = await callAgent(machineId, "/files/mkdir", "POST", { path });
    const data = await res.json();
    return c.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create directory";
    return c.json({ error: { code: "AGENT_ERROR", message, status: 502 } }, 502);
  }
});

// DELETE / - delete file/directory
files.delete("/", async (c) => {
  const machineId = c.get("machineId");
  const path = c.req.query("path");

  if (!path) {
    return c.json({ error: { code: "MISSING_PATH", message: "path query parameter is required", status: 400 } }, 400);
  }

  try {
    const res = await callAgent(machineId, `/files?path=${encodeURIComponent(path)}`, "DELETE");
    const data = await res.json();
    return c.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete";
    return c.json({ error: { code: "AGENT_ERROR", message, status: 502 } }, 502);
  }
});

// POST /upload - upload file
files.post("/upload", async (c) => {
  const machineId = c.get("machineId");
  const body = await c.req.parseBody();
  const file = body["file"];
  const path = body["path"];

  if (!file || typeof file === "string") {
    return c.json({ error: { code: "MISSING_FILE", message: "file is required", status: 400 } }, 400);
  }
  if (!path || typeof path !== "string") {
    return c.json({ error: { code: "MISSING_PATH", message: "path is required", status: 400 } }, 400);
  }

  try {
    const arrayBuffer = await (file as File).arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const res = await callAgent(machineId, "/files/upload", "POST", {
      path,
      content_base64: base64,
      filename: (file as File).name,
    });
    const data = await res.json();
    return c.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload file";
    return c.json({ error: { code: "AGENT_ERROR", message, status: 502 } }, 502);
  }
});

// GET /download - download file
files.get("/download", async (c) => {
  const machineId = c.get("machineId");
  const path = c.req.query("path");

  if (!path) {
    return c.json({ error: { code: "MISSING_PATH", message: "path query parameter is required", status: 400 } }, 400);
  }

  try {
    const res = await callAgent(machineId, `/files/download?path=${encodeURIComponent(path)}`, "GET");

    if (!res.ok) {
      const data = await res.json();
      return c.json(data, res.status as any);
    }

    const blob = await res.blob();
    const rawFilename = path.split("/").pop() ?? "download";
    // Sanitize: only allow safe ASCII chars, replace everything else
    const safeFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, "_") || "download";
    // RFC 5987 encoded filename for non-ASCII support
    const encodedFilename = encodeURIComponent(rawFilename).replace(/'/g, "%27");

    c.header("Content-Disposition", `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`);
    c.header("Content-Type", res.headers.get("Content-Type") ?? "application/octet-stream");
    return c.body(await blob.arrayBuffer());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to download file";
    return c.json({ error: { code: "AGENT_ERROR", message, status: 502 } }, 502);
  }
});

export default files;
