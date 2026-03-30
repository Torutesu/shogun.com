"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/loading";

interface Service {
  id: string;
  name: string;
  status: string;
  domain?: string;
  createdAt: string;
}

const statusBadge: Record<string, "green" | "red" | "gold" | "default"> = {
  running: "green",
  deploying: "gold",
  stopped: "default",
  error: "red",
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeploy, setShowDeploy] = useState(false);
  const [deployName, setDeployName] = useState("");
  const [deployPort, setDeployPort] = useState("3000");
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    api.services.list().then(setServices).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDeploy = useCallback(async () => {
    if (!deployName.trim()) return;
    setDeploying(true);
    try {
      const { id } = await api.services.deploy({ name: deployName, port: parseInt(deployPort) || 3000 });
      setServices((prev) => [
        ...prev,
        { id, name: deployName, status: "deploying", createdAt: new Date().toISOString() },
      ]);
      setShowDeploy(false);
      setDeployName("");
      setDeployPort("3000");
    } catch {
      // ignore
    } finally {
      setDeploying(false);
    }
  }, [deployName, deployPort]);

  const handleStop = useCallback(async (id: string) => {
    try {
      await api.services.stop(id);
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: "stopped" } : s)));
    } catch { /* ignore */ }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this service?")) return;
    try {
      await api.services.delete(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <Header title="Services" />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
            Deployed services from your machine
          </p>
          <Button size="sm" onClick={() => setShowDeploy(true)}>Deploy</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-light-text-dim dark:text-dark-text-dim">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
            </svg>
            <p className="text-sm">No services deployed</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-medium text-light-text dark:text-dark-text">{service.name}</h3>
                  <Badge variant={statusBadge[service.status] ?? "default"}>
                    {service.status}
                  </Badge>
                </div>
                {service.domain && (
                  <p className="text-xs font-mono text-gold mb-3 truncate">{service.domain}</p>
                )}
                <p className="text-[0.6rem] font-mono text-light-text-dim dark:text-dark-text-dim mb-3">
                  Created {new Date(service.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  {service.status === "running" && (
                    <Button size="sm" variant="secondary" onClick={() => handleStop(service.id)}>
                      Stop
                    </Button>
                  )}
                  <Button size="sm" variant="danger" onClick={() => handleDelete(service.id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Deploy modal */}
      <Modal open={showDeploy} onClose={() => setShowDeploy(false)} title="DEPLOY SERVICE">
        <div className="space-y-4">
          <Input label="Service name" value={deployName} onChange={(e) => setDeployName(e.target.value)} placeholder="my-api" />
          <Input label="Port" value={deployPort} onChange={(e) => setDeployPort(e.target.value)} placeholder="3000" type="number" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowDeploy(false)}>Cancel</Button>
            <Button onClick={handleDeploy} disabled={deploying || !deployName.trim()}>
              {deploying ? "Deploying..." : "Deploy"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
