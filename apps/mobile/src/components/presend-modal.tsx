import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PresendAnalysis } from "@jingles/shared";

interface Props {
  visible: boolean;
  draft: string;
  analysis: PresendAnalysis | null;
  onUseSofter: (softer: string) => void;
  onSendAnyway: () => void;
  onDismiss: () => void;
}

export function PresendModal({
  visible,
  draft,
  analysis,
  onUseSofter,
  onSendAnyway,
  onDismiss,
}: Props) {
  if (!analysis) return null;

  const softer = analysis.softerAlternative;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>!</Text>
            </View>
            <Text style={styles.title}>This might come across {analysis.tone === "passive_aggressive" ? "as passive-aggressive" : `as ${analysis.tone}`}</Text>
          </View>

          <Text style={styles.explanation}>{analysis.explanation}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your draft</Text>
            <Text style={styles.draftText}>{draft}</Text>
          </View>

          {softer ? (
            <View style={styles.softerSection}>
              <Text style={styles.softerLabel}>Softer alternative</Text>
              <Text style={styles.softerText}>{softer}</Text>
            </View>
          ) : null}

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onSendAnyway}
            >
              <Text style={styles.secondaryButtonText}>Send anyway</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                !softer && styles.primaryDisabled,
                pressed && softer && { opacity: 0.85 },
              ]}
              disabled={!softer}
              onPress={() => softer && onUseSofter(softer)}
            >
              <Text style={styles.primaryButtonText}>Use this</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFBEB",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 16,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FCD34D",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#78350F",
    letterSpacing: -0.2,
    textTransform: "capitalize",
  },
  explanation: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  draftText: {
    fontSize: 15,
    color: "#78350F",
    fontStyle: "italic",
    lineHeight: 21,
  },
  softerSection: {
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  softerLabel: {
    fontSize: 11,
    color: "#78350F",
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  softerText: {
    fontSize: 16,
    color: "#1E1B4B",
    lineHeight: 22,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#92400E",
    fontSize: 15,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F59E0B",
    alignItems: "center",
  },
  primaryDisabled: {
    backgroundColor: "#FCD34D",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
