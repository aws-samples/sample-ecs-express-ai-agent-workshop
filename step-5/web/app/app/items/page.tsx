"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { AppHeader } from "../../components/AppHeader";
import { Item, getItems, createItem, deleteItem } from "../../lib/api";

export default function ItemsPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/signin");
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && accessToken) {
      getItems(accessToken).then(setItems).catch(() => {});
    }
  }, [loading, user, accessToken]);

  if (loading || !user) return null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || !accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      const item = await createItem(accessToken, name);
      setItems((prev) => [item, ...prev]);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    try {
      await deleteItem(accessToken, id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="dashboard">
      <AppHeader />
      <main className="dashboard-body">
        <form className="items-form" onSubmit={handleAdd}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Item name"
            disabled={submitting}
          />
          <button className="btn-primary" type="submit" disabled={submitting || !newName.trim()}>
            {submitting ? "Adding..." : "Add"}
          </button>
        </form>

        {error && <p className="error-msg">{error}</p>}

        <ul className="items-list">
          {items.length === 0 ? (
            <li className="items-empty">No items yet.</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="item-row">
                <span className="item-name">{item.name}</span>
                <button className="btn-danger" onClick={() => handleDelete(item.id)}>
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </main>
    </div>
  );
}
