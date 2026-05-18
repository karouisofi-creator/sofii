import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#6366F1",
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F472B6",
  "#A3E635",
  "#F97316",
];

export default function DonutChart({ data = [], title = "" }) {
  if (!data || data.length === 0)
    return <div className="text-sm text-slate-500">Aucune donnée</div>;

  return (
    <div style={{ width: "100%", height: 260 }}>
      {title && (
        <div className="mb-2">
          <p className="text-sm font-semibold text-slate-700">{title}</p>
        </div>
      )}
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            label
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => v} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
