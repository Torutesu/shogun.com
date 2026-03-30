"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/loading";

type Role = "owner" | "admin" | "member" | "viewer";

interface Member {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  joinedAt: string;
}

interface Invite {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

const roleBadgeVariant: Record<Role, "gold" | "blue" | "default"> = {
  owner: "gold",
  admin: "blue",
  member: "default",
  viewer: "default",
};

const roleOptions: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string>("");

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [inviting, setInviting] = useState(false);

  // Remove confirm
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    api.teams
      .list()
      .then((teams) => {
        if (teams.length === 0) return;
        const id = teams[0]?.id;
        if (!id) return;
        setTeamId(id);
        return Promise.all([
          api.teams.getMembers(id),
          api.teams.getInvites(id).catch(() => []),
        ]);
      })
      .then((result) => {
        if (!result) return;
        const [m, inv] = result;
        setMembers(m as Member[]);
        setInvites(inv as Invite[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !teamId) return;
    setInviting(true);
    try {
      const invite = await api.teams.invite(teamId, { email: inviteEmail, role: inviteRole });
      setInvites((prev) => [...prev, invite as Invite]);
      setShowInvite(false);
      setInviteEmail("");
      setInviteRole("member");
    } catch {
      // ignore
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member: Member, role: Role) => {
    try {
      await api.teams.updateRole(teamId, member.userId, role);
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role } : m)),
      );
    } catch {
      // ignore
    }
  };

  const handleRemove = async () => {
    if (!removeTarget || !teamId) return;
    setRemoving(true);
    try {
      await api.teams.removeMember(teamId, removeTarget.userId);
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      setRemoveTarget(null);
    } catch {
      // ignore
    } finally {
      setRemoving(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await api.teams.cancelInvite(teamId, inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch {
      // ignore
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
          Create a team first to manage members.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-light-text dark:text-dark-text">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </h3>
        <Button size="sm" onClick={() => setShowInvite(true)}>
          Invite
        </Button>
      </div>

      {/* Members table */}
      <div className="space-y-2">
        {members.map((member) => (
          <Card key={member.id}>
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-medium text-gold">
                {member.displayName?.[0]?.toUpperCase() ?? member.email[0]?.toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                  {member.displayName}
                </p>
                <p className="text-xs text-light-text-muted dark:text-dark-text-muted truncate">
                  {member.email}
                </p>
              </div>

              {/* Role badge */}
              <Badge
                variant={roleBadgeVariant[member.role]}
                className={member.role === "viewer" ? "opacity-60" : ""}
              >
                {member.role}
              </Badge>

              {/* Joined date */}
              <span className="hidden sm:block text-xs font-mono text-light-text-dim dark:text-dark-text-dim whitespace-nowrap">
                {new Date(member.joinedAt).toLocaleDateString()}
              </span>

              {/* Actions */}
              {member.role !== "owner" && (
                <div className="flex items-center gap-1">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member, e.target.value as Role)}
                    className="h-8 rounded-md border border-light-border dark:border-dark-border bg-transparent px-2 text-xs outline-none text-light-text dark:text-dark-text focus:border-gold"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="danger" onClick={() => setRemoveTarget(member)}>
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-light-text dark:text-dark-text mb-3">
            Pending invites
          </h3>
          <div className="space-y-2">
            {invites.map((invite) => (
              <Card key={invite.id}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-light-surface dark:bg-dark-surface text-xs text-light-text-muted dark:text-dark-text-muted">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-light-text dark:text-dark-text truncate">{invite.email}</p>
                  </div>
                  <Badge variant={roleBadgeVariant[invite.role]}>{invite.role}</Badge>
                  <span className="hidden sm:block text-xs font-mono text-light-text-dim dark:text-dark-text-dim whitespace-nowrap">
                    {new Date(invite.createdAt).toLocaleDateString()}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => handleCancelInvite(invite.id)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="INVITE MEMBER">
        <div className="space-y-4">
          <Input
            label="Email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@company.com"
            type="email"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-wide text-light-text-muted dark:text-dark-text-muted">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="h-10 w-full rounded-md border border-light-border dark:border-dark-border bg-transparent px-3 text-sm outline-none text-light-text dark:text-dark-text focus:border-gold"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? "Inviting..." : "Send invite"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove confirmation modal */}
      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="REMOVE MEMBER"
      >
        <p className="text-sm text-light-text dark:text-dark-text mb-4">
          Remove <span className="font-medium">{removeTarget?.displayName}</span> from the team?
          They will lose access to all shared resources.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRemove} disabled={removing}>
            {removing ? "Removing..." : "Remove"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
