/**
 * Privacy (Phase 10 §42-§43): the in-app privacy policy, rendered from the
 * single source in src/lib/privacy-policy.ts — App Review 5.1.1(i)
 * requires the policy to be reachable inside the app, not only on the
 * store listing.
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CloseButton } from "@/components/close-button";
import { exitScreen } from "@/lib/navigation";
import {
  PRIVACY_POLICY_EFFECTIVE,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_VERSION,
} from "@/lib/privacy-policy";
import { makeThemedStyles, radius } from "@/lib/theme";

export default function PrivacyScreen() {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <CloseButton onPress={() => exitScreen()} />
        <Text style={styles.heading} accessibilityRole="header">
          Privacy
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body} testID="privacy-policy">
        <Text style={styles.meta}>
          Version {PRIVACY_POLICY_VERSION} — effective {PRIVACY_POLICY_EFFECTIVE}
        </Text>
        {PRIVACY_POLICY_SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {section.title}
            </Text>
            {section.paragraphs.map((paragraph, index) => (
              <Text key={index} style={styles.text}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    heading: { fontSize: 18, fontWeight: "800", color: colors.neutral700 },
    body: { padding: 16, gap: 14, paddingBottom: 40 },
    meta: { fontSize: 12, color: colors.textMuted },
    card: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 8,
    },
    sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.neutral700 },
    text: { fontSize: 13, color: colors.text, lineHeight: 19 },
  })
);
