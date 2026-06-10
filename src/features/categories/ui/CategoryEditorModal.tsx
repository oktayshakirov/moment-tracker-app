import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/shared/theme/ThemeContext";
import { radii, space, typography } from "@/shared/theme/tokens";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import ColorPicker, {
  HueSlider,
  Panel1,
  Preview,
} from "reanimated-color-picker";
import type { Category } from "../domain/category";

type Props = {
  visible: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  /** When `mode` is `edit`, used to prefill the form. */
  category: Category | null;
  onSave: (payload: {
    title: string;
    colorHex: string;
  }) => void | Promise<void>;
};

export function CategoryEditorModal({
  visible,
  onClose,
  mode,
  category,
  onSave,
}: Props) {
  const theme = useAppTheme();
  const defaultColor = "#0A84FF";
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(defaultColor);

  useEffect(() => {
    if (!visible) return;
    if (mode === "edit" && category) {
      setTitle(category.title);
      setColor(category.colorHex);
    } else {
      setTitle("");
      setColor(defaultColor);
    }
  }, [visible, mode, category]);

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    void (async () => {
      try {
        await Promise.resolve(onSave({ title: t, colorHex: color }));
        onClose();
      } catch {
        /* keep modal open */
      }
    })();
  };

  const heading = mode === "create" ? "New category" : "Edit category";
  const actionLabel = mode === "create" ? "Add category" : "Save changes";

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.bg }]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.bgElevated }]}
          onPress={Keyboard.dismiss}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.headingRow}>
              <Text style={[styles.heading, { color: theme.text }]}>
                {heading}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={[styles.closeBtn, { backgroundColor: theme.glassFill, borderColor: theme.glassBorder }]}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={theme.textTertiary}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.separator,
                  backgroundColor: theme.bg,
                },
              ]}
            />
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Color
            </Text>
            <ColorPicker
              value={color}
              style={styles.picker}
              onChangeJS={(c) => setColor(c.hex)}
            >
              <Preview hideInitialColor style={styles.preview} />
              <Panel1 style={styles.panel} />
              <HueSlider style={styles.slider} />
            </ColorPicker>
            <PrimaryButton
              label={actionLabel}
              onPress={submit}
              style={{ marginTop: space.lg }}
            />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: space.xl,
  },
  sheet: {
    borderRadius: radii.lg,
    padding: space.xl,
    gap: space.lg,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.lg,
  },
  heading: {
    fontSize: typography.title2,
    fontWeight: "700",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: typography.body,
    marginBottom: space.lg,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "600",
  },
  picker: {
    gap: 12,
  },
  preview: {
    alignSelf: "stretch",
    marginBottom: space.lg,
  },
  panel: {
    borderRadius: radii.md,
    minHeight: 160,
  },
  slider: {
    borderRadius: 999,
    minHeight: 28,
  },
});
