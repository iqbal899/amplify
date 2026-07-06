import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Rect } from 'react-native-svg';
import { colors } from '@/constants/theme';

interface AudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
}

export function AudioWaveform({ isPlaying, barCount = 8 }: AudioWaveformProps) {
  const [barHeights, setBarHeights] = useState(Array.from({ length: barCount }).map(() => 8));

  useEffect(() => {
    if (!isPlaying) {
      setBarHeights(Array.from({ length: barCount }).map(() => 8));
      return;
    }

    const interval = setInterval(() => {
      setBarHeights(
        Array.from({ length: barCount }).map(() => 8 + Math.random() * 24)
      );
    }, 300);

    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  const BAR_WIDTH = 3;
  const BAR_SPACING = 2;
  const TOTAL_WIDTH = barCount * (BAR_WIDTH + BAR_SPACING) + BAR_SPACING;

  return (
    <View style={styles.container}>
      <Svg width={TOTAL_WIDTH} height={32} viewBox={`0 0 ${TOTAL_WIDTH} 32`}>
        {barHeights.map((height, index) => (
          <Rect
            key={index}
            x={BAR_SPACING + index * (BAR_WIDTH + BAR_SPACING)}
            y={(32 - height) / 2}
            width={BAR_WIDTH}
            height={height}
            fill={colors.blue}
            rx={1.5}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
