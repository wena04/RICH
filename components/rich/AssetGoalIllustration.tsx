import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';

import { PRIMARY_GREEN } from '@/constants/Colors';

type AssetGoalIllustrationProps = {
  progress: number;
  width?: number;
  height?: number;
};

/** Original Rich asset-goal scene, with a live progress meter layered over the supplied artwork. */
export function AssetGoalIllustration({
  progress,
  width = 146,
  height = 182,
}: AssetGoalIllustrationProps) {
  const bounded = Math.max(0, Math.min(100, progress));
  const meterHeight = height * 0.54;
  const fillHeight = (meterHeight * bounded) / 100;

  return (
    <ImageBackground
      accessibilityLabel={`目标资产完成 ${Math.round(bounded)}%`}
      accessibilityRole="image"
      imageStyle={styles.backgroundImage}
      resizeMode="stretch"
      source={require('../../assets/images/ui/asset-canvas.png')}
      style={[styles.frame, { width, height }]}
    >
      <Image
        resizeMode="contain"
        source={require('../../assets/images/ui/asset-castle.png')}
        style={{
          position: 'absolute',
          left: width * 0.16,
          bottom: 0,
          width: width * 0.47,
          height: height * 0.84,
        }}
      />

      <View
        style={[
          styles.meterTrack,
          { top: height * 0.12, right: width * 0.08, height: meterHeight },
        ]}
      >
        <View style={[styles.meterFill, { height: fillHeight }]} />
      </View>
      <View style={[styles.meterCap, { top: height * 0.06, right: width * 0.075 }]} />
      <Text style={[styles.percent, { right: width * 0.035, bottom: height * 0.1 }]}>
        {Math.round(bounded)}%
      </Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderRadius: 18,
  },
  backgroundImage: { borderRadius: 18 },
  meterTrack: {
    position: 'absolute',
    width: 10,
    borderRadius: 5,
    backgroundColor: '#68716F',
    borderWidth: 1,
    borderColor: '#AEB9B5',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 2,
  },
  meterFill: {
    width: 4,
    alignSelf: 'center',
    borderRadius: 2,
    backgroundColor: PRIMARY_GREEN,
  },
  meterCap: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#AEB9B5',
  },
  percent: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
});
