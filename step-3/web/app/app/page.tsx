"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [backendSha, setBackendSha] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/backend/health")
      .then((res) => res.json())
      .then((data) => setBackendSha(data.gitSha ?? "unknown"))
      .catch(() => setError("Backend unreachable"));
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>ECS Express Workshop</h1>
        <p data-testid="backend-sha">
          Backend Git SHA:{" "}
          {error ? <span>{error}</span> : <code>{backendSha ?? "loading..."}</code>}
        </p>
      </main>
    </div>
  );
}
