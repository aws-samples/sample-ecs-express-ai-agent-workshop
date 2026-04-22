"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

interface Item {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = "/backend";

export default function Home() {
  const [backendSha, setBackendSha] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => setBackendSha(data.gitSha ?? "unknown"))
      .catch(() => setHealthError("Backend unreachable"));

    fetch(`${API_BASE}/items`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch items");
        return res.json();
      })
      .then(setItems)
      .catch(() => {});
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create item");
      const item = await res.json();
      setItems((prev) => [item, ...prev]);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${API_BASE}/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>ECS Express Workshop</h1>

        <p data-testid="backend-sha">
          Backend Git SHA:{" "}
          {healthError ? (
            <span>{healthError}</span>
          ) : (
            <code>{backendSha ?? "loading..."}</code>
          )}
        </p>

        <section data-testid="items-section" style={{ width: "100%", marginTop: "2rem" }}>
          <h2>Items</h2>

          <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Item name"
              disabled={submitting}
              style={{ flex: 1, padding: "0.5rem" }}
            />
            <button type="submit" disabled={submitting || !newName.trim()}>
              {submitting ? "Adding..." : "Add"}
            </button>
          </form>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <ul data-testid="items-list" style={{ listStyle: "none", padding: 0 }}>
            {items.length === 0 ? (
              <li>No items yet.</li>
            ) : (
              items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <span>{item.name}</span>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
