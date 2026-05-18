import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function CenterBarChart({
  data = [],
  title = "",
  valueKey = "nb_claims_treated",
  labelKey = "centre",
}) {
  if (!data || data.length === 0)
    return <div className="text-sm text-slate-500">Aucune donnée</div>;

  return (
    <div style={{ width: "100%", height: 300 }}>
      {title && (
        <div className="mb-2">
          <p className="text-sm font-semibold text-slate-700">{title}</p>
        </div>
      )}
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={labelKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={valueKey} fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
