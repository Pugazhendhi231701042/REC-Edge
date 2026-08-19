import React from 'react';

interface COPOMappingTableProps {
  poCount?: number;
  psoCount?: number;
  mappings: Record<string, number>; // key: `${coNumber}_${poKey}`, value: 0|1|2|3
  onChange: (coNumber: number, poKey: string, correlation: number) => void;
  disabled?: boolean;
}

export const COPOMappingTable: React.FC<COPOMappingTableProps> = ({
  poCount = 12,
  psoCount = 3,
  mappings,
  onChange,
  disabled = false,
}) => {
  const poKeys: string[] = [];
  for (let p = 1; p <= poCount; p++) poKeys.push(`PO${p}`);
  for (let p = 1; p <= psoCount; p++) poKeys.push(`PSO${p}`);

  const cos = [1, 2, 3, 4, 5];

  return (
    <div className="overflow-x-auto border border-purple-100 rounded-xl shadow-sm bg-white">
      <table className="w-full text-xs text-center divide-y divide-slate-200">
        <thead className="bg-purple-50 text-slate-700 font-semibold">
          <tr>
            <th className="p-2.5 text-left border-r border-purple-100 min-w-[80px]">CO / PO</th>
            {poKeys.map((key) => (
              <th key={key} className={`p-2 min-w-[50px] ${key.startsWith('PSO') ? 'bg-amber-50 text-amber-900 font-bold' : ''}`}>
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {cos.map((coNum) => (
            <tr key={coNum} className="hover:bg-slate-50 transition-colors">
              <td className="p-2.5 font-bold text-brand-700 text-left border-r border-purple-100 bg-purple-50/40">
                CO{coNum}
              </td>
              {poKeys.map((key) => {
                const mapKey = `${coNum}_${key}`;
                const val = mappings[mapKey] ?? 0;

                return (
                  <td key={key} className={`p-1.5 ${key.startsWith('PSO') ? 'bg-amber-50/30' : ''}`}>
                    <select
                      value={val}
                      disabled={disabled}
                      onChange={(e) => onChange(coNum, key, parseInt(e.target.value))}
                      className={`w-full text-center font-bold rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 border ${
                        val === 3
                          ? 'bg-purple-100 text-brand-800 border-purple-300'
                          : val === 2
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : val === 1
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      <option value={0}>-</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-desc flex items-center justify-between">
        <span>Correlation Scale: <strong>1</strong> — Slight (Low) | <strong>2</strong> — Moderate (Medium) | <strong>3</strong> — Substantial (High) | <strong>-</strong> — No Correlation</span>
        <span className="text-brand-700 font-medium">16 Total Mapping Columns</span>
      </div>
    </div>
  );
};
