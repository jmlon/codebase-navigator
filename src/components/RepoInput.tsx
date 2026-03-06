"use client";

import { useState, useCallback } from "react";

interface RepoInputProps {
  onSubmit: (repoUrl: string) => void;
  loading: boolean;
  error: string | null;
}

export function RepoInput({ onSubmit, loading, error }: RepoInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) return;
      onSubmit(trimmed);
    },
    [url, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="owner/repo"
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="shrink-0 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "..." : "Load"}
        </button>
      </div>
      {error && (
        <p className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-600">{error}</p>
      )}
    </form>
  );
}
