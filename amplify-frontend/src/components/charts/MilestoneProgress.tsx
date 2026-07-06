import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors, spacing, radius, fonts } from '@/constants/theme';

interface MilestoneItem {
  views: number;
  label: string;
}

interface MilestoneProgressProps {
  milestones: MilestoneItem[];
  currentViews: number;
  milestonesHit: number[];
}

const TRACK_HEIGHT = 120;
const TRACK_PADDING = 30;
const CIRCLE_RADIUS = 8;
const TRACK_LINE_HEIGHT = 4;

export const MilestoneProgress: React.FC<MilestoneProgressProps> = ({
  milestones,
  currentViews,
  milestonesHit,
}) => {
  // Find the next milestone
  const nextMilestoneIndex = milestones.findIndex(m => !milestonesHit.includes(m.views));
  const nextMilestone = nextMilestoneIndex >= 0 ? milestones[nextMilestoneIndex] : null;

  // Calculate max views for scaling
  const maxViews = Math.max(...milestones.map(m => m.views), currentViews);

  // Calculate track dimensions
  const svgWidth = 320;
  const trackStart = TRACK_PADDING;
  const trackEnd = svgWidth - TRACK_PADDING;
  const trackWidth = trackEnd - trackStart;

  // Calculate progress position
  const progressRatio = Math.min(currentViews / maxViews, 1);
  const progressX = trackStart + trackWidth * progressRatio;

  // Calculate milestone positions
  const getMilestoneX = (views: number) => {
    const ratio = Math.min(views / maxViews, 1);
    return trackStart + trackWidth * ratio;
  };

  return (
    <View style={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.lg }}>
      {/* Track SVG */}
      <Svg width={svgWidth} height={TRACK_HEIGHT}>
        {/* Background track line */}
        <Line
          x1={trackStart}
          y1={TRACK_HEIGHT / 2}
          x2={trackEnd}
          y2={TRACK_HEIGHT / 2}
          stroke={colors.border}
          strokeWidth={TRACK_LINE_HEIGHT}
        />

        {/* Progress fill line */}
        <Line
          x1={trackStart}
          y1={TRACK_HEIGHT / 2}
          x2={progressX}
          y2={TRACK_HEIGHT / 2}
          stroke={colors.gold}
          strokeWidth={TRACK_LINE_HEIGHT}
        />

        {/* Milestone circles and labels */}
        {milestones.map((milestone, index) => {
          const x = getMilestoneX(milestone.views);
          const isHit = milestonesHit.includes(milestone.views);

          return (
            <React.Fragment key={`milestone-${index}`}>
              {/* Circle */}
              <Circle
                cx={x}
                cy={TRACK_HEIGHT / 2}
                r={CIRCLE_RADIUS}
                fill={isHit ? colors.gold : colors.bg}
                stroke={isHit ? colors.goldGlow : colors.border}
                strokeWidth={2}
              />

              {/* Milestone label */}
              <SvgText
                x={x}
                y={TRACK_HEIGHT / 2 + 30}
                fontSize={11}
                fill={colors.textMuted}
                textAnchor="middle"
              >
                {milestone.label}
              </SvgText>

              {/* Views count */}
              <SvgText
                x={x}
                y={TRACK_HEIGHT / 2 + 45}
                fontSize={10}
                fill={colors.textMuted}
                textAnchor="middle"
              >
                {milestone.views}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Current views indicator */}
        <Circle
          cx={progressX}
          cy={TRACK_HEIGHT / 2}
          r={CIRCLE_RADIUS + 3}
          fill="none"
          stroke={colors.gold}
          strokeWidth={2}
          opacity={0.5}
        />
      </Svg>

      {/* Current views and next milestone info */}
      <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.sm }}>
        <Text
          style={{
            fontSize: 13,
            color: colors.text,
            fontWeight: '600',
            marginBottom: spacing.xs,
          }}
        >
          Current: {currentViews.toLocaleString()} views
        </Text>

        {nextMilestone ? (
          <Text
            style={{
              fontSize: 12,
              color: colors.textMuted,
            }}
          >
            Next milestone at {nextMilestone.views.toLocaleString()} views
          </Text>
        ) : (
          <Text
            style={{
              fontSize: 12,
              color: colors.gold,
              fontWeight: '600',
            }}
          >
            All milestones achieved!
          </Text>
        )}
      </View>
    </View>
  );
};
