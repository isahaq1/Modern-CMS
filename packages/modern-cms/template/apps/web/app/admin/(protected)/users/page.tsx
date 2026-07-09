"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { User, UserRole } from "@pgcms/shared";
import { api, ApiError } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("EDITOR");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api.get<User[]>("/api/users").then(setUsers);
  }

  useEffect(refresh, []);

  async function addUser() {
    setError(null);
    try {
      await api.post("/api/users", { email, password, role });
      setEmail("");
      setPassword("");
      setRole("EDITOR");
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create user");
    }
  }

  async function removeUser(id: string) {
    if (!confirm("Remove this user?")) return;
    await api.delete(`/api/users/${id}`);
    refresh();
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-3">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="AUTHOR">Author (own pages/items only)</option>
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button
          onClick={addUser}
          disabled={!email || !password}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={15} /> Add user
        </button>
      </div>

      <div className="bg-white border rounded-lg divide-y">
        {users?.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium text-sm">{u.email}</div>
              <div className="text-xs text-slate-400">{u.role}</div>
            </div>
            <button onClick={() => removeUser(u.id)} className="text-slate-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
