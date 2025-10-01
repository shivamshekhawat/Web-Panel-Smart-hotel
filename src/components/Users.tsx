import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Edit, Trash2, Plus } from "lucide-react";
import config from "../config/environment";
import adminApi from "../services/api";
import Toast from "./ui/toast";

// User type definition
interface User {
  id: string | number;
  username: string;
  email: string;
  role: "Admin" | "Reception" | "Housekeeping";
  accessScope: string;
  loginHistory?: string[];
  failedAttempts?: number;
  locked?: boolean;
}

export default function Users() {
  const [token, setToken] = useState<string | null>(adminApi.getToken?.() || null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    username: "",
    email: "",
    role: "Reception",
    accessScope: "",
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Toasts
  type ToastType = 'success' | 'error' | 'info' | 'warning';
  interface ToastItem { id: string; type: ToastType; title: string; message?: string }
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = (type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter(t => t.id !== id));

  const apiBaseUrl = useMemo(() => config.apiBaseUrl, []);

  const authHeaders = useMemo((): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, [token]);

  // Normalize API user to local User
  const mapApiUser = (u: any): User => {
    const roleRaw = (u.role || '').toString();
    const roleNorm = roleRaw.toLowerCase();
    const role: User['role'] = roleNorm === 'admin'
      ? 'Admin'
      : roleNorm === 'housekeeping'
      ? 'Housekeeping'
      : 'Reception';
    const accessScope = u.access_scope ?? u.accessScope ?? '';
    const loginHistory = Array.isArray(u.login_history) ? u.login_history : (u.loginHistory ?? []);
    return {
      id: u.staff_id ?? u.id ?? u.staffId ?? u.username,
      username: u.username,
      email: u.email,
      role,
      accessScope,
      loginHistory,
      failedAttempts: typeof u.failed_attempts === 'number' ? u.failed_attempts : (u.failedAttempts ?? 0),
      locked: Boolean(u.locked),
    };
  };

  // Load token from storage in case it changes elsewhere
  useEffect(() => {
    const t = adminApi.getToken?.();
    if (t) setToken(t);
  }, []);

  // Fetch users on mount (and when token changes)
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (!token) {
          showToast('warning', 'Not authenticated', 'Please login to manage users.');
          return;
        }
        const resp = await fetch(`${apiBaseUrl}/api/staff`, {
          method: 'GET',
          headers: authHeaders,
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch staff');
        }
        const data = await resp.json();
        const apiUsers = Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
          ? data.users
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.response)
          ? data.response
          : [];
        setUsers(apiUsers.map(mapApiUser));
      } catch (e: any) {
        showToast('error', 'Load users failed', e?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [apiBaseUrl, authHeaders, token]);

  // Delete user
  const handleDeleteUser = async (user: User) => {
    try {
      if (!token) throw new Error('Missing auth token');
      const resp = await fetch(`${apiBaseUrl}/api/staff/${encodeURIComponent(String(user.id))}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || data?.success === false) {
        throw new Error(data?.message || 'Delete failed');
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast('success', 'User deleted');
    } catch (e: any) {
      showToast('error', 'Delete failed', e?.message || 'Unknown error');
    }
  };

  // Edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  // Add user
  const handleAddUser = async () => {
    try {
      if (!newUser.username || !newUser.email || !newUser.role) return;
      if (!token) throw new Error('Missing auth token');
      const payload = {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        access_scope: newUser.accessScope || (newUser.role === 'Admin' ? 'All' : 'Limited'),
      };
      const resp = await fetch(`${apiBaseUrl}/api/staff`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || data?.success === false) {
        throw new Error(data?.message || 'Create failed');
      }
      // Refresh list
      const listResp = await fetch(`${apiBaseUrl}/api/staff`, { method: 'GET', headers: authHeaders });
      const listData = await listResp.json().catch(() => ({}));
      const refreshedUsers = Array.isArray(listData)
        ? listData
        : Array.isArray(listData?.users)
        ? listData.users
        : Array.isArray(listData?.data)
        ? listData.data
        : Array.isArray(listData?.response)
        ? listData.response
        : [];
      setUsers(refreshedUsers.map(mapApiUser));
      setNewUser({ username: "", email: "", role: "Reception", accessScope: "" });
      setShowAddModal(false);
      showToast('success', 'User created');
    } catch (e: any) {
      showToast('error', 'Create failed', e?.message || 'Unknown error');
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    try {
      if (!editingUser) return;
      if (!token) throw new Error('Missing auth token');
      const payload = {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role,
        access_scope: editingUser.accessScope,
        locked: Boolean(editingUser.locked),
      };
      const resp = await fetch(`${apiBaseUrl}/api/staff/${encodeURIComponent(String(editingUser.id))}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || data?.success === false) {
        throw new Error(data?.message || 'Update failed');
      }
      // Refresh list
      const listResp = await fetch(`${apiBaseUrl}/api/staff`, { method: 'GET', headers: authHeaders });
      const listData = await listResp.json().catch(() => ({}));
      const refreshedUsers = Array.isArray(listData)
        ? listData
        : Array.isArray(listData?.users)
        ? listData.users
        : Array.isArray(listData?.data)
        ? listData.data
        : Array.isArray(listData?.response)
        ? listData.response
        : [];
      setUsers(refreshedUsers.map(mapApiUser));
      setShowEditModal(false);
      setEditingUser(null);
      showToast('success', 'User updated');
    } catch (e: any) {
      showToast('error', 'Update failed', e?.message || 'Unknown error');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-spin">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Loading Users</h3>
          <p className="text-slate-500 dark:text-slate-400">Please wait while we fetch user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add User Button (Admin only) */}
      {true && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-auto">
          <Card className="w-full max-w-md p-6 relative">
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                className="w-full border p-2 rounded"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full border p-2 rounded"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
              <select
                className="w-full border p-2 rounded"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value as User["role"] })
                }
              >
                <option value="Admin">Admin</option>
                <option value="Reception">Reception</option>
                <option value="Housekeeping">Housekeeping</option>
              </select>
              <input
                type="text"
                placeholder="Access Scope"
                className="w-full border p-2 rounded"
                value={newUser.accessScope}
                onChange={(e) => setNewUser({ ...newUser, accessScope: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>Add</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-auto">
          <Card className="w-full max-w-md p-6 relative">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                className="w-full border p-2 rounded"
                value={editingUser.username}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full border p-2 rounded"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              />
              <select
                className="w-full border p-2 rounded"
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as User["role"] })}
              >
                <option value="Admin">Admin</option>
                <option value="Reception">Reception</option>
                <option value="Housekeeping">Housekeeping</option>
              </select>
              <input
                type="text"
                placeholder="Access Scope"
                className="w-full border p-2 rounded"
                value={editingUser.accessScope}
                onChange={(e) => setEditingUser({ ...editingUser, accessScope: e.target.value })}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(editingUser.locked)}
                  onChange={(e) => setEditingUser({ ...editingUser, locked: e.target.checked })}
                />
                <span>Locked</span>
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditingUser(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardDescription>Manage system users, roles, and access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Username</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Role</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Access</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={String(user.id)}>
                  <td className="px-4 py-2">{user.username}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.role}</td>
                  <td className="px-4 py-2">{user.accessScope}</td>
                  <td className="px-4 py-2 flex gap-2">
                    {user.role !== "Admin" && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => handleEditUser(user)}>
                          <Edit className="h-5 w-5 text-blue-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </Button>
                      </>
                    )}
                    {/* Unlock button removed completely */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Login History & Status (Admin only) */}
      {true && (
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle>Admin Login History</CardTitle>
            <CardDescription>Track admin login activity and account lockouts</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Username</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Last Login</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Failed Attempts</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users
                  .filter((user) => user.role === "Admin") // only Admins
                  .map((user) => (
                    <tr key={String(user.id)}>
                      <td className="px-4 py-2">{user.username}</td>
                      <td className="px-4 py-2">{user.loginHistory?.[0] || "Never"}</td>
                      <td className="px-4 py-2">{user.failedAttempts || 0}</td>
                      <td className="px-4 py-2">
                        {user.locked ? (
                          <span className="text-red-500 font-semibold">Locked</span>
                        ) : (
                          <span className="text-green-500">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      {toasts.map(t => (
        <Toast key={t.id} id={t.id} type={t.type} title={t.title} message={t.message} onClose={removeToast} />
      ))}
    </div>
  );
}
