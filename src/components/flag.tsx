import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

import { FLAG_ASSETS } from "@/content/flags";
import { makeThemedStyles } from "@/lib/theme";

/**
 * Round country flags (HatScripts/circle-flags, MIT). The courseId → asset
 * map is GENERATED from each course profile's `flagAsset` (P1b), so a new
 * course needs a flag SVG under assets/images/flags/ and nothing in code.
 */
export function Flag({ courseId, size = 28 }: { courseId: string; size?: number }) {
  const styles = useStyles();
  const source = FLAG_ASSETS[courseId];
  if (!source) return null;
  return (
    <View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Image
        source={source}
        style={{ width: size, height: size }}
        contentFit="cover"
      />
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    ring: {
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.neutral200,
    },
  })
);
