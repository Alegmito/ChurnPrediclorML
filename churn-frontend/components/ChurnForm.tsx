"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { predictChurn } from "../lib/api";
import { getRiskLevel } from "../lib/risk";
import type { PredictionResult } from "../lib/types";

const initialForm = {
  tenure: "12",
  MonthlyCharges: "65",
  TotalCharges: "780",
  Contract: "Month-to-month",
  PaymentMethod: "Electronic check",
};

export default function ChurnForm() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: any = {
        tenure: Number(form.tenure),
        MonthlyCharges: Number(form.MonthlyCharges),
        Contract: form.Contract,
        PaymentMethod: form.PaymentMethod,
      };

      if (form.TotalCharges.trim() !== "") {
        payload.TotalCharges = Number(form.TotalCharges);
      }

      const response = await predictChurn(payload);

      setResult(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const risk = result ? getRiskLevel(result.churn_probability) : null;

  return (
    <div className="w-full max-w-xl space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            Tenure
          </label>
          <input
            name="tenure"
            type="number"
            min="0"
            step="0.1"
            required
            value={form.tenure}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Monthly Charges
          </label>
          <input
            name="MonthlyCharges"
            type="number"
            min="0"
            step="0.1"
            required
            value={form.MonthlyCharges}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Total Charges (optional)
          </label>
          <input
            name="TotalCharges"
            type="number"
            min="0"
            step="0.1"
            value={form.TotalCharges}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Contract
          </label>
          <select
            name="Contract"
            value={form.Contract}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option>Month-to-month</option>
            <option>One year</option>
            <option>Two year</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Payment Method
          </label>
          <select
            name="PaymentMethod"
            value={form.PaymentMethod}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option>Electronic check</option>
            <option>Mailed check</option>
            <option>Bank transfer (automatic)</option>
            <option>Credit card (automatic)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Predicting..." : "Predict Churn"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {result && risk && (
        <div className="space-y-4 rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Prediction Result</h2>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${risk.badge}`}
            >
              {risk.label}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-600">
              Churn Probability
            </p>
            <p className={`text-3xl font-bold ${risk.text}`}>
              {(result.churn_probability * 100).toFixed(2)}%
            </p>
          </div>

          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className={`h-3 rounded-full ${risk.bar}`}
              style={{
                width: `${Math.min(result.churn_probability * 100, 100)}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Predicted Churn</p>
              <p className="font-semibold">
                {result.prediction_label}
              </p>
            </div>

            <div>
              <p className="text-gray-600">Risk Level</p>
              <p className={`font-semibold ${risk.text}`}>
                {risk.label}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
