/**
 * Privacy (Phase 10 §42-§43): the in-app privacy policy, rendered from the
 * single source in src/lib/privacy-policy.ts — App Review 5.1.1(i)
 * requires the policy to be reachable inside the app, not only on the
 * store listing.
 */

import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/app-text";
import { CloseButton } from "@/components/close-button";
import { useT } from "@/lib/i18n";
import { exitScreen } from "@/lib/navigation";
import { privacyPolicySections, privacyPolicyVersionLine } from "@/lib/privacy-policy";
import { makeThemedStyles, radius } from "@/lib/theme";

export default function PrivacyScreen() {
  const styles = useStyles();
  const { t, lang } = useT();
  const sections = privacyPolicySections(lang);
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <CloseButton onPress={() => exitScreen()} />
        <AppText variant="heading" color="strong" accessibilityRole="header">
          {t("privacy.title")}
        </AppText>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body} testID="privacy-policy">
        <AppText variant="caption" color="muted">
          {privacyPolicyVersionLine(lang)}
        </AppText>
        {sections.map((section) => (
          <View key={section.title} style={styles.card}>
            <AppText variant="subheading" color="strong" accessibilityRole="header">
              {section.title}
            </AppText>
            {section.paragraphs.map((paragraph, index) => (
              <AppText key={index} variant="caption">
                {paragraph}
              </AppText>
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
    body: { padding: 16, gap: 14, paddingBottom: 40 },
    card: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 8,
    },
  })
);
