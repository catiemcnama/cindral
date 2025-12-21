'use client'

import { Cell, Label, Pie, PieChart, ResponsiveContainer } from 'recharts'

type ComplianceDatum = { name: string; value: number; fill: string }

export function CompliancePie({ complianceData }: { complianceData: ComplianceDatum[] }) {
  const totalValue = complianceData.reduce((acc, curr) => acc + curr.value, 0)
  const compliantPercentage = Math.round((complianceData[0].value / totalValue) * 100)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={complianceData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {complianceData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                      {compliantPercentage}%
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                      Overall
                    </tspan>
                  </text>
                )
              }
              return null
            }}
          />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}

export default CompliancePie
