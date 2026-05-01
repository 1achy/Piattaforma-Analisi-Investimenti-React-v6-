
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { HistoricalData } from '../types';

interface HistoricalTrendChartProps {
  historicalData: HistoricalData;
  companyName: string;
}

interface ChartDataItem {
  year: number;
  revenue?: number;
  netIncome?: number;
  totalDebt?: number; // NUOVO
}

export const HistoricalTrendChart: React.FC<HistoricalTrendChartProps> = ({ historicalData, companyName }) => {
  const processChartData = (): ChartDataItem[] => {
    const combinedData: Record<number, ChartDataItem> = {};
    const BILLION = 1_000_000_000;

    if (historicalData.revenue) {
      Object.entries(historicalData.revenue).forEach(([dateStr, value]) => {
        const year = new Date(dateStr).getFullYear();
        if (!combinedData[year]) combinedData[year] = { year };
        if (value !== null && !isNaN(value)) {
            combinedData[year].revenue = parseFloat((value / BILLION).toFixed(2));
        }
      });
    }

    if (historicalData.netIncome) {
      Object.entries(historicalData.netIncome).forEach(([dateStr, value]) => {
        const year = new Date(dateStr).getFullYear();
        if (!combinedData[year]) combinedData[year] = { year };
         if (value !== null && !isNaN(value)) {
            combinedData[year].netIncome = parseFloat((value / BILLION).toFixed(2));
        }
      });
    }

    // NUOVO: Process totalDebt
    if (historicalData.totalDebt) {
      Object.entries(historicalData.totalDebt).forEach(([dateStr, value]) => {
        const year = new Date(dateStr).getFullYear();
        if (!combinedData[year]) combinedData[year] = { year };
        if (value !== null && !isNaN(value)) {
            combinedData[year].totalDebt = parseFloat((value / BILLION).toFixed(2));
        }
      });
    }
    
    return Object.values(combinedData).sort((a, b) => a.year - b.year);
  };

  const chartData = processChartData();

  if (chartData.length === 0 || chartData.every(d => d.revenue === undefined && d.netIncome === undefined && d.totalDebt === undefined)) {
    return (
        <section aria-labelledby="historical-trends-title" className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg">
            <h2 id="historical-trends-title" className="text-xl sm:text-2xl font-bold text-white mb-1">
                Trend Storici per <span className="text-cyan-400">{companyName}</span>
            </h2>
            <hr className="border-slate-700 my-4" />
            <p className="text-slate-400">Dati storici non disponibili per visualizzare il grafico.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="historical-trends-title" className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg">
      <h2 id="historical-trends-title" className="text-xl sm:text-2xl font-bold text-white mb-1">
        Trend Storici per <span className="text-cyan-400">{companyName}</span>
      </h2>
      <p className="text-sm text-slate-400 mb-6">(Valori in Miliardi €)</p>
      <hr className="border-slate-700 my-4" />
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 20, 
              left: 10, 
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" /> {/* slate-700 */}
            <XAxis 
                dataKey="year" 
                tick={{ fill: '#94A3B8' }} /* slate-400 */ 
                stroke="#475569" /* slate-600 */
                padding={{ left: 10, right: 10 }}
            />
            <YAxis 
                tickFormatter={(value) => `${value}`} 
                tick={{ fill: '#94A3B8' }} /* slate-400 */
                stroke="#475569" /* slate-600 */
                domain={['auto', 'auto']}
                 />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B', /* slate-800 */
                borderColor: '#334155', /* slate-700 */
                color: '#E2E8F0', /* slate-200 */
              }}
              cursor={{ fill: 'rgba(71, 85, 105, 0.3)' }} /* slate-500 with opacity */
              formatter={(value: number, name: string) => {
                let displayName = name;
                if (name === 'revenue') displayName = 'Ricavi';
                else if (name === 'netIncome') displayName = 'Utile Netto';
                else if (name === 'totalDebt') displayName = 'Debito Totale';
                return value !== undefined && value !== null ? [`${value} Mld €`, displayName] : [null, null];
              }}
            />
            <Legend 
                wrapperStyle={{ color: '#94A3B8', paddingTop: '10px' }} 
                formatter={(value) => {
                    if (value === 'revenue') return 'Ricavi';
                    if (value === 'netIncome') return 'Utile Netto';
                    if (value === 'totalDebt') return 'Debito Totale'; // NUOVO
                    return value;
                }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#22D3EE" /* cyan-400 */
              strokeWidth={2}
              activeDot={{ r: 6, fill: '#06B6D4', stroke: '#0A192F', strokeWidth: 2 }} /* cyan-500, bg-slate-900 */
              dot={{ r: 3, fill: '#22D3EE' }}
              name="Ricavi"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="netIncome"
              stroke="#FACC15" /* yellow-400 */
              strokeWidth={2}
              activeDot={{ r: 6, fill: '#EAB308', stroke: '#0A192F', strokeWidth: 2 }} /* yellow-500, bg-slate-900 */
              dot={{ r: 3, fill: '#FACC15' }}
              name="Utile Netto"
              connectNulls
            />
            {/* NUOVA LINEA PER IL DEBITO */}
            <Line
              type="monotone"
              dataKey="totalDebt"
              stroke="#A855F7" /* purple-500 */
              strokeWidth={2}
              activeDot={{ r: 6, fill: '#9333EA', stroke: '#0A192F', strokeWidth: 2 }} /* purple-600, bg-slate-900 */
              dot={{ r: 3, fill: '#A855F7' }}
              name="Debito Totale"
              connectNulls 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};