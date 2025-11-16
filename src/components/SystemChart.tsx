import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Assessment } from '../types';

interface SystemChartProps {
  assessment: Assessment;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const SystemChart: React.FC<SystemChartProps> = React.memo(({ assessment }) => {
  const result = assessment.result;
  // Memoize expensive calculations
  const pieData = useMemo(() =>
    result.systems.map((system) => ({
      name: system.systemId,
      value: system.totalEmissions,
      percentage: ((system.totalEmissions / result.totalEmissions) * 100).toFixed(1),
    })),
    [result.systems, result.totalEmissions]
  );

  const barData = useMemo(() =>
    result.systems.map((system) => ({
      name: system.systemId,
      emissions: Math.round(system.totalEmissions),
    })),
    [result.systems]
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Visual Breakdown</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4 text-center">
            Distribution by S-Layer
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()} kgCO2e`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4 text-center">
            Emissions by S-Layer (kgCO2e)
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()} kgCO2e`}
              />
              <Bar dataKey="emissions" fill="#3B82F6">
                {barData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

SystemChart.displayName = 'SystemChart';
