// src/components/admin/FundPerformanceChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FundPerformanceChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="#aaa" />
        <YAxis stroke="#aaa" unit="%" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1a1a1a', 
            borderColor: '#333',
            borderRadius: '8px'
          }}
          formatter={(value) => [`${value}%`, 'ROI']}
          labelStyle={{ color: '#fff' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="roi"
          stroke="#D4AF37"
          strokeWidth={2}
          dot={{ fill: '#D4AF37', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name="Monthly ROI"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default FundPerformanceChart;