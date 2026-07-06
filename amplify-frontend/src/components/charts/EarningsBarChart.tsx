import React, { useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors, spacing, radius, fonts } from '@/constants/theme';

interface MonthlyEarning {
  month: string;
  year?: number;
  amount: number;
  campaigns?: number;
}

interface EarningsBarChartProps {
  data: MonthlyEarning[];
  selectedMonth?: number;
  onSelectMonth?: (index: number) => void;
}

const CHART_HEIGHT = 200;
const CHART_PADDING = 40;
const BAR_MARGIN = 8;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const EarningsBarChart: React.FC<EarningsBarChartProps> = ({
  data,
  selectedMonth = -1,
  onSelectMonth,
}) => {
  const [selected, setSelected] = useState(selectedMonth);
  const screenWidth = Dimensions.get('window').width;
  const svgWidth = screenWidth - spacing.lg * 2;
  const chartWidth = svgWidth - CHART_PADDING * 2;

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(d => d.amount), 1);
  const yAxisMax = Math.ceil(maxValue / 1000) * 1000; // Round up to nearest 1000

  // Calculate bar dimensions
  const barWidth = (chartWidth - BAR_MARGIN * data.length) / data.length;
  const scaleFactor = (CHART_HEIGHT - CHART_PADDING) / yAxisMax;

  const handleBarPress = (index: number) => {
    setSelected(index);
    onSelectMonth?.(index);
  };

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
      <Svg width={svgWidth} height={CHART_HEIGHT}>
        {/* Y-axis */}
        <Line
          x1={CHART_PADDING - 10}
          y1={CHART_PADDING / 2}
          x2={CHART_PADDING - 10}
          y2={CHART_HEIGHT - CHART_PADDING / 2}
          stroke={colors.border}
          strokeWidth={1}
        />

        {/* X-axis */}
        <Line
          x1={CHART_PADDING - 10}
          y1={CHART_HEIGHT - CHART_PADDING / 2}
          x2={svgWidth - CHART_PADDING}
          y2={CHART_HEIGHT - CHART_PADDING / 2}
          stroke={colors.border}
          strokeWidth={1}
        />

        {/* Y-axis labels (grid lines and values) */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = CHART_HEIGHT - CHART_PADDING / 2 - (CHART_HEIGHT - CHART_PADDING) * ratio;
          const value = Math.round(yAxisMax * ratio);
          return (
            <React.Fragment key={`y-label-${idx}`}>
              <Line
                x1={CHART_PADDING - 15}
                y1={y}
                x2={CHART_PADDING - 10}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
              />
              <SvgText
                x={CHART_PADDING - 20}
                y={y + 4}
                fontSize={10}
                fill={colors.textMuted}
                textAnchor="end"
              >
                ${value / 1000}k
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = item.amount * scaleFactor;
          const xPosition = CHART_PADDING + index * (barWidth + BAR_MARGIN);
          const yPosition = CHART_HEIGHT - CHART_PADDING / 2 - barHeight;
          const isSelected = selected === index;

          return (
            <Pressable
              key={`bar-${index}`}
              onPress={() => handleBarPress(index)}
              style={{
                position: 'absolute',
                left: xPosition,
                top: yPosition,
                width: barWidth,
                height: barHeight,
              }}
            >
              <Rect
                x={xPosition}
                y={yPosition}
                width={barWidth}
                height={barHeight}
                fill={isSelected ? colors.gold : colors.blue}
                rx={radius.sm}
              />
            </Pressable>
          );
        })}

        {/* Month labels */}
        {data.map((item, index) => {
          const xPosition = CHART_PADDING + index * (barWidth + BAR_MARGIN) + barWidth / 2;
          const yPosition = CHART_HEIGHT - CHART_PADDING / 2 + 20;

          return (
            <SvgText
              key={`month-${index}`}
              x={xPosition}
              y={yPosition}
              fontSize={12}
              fill={colors.textMuted}
              textAnchor="middle"
            >
              {item.month.substring(0, 3)}
            </SvgText>
          );
        })}

        {/* Tooltip */}
        {selected >= 0 && (
          <>
            {/* Tooltip background */}
            <Rect
              x={CHART_PADDING + selected * (barWidth + BAR_MARGIN) + barWidth / 2 - 35}
              y={CHART_HEIGHT - CHART_PADDING / 2 - data[selected].amount * scaleFactor - 40}
              width={70}
              height={30}
              fill={colors.card}
              stroke={colors.gold}
              strokeWidth={1}
              rx={radius.sm}
            />
            {/* Tooltip text */}
            <SvgText
              x={CHART_PADDING + selected * (barWidth + BAR_MARGIN) + barWidth / 2}
              y={CHART_HEIGHT - CHART_PADDING / 2 - data[selected].amount * scaleFactor - 18}
              fontSize={14}
              fill={colors.gold}
              textAnchor="middle"
              fontWeight="600"
            >
              ${data[selected].amount}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
};
