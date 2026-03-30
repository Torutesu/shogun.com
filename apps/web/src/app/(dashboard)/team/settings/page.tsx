"use client";

import { useEffect, useState } from "react";
import { cn } from "@shogun/ui";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/loading";

interface SSOConfig {
  enabled: boolean;
  entityId: string;
  ssoUrl: string;
  certificate: string;
}

export default function TeamSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamSlug, setTeamSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // SSO
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [entityId, setEntityId] = useState("");
  const [ssoUrl, setSsoUrl] = useState("");
  const [certificate, setCertificate] = useState("");
  const [savingSSO, setSavingSSO] = useState(false);
  const [savedSSO, setSavedSSO] = useState(false);

  // Danger
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.teams
      .list()
      .then((teams) => {
        if (teams.length === 0) return;
        const team = teams[0];
        setTeamId(team.id);
        setTeamName(team.name);
        setTeamSlug(team.slug);
        return api.teams.getSSOConfig(team.id).catch(() => null);
      })
      .then((sso) => {
        if (sso) {
          setSsoEnabled(sso.enabled ?? false);
          setEntityId(sso.entityId ?? "");
          setSsoUrl(sso.ssoUrl ?? "");
          setCertificate(sso.certificate ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveGeneral = async () => {
    if (!teamId) return;
    setSaving(true);
    try {
      await api.teams.update(teamId, { name: teamName, slug: teamSlug });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSSO = async () => {
    if (!teamId) return;
    setSavingSSO(true);
    try {
      await api.teams.setSSOConfig(teamId, {
        enabled: ssoEnabled,
        entityId,
        ssoUrl,
        certificate,
      });
      setSavedSSO(true);
      setTimeout(() => setSavedSSO(false), 2000);
    } catch {
      // ignore
    } finally {
      setSavingSSO(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamId || deleteConfirmText !== teamSlug) return;
    setDeleting(true);
    try {
      await api.teams.delete(teamId);
      window.location.href = "/team";
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="px-4 md:px-6 py-6">
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
          Create a team first to manage settings.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-2xl space-y-8">
      {/* General settings */}
      <div className="space-y-5">
        <h3
          className="text-sm font-mono uppercase tracking-wider text-light-text-muted dark:text-dark-text-muted"
        >
          General
        </h3>
        <Input
          label="Team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Acme Corp"
        />
        <Input
          label="Slug"
          value={teamSlug}
          onChange={(e) => setTeamSlug(e.target.value)}
          placeholder="acme-corp"
        />
        <div>
          <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
            Team avatar
          </label>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-sm font-medium text-gold">
              {teamName?.[0]?.toUpperCase() ?? "T"}
            </div>
            <Button size="sm" variant="secondary" disabled>
              Upload (coming soon)
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSaveGeneral} disabled={saving || !teamName.trim() || !teamSlug.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {saved && <span className="text-xs text-emerald-500">Saved</span>}
        </div>
      </div>

      {/* SSO Configuration */}
      <div className="space-y-5">
        <h3
          className="text-sm font-mono uppercase tracking-wider text-light-text-muted dark:text-dark-text-muted"
        >
          SSO / SAML
        </h3>
        <Card>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-light-text dark:text-dark-text">
                  Enable SSO
                </h4>
                <p className="text-xs text-light-text-muted dark:text-dark-text-muted mt-0.5">
                  Require team members to authenticate via your identity provider
                </p>
              </div>
              <button
                onClick={() => setSsoEnabled(!ssoEnabled)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors cursor-pointer",
                  ssoEnabled ? "bg-gold" : "bg-light-border dark:bg-dark-border",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow",
                    ssoEnabled ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>

            {ssoEnabled && (
              <>
                <Input
                  label="SAML Entity ID"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  placeholder="https://idp.example.com/entity"
                />
                <Input
                  label="SSO URL"
                  value={ssoUrl}
                  onChange={(e) => setSsoUrl(e.target.value)}
                  placeholder="https://idp.example.com/sso/saml"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
                    Certificate
                  </label>
                  <textarea
                    value={certificate}
                    onChange={(e) => setCertificate(e.target.value)}
                    placeholder="-----BEGIN CERTIFICATE-----"
                    rows={4}
                    className="w-full rounded-md border border-light-border dark:border-dark-border bg-transparent px-3 py-2 text-xs font-mono outline-none text-light-text dark:text-dark-text placeholder:text-light-text-dim dark:placeholder:text-dark-text-dim focus:border-gold resize-none"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSaveSSO} disabled={savingSSO}>
                {savingSSO ? "Saving..." : "Save SSO config"}
              </Button>
              {savedSSO && <span className="text-xs text-emerald-500">Saved</span>}
            </div>
          </div>
        </Card>
      </div>

      {/* Danger zone */}
      <div className="space-y-5">
        <h3
          className="text-sm font-mono uppercase tracking-wider text-red-500"
        >
          Danger zone
        </h3>
        <Card className="border-red-500/30">
          <h4 className="text-sm font-medium text-red-500 mb-1">Delete team</h4>
          <p className="text-xs text-light-text-muted dark:text-dark-text-muted mb-3">
            Permanently delete this team and all shared resources. This cannot be undone.
            All members will lose access.
          </p>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            Delete team
          </Button>
        </Card>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="DELETE TEAM">
        <div className="space-y-4">
          <p className="text-sm text-light-text dark:text-dark-text">
            This will permanently delete <span className="font-medium">{teamName}</span> and all shared
            conversations, memory entries, and audit logs. This cannot be undone.
          </p>
          <Input
            label={`Type "${teamSlug}" to confirm`}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={teamSlug}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteTeam}
              disabled={deleting || deleteConfirmText !== teamSlug}
            >
              {deleting ? "Deleting..." : "Yes, delete team"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
