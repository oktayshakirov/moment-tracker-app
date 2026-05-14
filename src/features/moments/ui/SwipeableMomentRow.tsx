import React, { useRef } from "react";
import type { MutableRefObject } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type SwipeableRow = InstanceType<typeof Swipeable>;
import { Ionicons } from "@expo/vector-icons";
import type { Moment } from "../domain/moment";
import {
  modeFromTargetDate,
  parseMomentDate,
} from "../domain/momentFormatters";
import { MomentCard } from "./MomentCard";

type Props = {
  moment: Moment;
  onPress: () => void;
  onDelete: () => void;
  onResetStart: () => void;
  /** Tracks which row is open; closing another row when a new one opens. */
  activeSwipeRef: MutableRefObject<SwipeableRow | null>;
};

export function SwipeableMomentRow({
  moment,
  onPress,
  onDelete,
  onResetStart,
  activeSwipeRef,
}: Props) {
  const ref = useRef<SwipeableRow>(null);

  const confirmDelete = () => {
    Alert.alert("Delete moment?", `"${moment.title}" will be removed.`, [
      { text: "Cancel", style: "cancel", onPress: () => ref.current?.close() },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          onDelete();
          ref.current?.close();
        },
      },
    ]);
  };

  const confirmReset = () => {
    Alert.alert("Start time over?", "The start date will be set to now.", [
      { text: "Cancel", style: "cancel", onPress: () => ref.current?.close() },
      {
        text: "Reset",
        onPress: () => {
          onResetStart();
          ref.current?.close();
        },
      },
    ]);
  };

  const renderRight = () => (
    <View style={styles.actions}>
      {modeFromTargetDate(parseMomentDate(moment)) === "since" && (
        <Pressable
          onPress={confirmReset}
          style={[styles.btn, { backgroundColor: "#FF9F0A" }]}
          accessibilityLabel="Start time over"
        >
          <Ionicons name="refresh" size={22} color="#fff" />
          <Text style={styles.btnLabel}>Reset</Text>
        </Pressable>
      )}
      <Pressable
        onPress={confirmDelete}
        style={[styles.btn, { backgroundColor: "#FF3B30" }]}
        accessibilityLabel="Delete moment"
      >
        <Ionicons name="trash-outline" size={22} color="#fff" />
        <Text style={styles.btnLabel}>Delete</Text>
      </Pressable>
    </View>
  );

  const onSwipeableWillOpen = () => {
    const prev = activeSwipeRef.current;
    if (prev != null && prev !== ref.current) {
      prev.close();
    }
    activeSwipeRef.current = ref.current;
  };

  const onSwipeableClose = () => {
    if (activeSwipeRef.current === ref.current) {
      activeSwipeRef.current = null;
    }
  };

  return (
    <Swipeable
      ref={ref}
      friction={2}
      rightThreshold={40}
      renderRightActions={renderRight}
      overshootRight={false}
      onSwipeableWillOpen={onSwipeableWillOpen}
      onSwipeableClose={onSwipeableClose}
    >
      <MomentCard moment={moment} onPress={onPress} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 12,
    marginLeft: 8,
  },
  btn: {
    width: 88,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    gap: 4,
    marginLeft: 6,
  },
  btnLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});
