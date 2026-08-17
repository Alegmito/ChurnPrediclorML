"use client";

import { useEffect, useState } from "react";
import { clearHistory, getHealth, getHistory } from "../lib/api";
import { getRiskLevel } from "../lib/risk";
import type { HealthResponse, HistoryItem } from "../lib/types";

export default function Dashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false)

  const handleClearHistory = async () => {
      if (!confirm("Are you sure you want to clear all prediction history?")) return;

      setClearing(true);
      try {
          await clearHistory();
          setHistory([]);
      } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to clear history");
      } finally {
          setClearing(false);
      }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const healthResponse = await getHealth();
        setHealth(healthResponse);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load health status."
        );
      }

      try {
        const historyResponse = await getHistory();
        setHistory(historyResponse);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);




  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-6 shadow-sm">
        <h2 className="text-xl font-semibold">System Health</h2>

        {loading && <p className="mt-3 text-gray-600">Loading...</p>}

        {error && (
          <p className="mt-3 text-red-600">
            Could not load health: {error}
          </p>
        )}

        {health && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">Backend API</p>
              <p className="mt-1 text-lg font-semibold capitalize">
                {health.status}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">ML Service</p>
              <p className="mt-1 text-lg font-semibold capitalize">
                {health.ml_service}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">Model Status</p>
              <p className="mt-1 text-lg font-semibold">
                {health.ml_response?.model_status ?? "unknown"}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border p-6 shadow-sm">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Predictions</h2>
            <button
              onClick={handleClearHistory}
              disabled={clearing || history.length === 0}
              className="rounded-lg border-red-200 text-red-600 bg-red-50 px-4 py-2 text-sm font-semibold hover:bg-red-200"
            >
              {clearing ? "Clearing..." : "Clear History"}
            </button>
        </div>

        {history.length === 0 ? (
          <p className="mt-3 text-gray-600">
            No prediction history available yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Request ID</th>
                  <th className="py-2 pr-4">Probability</th>
                  <th className="py-2 pr-4">Prediction</th>
                  <th className="py-2">Risk</th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => {
                  const probability =
                    item.response?.churn_probability ?? 0;

                  const risk = getRiskLevel(probability);

                  return (
                    <tr key={item.requestId} className="border-b">
                      <td className="py-3 pr-4">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 pr-4 font-mono text-xs">
                        {item.requestId.slice(0, 8)}...
                      </td>

                      <td className="py-3 pr-4 font-semibold">
                        {(probability * 100).toFixed(2)}%
                      </td>

                      <td className="py-3 pr-4">
                        {item.response?.prediction_label ?? "-"}
                      </td>

                      <td className="py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${risk.badge}`}
                        >
                          {risk.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
