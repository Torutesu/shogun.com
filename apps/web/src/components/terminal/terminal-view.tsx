"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@shogun/ui";

interface TerminalViewProps {
  machineIp?: string;
  className?: string;
}

export function TerminalView({ machineIp, className }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    if (!containerRef.current || !machineIp) return;

    let cleanup = false;

    async function init() {
      const { Terminal } = await import("xterm");
      const { FitAddon } = await import("xterm-addon-fit");
      const { WebLinksAddon } = await import("xterm-addon-web-links");

      if (cleanup) return;

      const term = new Terminal({
        fontFamily: "var(--font-mono), monospace",
        fontSize: 13,
        theme: {
          background: "#080808",
          foreground: "#F0EDE6",
          cursor: "#C8A96E",
          selectionBackground: "rgba(200, 169, 110, 0.3)",
        },
        cursorBlink: true,
        convertEol: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

      term.open(containerRef.current!);
      fitAddon.fit();
      termRef.current = term;

      // Connect WebSocket
      const wsUrl = `wss://${machineIp}/ws/terminal`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!cleanup) setStatus("connected");
      };

      ws.onmessage = (e) => {
        term.write(e.data);
      };

      ws.onclose = () => {
        if (!cleanup) setStatus("disconnected");
        term.write("\r\n\x1b[31mDisconnected\x1b[0m\r\n");
      };

      ws.onerror = () => {
        if (!cleanup) setStatus("disconnected");
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      // Handle resize
      const observer = new ResizeObserver(() => {
        fitAddon.fit();
      });
      observer.observe(containerRef.current!);

      return () => {
        observer.disconnect();
        ws.close();
        term.dispose();
      };
    }

    const cleanupFn = init();

    return () => {
      cleanup = true;
      cleanupFn.then((fn) => fn?.());
    };
  }, [machineIp]);

  return (
    <div className={cn("relative h-full", className)}>
      {/* Status indicator */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-md bg-dark/80 px-2 py-1 text-[0.6rem] font-mono uppercase tracking-wider">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            status === "connected" && "bg-emerald-500",
            status === "connecting" && "bg-yellow-500 animate-pulse",
            status === "disconnected" && "bg-red-500",
          )}
        />
        <span className="text-dark-text-muted">{status}</span>
      </div>

      <div ref={containerRef} className="h-full w-full bg-dark" />
    </div>
  );
}
