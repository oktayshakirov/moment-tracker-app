import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAppTheme } from "@/shared/theme/ThemeContext";
import { radii, space, typography } from "@/shared/theme/tokens";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { SOLID_PRESETS } from "@/features/moments/ui/constants";
import type { Category } from "../domain/category";

type Props = {
  visible: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  /** When `mode` is `edit`, used to prefill the form. */
  category: Category | null;
  onSave: (payload: { title: string; colorHex: string }) => void | Promise<void>;
};

export function CategoryEditorModal({
  visible,
  onClose,
  mode,
  category,
  onSave,
}: Props) {
  const theme = useAppTheme();
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(SOLID_PRESETS[3]);

  useEffect(() => {
    if (!visible) return;
    if (mode === "edit" && category) {
      setTitle(category.title);
      setColor(category.colorHex);
    } else {
      setTitle("");
      setColor(SOLID_PRESETS[3]);
    }
  }, [visible, mode, category]);

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    void (async () => {
      try {
        await Promise.resolve(
          onSave({ title: t, colorHex: color }),
        );
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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.bgElevated }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.heading, { color: theme.text }]}>{heading}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.textTertiary}
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
          <View style={styles.colors}>
            {SOLID_PRESETS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  color === c && styles.swatchActive,
                ]}
              />
            ))}
          </View>
          <PrimaryButton label={actionLabel} onPress={submit} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: space.xl,
  },
  sheet: {
    borderRadius: radii.lg,
    padding: space.xl,
    gap: space.md,
  },
  heading: {
    fontSize: typography.title2,
    fontWeight: "700",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: typography.body,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "600",
  },
  colors: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: "#fff",
  },
});
