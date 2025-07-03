"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PrivacyCenterClient({ fullName, userImage }: { fullName: string; userImage: string }) {
  const [blockingOpen, setBlockingOpen] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (blockingOpen) {
      setLoading(true);
      setError(null);
      fetch("/api/blocked-users")
        .then(res => res.json())
        .then(data => {
          setBlockedUsers(data.blocked || []);
        })
        .catch(() => setError("Failed to load blocked users"))
        .finally(() => setLoading(false));
    }
  }, [blockingOpen]);

  const handleUnblock = async (userId: string) => {
    setLoading(true);
    setError(null);
    await fetch(`/api/unblock-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setBlockedUsers(blockedUsers.filter((u) => u.id !== userId));
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Privacy Center</h1>
      <div className="space-y-4">
        <div className="font-semibold text-lg mb-2">Audience settings</div>
        <div className="rounded-lg border divide-y">
          <button className="w-full text-left px-4 py-3 hover:bg-gray-50" onClick={() => setBlockingOpen(true)}>
            Blocking
            <div className="text-xs text-gray-500">Manage who you have blocked</div>
          </button>
          <button className="w-full text-left px-4 py-3 hover:bg-gray-50">
            Profile information
            <div className="text-xs text-gray-500">Control who can see your profile info</div>
          </button>
          <button className="w-full text-left px-4 py-3 hover:bg-gray-50">
            Posts and stories
            <div className="text-xs text-gray-500">Control who can see your posts and stories</div>
          </button>
          <button className="w-full text-left px-4 py-3 hover:bg-gray-50">
            Lock your profile
            <div className="text-xs text-gray-500">Make your profile visible only to friends</div>
          </button>
          <button className="w-full text-left px-4 py-3 hover:bg-gray-50">
            Review tags before they appear on your profile
            <div className="text-xs text-gray-500">Approve tags before they show up</div>
          </button>
        </div>
      </div>
      {/* Blocking Popup */}
      <Dialog open={blockingOpen} onOpenChange={setBlockingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Blocked Accounts</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : blockedUsers.length === 0 ? (
              <div className="text-sm text-gray-600">You have not blocked anyone yet.</div>
            ) : (
              blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between border-b py-2">
                  <span>{user.name || user.id}</span>
                  <Button variant="outline" size="sm" onClick={() => handleUnblock(user.id)}>Unblock</Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockingOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 