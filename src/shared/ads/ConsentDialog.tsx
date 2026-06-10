import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TRACKING_CONSENT_KEY = "trackingConsent";

const COLORS = {
  background: "#1C2127",
  text: "#F2F2F7",
  textMuted: "#AEAEB2",
  highlight: "#60D4FC",
};

export interface ConsentDialogProps {
  onConsentCompleted: () => void;
}

export function ConsentDialog({ onConsentCompleted }: ConsentDialogProps) {
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      AsyncStorage.getItem(TRACKING_CONSENT_KEY).then((storedConsent) => {
        if (storedConsent === null) {
          setModalVisible(true);
        } else {
          onConsentCompleted();
        }
      });
      return;
    }

    // iOS: use native ATT prompt; no custom dialog shown.
    if (Platform.OS === "ios" && Constants.appOwnership !== "expo") {
      (async () => {
        try {
          const {
            getTrackingPermissionsAsync,
            requestTrackingPermissionsAsync,
          } = await import("expo-tracking-transparency");
          const { status } = await getTrackingPermissionsAsync();
          if (status === "undetermined") {
            const { status: newStatus } =
              await requestTrackingPermissionsAsync();
            await AsyncStorage.setItem(
              TRACKING_CONSENT_KEY,
              newStatus === "granted" ? "granted" : "denied",
            );
          } else {
            await AsyncStorage.setItem(
              TRACKING_CONSENT_KEY,
              status === "granted" ? "granted" : "denied",
            );
          }
        } catch {
          // Module or ATT unavailable; proceed without storing.
        }
        onConsentCompleted();
      })();
    } else {
      onConsentCompleted();
    }
  }, [onConsentCompleted]);

  const handleAllow = async () => {
    await AsyncStorage.setItem(TRACKING_CONSENT_KEY, "granted");
    setModalVisible(false);
    onConsentCompleted();
  };

  const handleDontAllow = async () => {
    await AsyncStorage.setItem(TRACKING_CONSENT_KEY, "denied");
    setModalVisible(false);
    onConsentCompleted();
  };

  if (Platform.OS !== "android") {
    return null;
  }

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Your Privacy & Experience</Text>
          <Text style={styles.intro}>
            To keep Moment Tracker free, we ask for your consent to:
          </Text>

          <View style={styles.listBlock}>
            <Text style={styles.bullet}>• Show personalized ads</Text>
          </View>

          <Text style={styles.disclaimer}>
            You can change your choice at any time. Ads help us keep the app
            free for everyone.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleDontAllow} style={styles.button}>
              <Text style={styles.buttonText}>Don't Allow</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAllow} style={styles.button}>
              <Text style={[styles.buttonText, styles.agreeButton]}>Allow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContainer: {
    width: "86%",
    maxWidth: 340,
    backgroundColor: COLORS.background,
    padding: 24,
    borderRadius: 14,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
  },
  intro: {
    fontSize: 15,
    color: COLORS.textMuted,
    lineHeight: 22,
    marginBottom: 16,
  },
  listBlock: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 2,
  },
  disclaimer: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    fontStyle: "italic",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  buttonText: {
    fontSize: 16,
    color: COLORS.highlight,
  },
  agreeButton: {
    fontWeight: "600",
  },
});
