import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import ColorPicker, {
  HueSlider,
  Panel1,
  Preview,
} from "reanimated-color-picker";
import type { MomentFormScreenProps } from "@/app/navigation/types";
import { useRepositories } from "@/app/database/AppDataProvider";
import {
  DEFAULT_CATEGORY_ID,
  type Category,
} from "@/features/categories/domain/category";
import { CategoryEditorModal } from "@/features/categories/ui/CategoryEditorModal";
import { Screen } from "@/shared/ui/Screen";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { useAppTheme } from "@/shared/theme/ThemeContext";
import { radii, space, typography } from "@/shared/theme/tokens";
import type {
  BackgroundType,
  BackgroundValue,
  DisplayUnit,
  Moment,
} from "../domain/moment";
import { modeFromTargetDate } from "../domain/momentFormatters";
import { copyImageToAppStorage } from "../data/imageFileService";
import { scheduleMilestonesForMoment } from "../data/milestoneNotifications";
import {
  getUnsplashAccessKey,
  searchPhotos,
  trackPhotoDownload,
  type UnsplashPhoto,
} from "../data/unsplashApi";
import { MomentCard } from "./MomentCard";

const DISPLAY_UNITS: DisplayUnit[] = [
  "auto",
  "seconds",
  "minutes",
  "hours",
  "days",
  "weeks",
  "months",
  "years",
];
const DEFAULT_SOLID_COLOR = "#0A84FF";
const FALLBACK_IMAGE_SEARCH = "cinematic landscape wallpaper";

/** Drop seconds so pickers and labels stay minute-precision only. */
function trimToMinute(d: Date): Date {
  const x = new Date(d.getTime());
  x.setSeconds(0, 0);
  return x;
}

export function MomentFormScreen({ navigation, route }: MomentFormScreenProps) {
  const theme = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const { moments, categories } = useRepositories();
  const momentId = route.params?.momentId;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => trimToMinute(new Date()));
  const [categoryId, setCategoryId] = useState(DEFAULT_CATEGORY_ID);
  const [bgType, setBgType] = useState<BackgroundType>("solid");
  const [bgValue, setBgValue] = useState<BackgroundValue>({
    kind: "solid",
    color: DEFAULT_SOLID_COLOR,
  });
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>("auto");

  const [catList, setCatList] = useState<
    Awaited<ReturnType<typeof categories.listAll>>
  >([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [categoryEditorMode, setCategoryEditorMode] = useState<
    "create" | "edit"
  >("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDisplayUnitPicker, setShowDisplayUnitPicker] = useState(false);
  const [showOnlineImagePicker, setShowOnlineImagePicker] = useState(false);
  const [onlineQuery, setOnlineQuery] = useState("");
  const [onlineResults, setOnlineResults] = useState<UnsplashPhoto[]>([]);
  const [loadingOnlineResults, setLoadingOnlineResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const uiAccent = theme.accent;
  const previewAccent = getBackgroundAccent(bgValue, theme.accent);
  const previewAccentSubtle = `${previewAccent}1F`;

  const selectedCategory = catList.find((c) => c.id === categoryId);
  const selectedCategoryTitle = selectedCategory?.title ?? "Moments";

  const loadCategories = useCallback(async () => {
    setCatList(await categories.listAll());
  }, [categories]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!momentId) return;
    void (async () => {
      const m = await moments.getById(momentId);
      if (!m) return;
      setTitle(m.title);
      setDate(trimToMinute(new Date(m.targetDateTime)));
      setCategoryId(m.categoryId);
      if (
        m.backgroundType === "gradient" &&
        m.backgroundValue.kind === "gradient"
      ) {
        const fallback =
          m.backgroundValue.colors[m.backgroundValue.colors.length - 1] ??
          DEFAULT_SOLID_COLOR;
        setBgType("solid");
        setBgValue({ kind: "solid", color: fallback });
      } else {
        setBgType(m.backgroundType);
        setBgValue(m.backgroundValue);
      }
      setDisplayUnit(m.displayUnit);
    })();
  }, [momentId, moments]);

  const onSave = useCallback(async () => {
    const t = title.trim();
    if (!t) {
      Alert.alert("Title required", "Give this moment a name.");
      return;
    }
    if (bgType === "image" && bgValue.kind !== "image") {
      Alert.alert("Image required", "Choose from Gallery or Online.");
      return;
    }
    setSaving(true);
    try {
      const atMinute = trimToMinute(date);
      const iso = atMinute.toISOString();
      const mode = modeFromTargetDate(atMinute);
      if (momentId) {
        await moments.update(momentId, {
          title: t,
          targetDateTime: iso,
          mode,
          categoryId,
          backgroundType: bgType,
          backgroundValue: bgValue,
          displayUnit,
        });
        const updated = await moments.getById(momentId);
        if (updated) await scheduleMilestonesForMoment(updated);
      } else {
        const created = await moments.create({
          title: t,
          targetDateTime: iso,
          mode,
          categoryId,
          backgroundType: bgType,
          backgroundValue: bgValue,
          displayUnit,
        });
        await scheduleMilestonesForMoment(created);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert(
        "Could not save",
        e instanceof Error ? e.message : "Unknown error",
      );
    } finally {
      setSaving(false);
    }
  }, [
    title,
    date,
    categoryId,
    bgType,
    bgValue,
    displayUnit,
    momentId,
    moments,
    navigation,
  ]);

  const pickGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to set a background.",
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    const uri = await copyImageToAppStorage(res.assets[0].uri);
    setBgType("image");
    setBgValue({ kind: "image", uri });
  };

  const queryForTitle = useCallback(
    () => title.trim() || FALLBACK_IMAGE_SEARCH,
    [title],
  );

  const fetchOnlinePhotos = useCallback(async (query: string) => {
    const accessKey = getUnsplashAccessKey();
    if (!accessKey) {
      Alert.alert(
        "Unsplash access key missing",
        "Create an application at unsplash.com/oauth/applications, copy the Access Key, add EXPO_PUBLIC_UNSPLASH_ACCESS_KEY to a .env file in the project root, then restart Expo. See https://unsplash.com/documentation (Authorization — Public).",
      );
      return;
    }
    setLoadingOnlineResults(true);
    try {
      const data = await searchPhotos({
        accessKey,
        query: query.trim() || FALLBACK_IMAGE_SEARCH,
        perPage: 30,
      });
      setOnlineResults(data.results);
    } catch (e) {
      Alert.alert(
        "Unsplash search failed",
        e instanceof Error ? e.message : "Unknown error",
      );
      setOnlineResults([]);
    } finally {
      setLoadingOnlineResults(false);
    }
  }, []);

  const openOnlineImagePicker = useCallback(() => {
    setOnlineQuery("");
    setShowOnlineImagePicker(true);
    void fetchOnlinePhotos(queryForTitle());
  }, [fetchOnlinePhotos, queryForTitle]);

  const runOnlineSearch = useCallback(() => {
    void fetchOnlinePhotos(onlineQuery);
  }, [fetchOnlinePhotos, onlineQuery]);

  const pickOnlineImage = useCallback(async (photo: UnsplashPhoto) => {
    const accessKey = getUnsplashAccessKey();
    if (!accessKey) return;
    try {
      await trackPhotoDownload(accessKey, photo.id);
      const uri = await copyImageToAppStorage(photo.urls.regular);
      const photographerHtmlUrl =
        photo.user.links?.html ??
        `https://unsplash.com/@${photo.user.username}`;
      setBgType("image");
      setBgValue({
        kind: "image",
        uri,
        unsplashAttribution: {
          photographerName: photo.user.name,
          photographerHtmlUrl,
          photoHtmlUrl: photo.links.html,
        },
      });
      setShowOnlineImagePicker(false);
    } catch (e) {
      Alert.alert(
        "Could not use image",
        e instanceof Error ? e.message : "Unknown error",
      );
    }
  }, []);

  const removeAttachedImage = useCallback(() => {
    setBgType("solid");
    setBgValue({ kind: "solid", color: DEFAULT_SOLID_COLOR });
  }, []);

  const previewMoment: Moment = {
    id: momentId ?? "preview",
    title: title.trim() || "New moment",
    targetDateTime: date.toISOString(),
    mode: modeFromTargetDate(date),
    categoryId,
    backgroundType: bgType,
    backgroundValue: bgValue,
    displayUnit,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const setDatePart = (picked: Date) => {
    const next = new Date(date);
    next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    setDate(trimToMinute(next));
  };

  const setTimePart = (picked: Date) => {
    const next = new Date(date);
    next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    setDate(trimToMinute(next));
  };

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MomentCard moment={previewMoment} onPress={() => {}} />
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="A name you will love seeing"
            placeholderTextColor={theme.textTertiary}
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.separator,
                backgroundColor: theme.bgElevated,
              },
            ]}
          />
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Date
          </Text>
          <Pressable
            style={[
              styles.rowBtn,
              {
                borderColor: theme.separator,
                backgroundColor: theme.bgElevated,
              },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={theme.textSecondary}
            />
            <View style={styles.rowBtnCopy}>
              <Text style={[styles.rowBtnText, { color: theme.text }]}>
                {format(date, "PP")}
              </Text>
              <Text style={[styles.rowBtnHint, { color: theme.textSecondary }]}>
                Tap to change
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textTertiary}
            />
          </Pressable>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Time
          </Text>
          <Pressable
            style={[
              styles.rowBtn,
              {
                borderColor: theme.separator,
                backgroundColor: theme.bgElevated,
              },
            ]}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={theme.textSecondary}
            />
            <View style={styles.rowBtnCopy}>
              <Text style={[styles.rowBtnText, { color: theme.text }]}>
                {format(date, "p")}
              </Text>
              <Text style={[styles.rowBtnHint, { color: theme.textSecondary }]}>
                Tap to change
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textTertiary}
            />
          </Pressable>
          {Platform.OS === "android" && showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) setDatePart(selected);
              }}
            />
          )}
          {Platform.OS === "android" && showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display="default"
              minuteInterval={1}
              onChange={(_, selected) => {
                setShowTimePicker(false);
                if (selected) setTimePart(selected);
              }}
            />
          )}

          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Category
          </Text>
          <Pressable
            style={[
              styles.rowBtn,
              {
                borderColor: theme.separator,
                backgroundColor: theme.bgElevated,
              },
            ]}
            onPress={() => setShowCategoryPicker(true)}
          >
            <View
              style={[
                styles.categoryDot,
                {
                  backgroundColor:
                    selectedCategory?.colorHex ?? theme.textTertiary,
                },
              ]}
            />
            <View style={styles.rowBtnCopy}>
              <Text style={[styles.rowBtnText, { color: theme.text }]}>
                {selectedCategoryTitle}
              </Text>
              <Text style={[styles.rowBtnHint, { color: theme.textSecondary }]}>
                Tap to choose category
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textTertiary}
            />
          </Pressable>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Show as
          </Text>
          <Pressable
            style={[
              styles.rowBtn,
              {
                borderColor: theme.separator,
                backgroundColor: theme.bgElevated,
              },
            ]}
            onPress={() => setShowDisplayUnitPicker(true)}
          >
            <Ionicons name="timer-outline" size={20} color={uiAccent} />
            <View style={styles.rowBtnCopy}>
              <Text style={[styles.rowBtnText, { color: theme.text }]}>
                {formatDisplayUnitName(displayUnit)}
              </Text>
              <Text style={[styles.rowBtnHint, { color: theme.textSecondary }]}>
                Tap to choose unit
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textTertiary}
            />
          </Pressable>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Background
          </Text>
          <View style={[styles.segment, styles.backgroundSegment]}>
            {(["image", "solid"] as const).map((b) => (
              <Pressable
                key={b}
                onPress={() => {
                  setBgType(b);
                  if (b === "solid" && bgValue.kind !== "solid") {
                    setBgValue({ kind: "solid", color: DEFAULT_SOLID_COLOR });
                  }
                }}
                style={[
                  styles.segBtn,
                  bgType === b && { backgroundColor: uiAccent },
                  { borderColor: theme.separator },
                ]}
              >
                <Text
                  style={[
                    styles.segText,
                    { color: bgType === b ? "#fff" : theme.text },
                  ]}
                >
                  {b === "solid" ? "Color" : "Image"}
                </Text>
              </Pressable>
            ))}
          </View>
          {bgType === "image" && (
            <View style={styles.imageActionsRow}>
              <Pressable
                style={[
                  styles.imageActionTile,
                  {
                    borderColor: theme.separator,
                    backgroundColor: theme.bgElevated,
                  },
                ]}
                onPress={() => void pickGallery()}
              >
                <Ionicons name="images-outline" size={28} color={uiAccent} />
                <Text style={[styles.imageActionTitle, { color: theme.text }]}>
                  Gallery
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.imageActionTile,
                  {
                    borderColor: theme.separator,
                    backgroundColor: theme.bgElevated,
                  },
                ]}
                onPress={openOnlineImagePicker}
              >
                <Ionicons name="globe-outline" size={28} color={uiAccent} />
                <Text style={[styles.imageActionTitle, { color: theme.text }]}>
                  Online
                </Text>
              </Pressable>
            </View>
          )}
          {bgType === "image" && bgValue.kind === "image" ? (
            <View style={styles.attachedImagePreviewWrap}>
              <View
                style={[
                  styles.attachedImageFrame,
                  {
                    borderColor: theme.separator,
                    backgroundColor: theme.bg,
                  },
                ]}
              >
                <Image
                  source={{ uri: bgValue.uri }}
                  style={styles.attachedImage}
                  contentFit="cover"
                  transition={160}
                />
                <Pressable
                  style={styles.attachedImageRemoveBtn}
                  onPress={removeAttachedImage}
                  hitSlop={8}
                  accessibilityLabel="Remove image"
                  accessibilityHint="Switches background to solid color"
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
          ) : null}
          {bgType === "solid" && (
            <ColorPicker
              value={
                bgValue.kind === "solid" ? bgValue.color : DEFAULT_SOLID_COLOR
              }
              style={styles.colorPicker}
              onChangeJS={(c) => {
                setBgType("solid");
                setBgValue({ kind: "solid", color: c.hex });
              }}
            >
              <Preview hideInitialColor style={styles.colorPickerPreview} />
              <Panel1 style={styles.colorPickerPanel} />
              <HueSlider style={styles.colorPickerSlider} />
            </ColorPicker>
          )}
          <PrimaryButton
            label={momentId ? "Save changes" : "Save moment"}
            onPress={() => void onSave()}
            loading={saving}
            style={{ marginTop: space.xl, backgroundColor: uiAccent }}
          />
          <View style={{ height: space.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CategoryEditorModal
        visible={showCategoryEditor}
        onClose={() => {
          setShowCategoryEditor(false);
          setEditingCategory(null);
        }}
        mode={categoryEditorMode}
        category={categoryEditorMode === "edit" ? editingCategory : null}
        onSave={async (payload) => {
          if (categoryEditorMode === "create") {
            const c = await categories.create({
              title: payload.title,
              colorHex: payload.colorHex,
            });
            await loadCategories();
            setCategoryId(c.id);
          } else if (editingCategory) {
            await categories.update(editingCategory.id, payload);
            await loadCategories();
          }
        }}
      />

      <Modal visible={showCategoryPicker} animationType="fade" transparent>
        <Pressable
          style={styles.dateBackdrop}
          onPress={() => setShowCategoryPicker(false)}
        >
          <Pressable
            style={[styles.dateSheet, { backgroundColor: theme.bgElevated }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.dateSheetHeader}>
              <Text style={[styles.dateSheetTitle, { color: theme.text }]}>
                Category
              </Text>
              <Pressable
                onPress={() => setShowCategoryPicker(false)}
                hitSlop={12}
              >
                <Text
                  style={{
                    color: uiAccent,
                    fontSize: typography.body,
                    fontWeight: "600",
                  }}
                >
                  Done
                </Text>
              </Pressable>
            </View>
            <ScrollView
              style={[
                styles.categoryPickerScroll,
                { maxHeight: windowHeight * 0.52 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Pressable
                onPress={() => {
                  setCategoryEditorMode("create");
                  setEditingCategory(null);
                  setShowCategoryPicker(false);
                  setShowCategoryEditor(true);
                }}
                style={[
                  styles.addCategoryRow,
                  { borderColor: theme.separator },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={uiAccent}
                />
                <Text style={[styles.addCategoryLabel, { color: uiAccent }]}>
                  Add category
                </Text>
              </Pressable>
              {catList.map((c) => {
                const isSelected = c.id === categoryId;
                return (
                  <View
                    key={c.id}
                    style={[
                      styles.categoryManageRow,
                      { borderColor: theme.separator },
                      isSelected && { backgroundColor: previewAccentSubtle },
                    ]}
                  >
                    <Pressable
                      style={styles.categoryManageMain}
                      onPress={() => {
                        setCategoryId(c.id);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <View
                        style={[
                          styles.categoryDotSmall,
                          { backgroundColor: c.colorHex },
                        ]}
                      />
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: theme.text, flex: 1 },
                        ]}
                        numberOfLines={1}
                      >
                        {c.title}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setCategoryEditorMode("edit");
                        setEditingCategory(c);
                        setShowCategoryPicker(false);
                        setShowCategoryEditor(true);
                      }}
                      hitSlop={10}
                      style={styles.categoryIconBtn}
                      accessibilityLabel={`Edit ${c.title}`}
                    >
                      <Ionicons
                        name="create-outline"
                        size={22}
                        color={theme.textSecondary}
                      />
                    </Pressable>
                    {c.id !== DEFAULT_CATEGORY_ID ? (
                      <Pressable
                        onPress={() =>
                          Alert.alert(
                            "Delete category?",
                            `Moments in "${c.title}" will move to the default category.`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () =>
                                  void (async () => {
                                    await categories.delete(c.id);
                                    await loadCategories();
                                    if (categoryId === c.id) {
                                      setCategoryId(DEFAULT_CATEGORY_ID);
                                    }
                                  })(),
                              },
                            ],
                          )
                        }
                        hitSlop={10}
                        style={styles.categoryIconBtn}
                        accessibilityLabel={`Delete ${c.title}`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={22}
                          color="#FF3B30"
                        />
                      </Pressable>
                    ) : (
                      <View style={styles.categoryIconSpacer} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={Platform.OS === "ios" && showDatePicker}
        animationType="fade"
        transparent
      >
        <Pressable
          style={styles.dateBackdrop}
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable
            style={[
              styles.dateSheet,
              {
                backgroundColor: theme.bgElevated,
                maxHeight: windowHeight * 0.92,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.dateSheetHeader}>
              <Text style={[styles.dateSheetTitle, { color: theme.text }]}>
                Choose date
              </Text>
              <Pressable onPress={() => setShowDatePicker(false)} hitSlop={12}>
                <Text
                  style={{
                    color: uiAccent,
                    fontSize: typography.body,
                    fontWeight: "600",
                  }}
                >
                  Done
                </Text>
              </Pressable>
            </View>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator
              style={styles.datePickerScroll}
              contentContainerStyle={styles.datePickerScrollContent}
            >
              <View
                style={[
                  styles.datePickerMinBox,
                  {
                    minHeight: Math.min(
                      560,
                      Math.max(430, Math.round(windowHeight * 0.48)),
                    ),
                  },
                ]}
              >
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="inline"
                  onChange={(_, selected) => {
                    if (selected) setDatePart(selected);
                  }}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={Platform.OS === "ios" && showTimePicker}
        animationType="fade"
        transparent
      >
        <Pressable
          style={styles.dateBackdrop}
          onPress={() => setShowTimePicker(false)}
        >
          <Pressable
            style={[styles.dateSheet, { backgroundColor: theme.bgElevated }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.dateSheetHeader}>
              <Text style={[styles.dateSheetTitle, { color: theme.text }]}>
                Choose time
              </Text>
              <Pressable onPress={() => setShowTimePicker(false)} hitSlop={12}>
                <Text
                  style={{
                    color: uiAccent,
                    fontSize: typography.body,
                    fontWeight: "600",
                  }}
                >
                  Done
                </Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={date}
              mode="time"
              display="spinner"
              minuteInterval={1}
              onChange={(_, selected) => {
                if (selected) setTimePart(selected);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showDisplayUnitPicker} animationType="fade" transparent>
        <Pressable
          style={styles.dateBackdrop}
          onPress={() => setShowDisplayUnitPicker(false)}
        >
          <Pressable
            style={[styles.dateSheet, { backgroundColor: theme.bgElevated }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.dateSheetHeader}>
              <Text style={[styles.dateSheetTitle, { color: theme.text }]}>
                Show counter as
              </Text>
              <Pressable
                onPress={() => setShowDisplayUnitPicker(false)}
                hitSlop={12}
              >
                <Text
                  style={{
                    color: uiAccent,
                    fontSize: typography.body,
                    fontWeight: "600",
                  }}
                >
                  Done
                </Text>
              </Pressable>
            </View>
            <View style={styles.optionList}>
              {DISPLAY_UNITS.map((unit) => {
                const isSelected = unit === displayUnit;
                return (
                  <Pressable
                    key={unit}
                    onPress={() => {
                      setDisplayUnit(unit);
                      setShowDisplayUnitPicker(false);
                    }}
                    style={[
                      styles.optionRow,
                      { borderColor: theme.separator },
                      isSelected && { backgroundColor: previewAccentSubtle },
                    ]}
                  >
                    <Text style={[styles.optionLabel, { color: theme.text }]}>
                      {formatDisplayUnitName(unit)}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={uiAccent}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showOnlineImagePicker} animationType="fade" transparent>
        <Pressable
          style={styles.dateBackdrop}
          onPress={() => setShowOnlineImagePicker(false)}
        >
          <Pressable
            style={[
              styles.dateSheet,
              {
                backgroundColor: theme.bgElevated,
                maxHeight: windowHeight * 0.88,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.dateSheetHeader}>
              <Text style={[styles.dateSheetTitle, { color: theme.text }]}>
                Unsplash Images
              </Text>
              <Pressable
                onPress={() => setShowOnlineImagePicker(false)}
                hitSlop={12}
              >
                <Text
                  style={{
                    color: uiAccent,
                    fontSize: typography.body,
                    fontWeight: "600",
                  }}
                >
                  Done
                </Text>
              </Pressable>
            </View>
            <View style={styles.onlineSearchRow}>
              <TextInput
                value={onlineQuery}
                onChangeText={setOnlineQuery}
                onSubmitEditing={runOnlineSearch}
                placeholder=""
                accessibilityLabel="Search Unsplash photos"
                placeholderTextColor={theme.textTertiary}
                returnKeyType="search"
                style={[
                  styles.onlineSearchInput,
                  {
                    color: theme.text,
                    borderColor: theme.separator,
                    backgroundColor: theme.bg,
                  },
                ]}
              />
              <Pressable
                onPress={runOnlineSearch}
                style={[styles.onlineSearchBtn, { backgroundColor: uiAccent }]}
              >
                <Ionicons name="search-outline" size={20} color="#fff" />
              </Pressable>
            </View>
            <Pressable
              style={styles.unsplashLink}
              onPress={() => void Linking.openURL("https://unsplash.com")}
            >
              <Text style={[styles.unsplashLinkText, { color: uiAccent }]}>
                Photos provided by Unsplash
              </Text>
            </Pressable>
            <ScrollView
              style={{ maxHeight: windowHeight * 0.56 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.onlineGrid}>
                {loadingOnlineResults ? (
                  <ActivityIndicator
                    color={uiAccent}
                    style={styles.onlineLoading}
                  />
                ) : onlineResults.length === 0 ? (
                  <Text style={{ color: theme.textSecondary }}>
                    No photos found. Try another search.
                  </Text>
                ) : (
                  onlineResults.map((photo) => (
                    <Pressable
                      key={photo.id}
                      style={[
                        styles.onlineImageTile,
                        {
                          borderColor: theme.separator,
                          backgroundColor: theme.bg,
                        },
                      ]}
                      onPress={() => void pickOnlineImage(photo)}
                    >
                      <Image
                        source={{ uri: photo.urls.small }}
                        style={styles.onlineImage}
                        contentFit="cover"
                        transition={120}
                      />
                    </Pressable>
                  ))
                )}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function formatDisplayUnitName(unit: DisplayUnit): string {
  if (unit === "auto") return "Automatic";
  return unit[0].toUpperCase() + unit.slice(1);
}

function getBackgroundAccent(value: BackgroundValue, fallback: string): string {
  if (value.kind === "solid") return value.color;
  if (value.kind === "gradient")
    return value.colors[value.colors.length - 1] ?? fallback;
  return fallback;
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    paddingTop: space.md,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "600",
    marginBottom: space.sm,
    marginTop: space.lg,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: typography.body,
  },
  segment: {
    flexDirection: "row",
    gap: space.sm,
  },
  backgroundSegment: {
    marginBottom: space.md,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  segText: {
    fontWeight: "600",
    fontSize: typography.body,
  },
  rowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    marginBottom: space.sm,
  },
  rowBtnText: {
    fontSize: typography.body,
    fontWeight: "500",
  },
  rowBtnCopy: {
    flex: 1,
    gap: 2,
  },
  rowBtnHint: {
    fontSize: typography.caption,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryPickerScroll: {
    marginBottom: space.sm,
  },
  addCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: 14,
    paddingHorizontal: space.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.sm,
  },
  addCategoryLabel: {
    fontSize: typography.body,
    fontWeight: "600",
  },
  categoryManageRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.sm,
    overflow: "hidden",
  },
  categoryManageMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingLeft: space.md,
    paddingVertical: 12,
    minHeight: 52,
  },
  categoryDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryIconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    justifyContent: "center",
  },
  categoryIconSpacer: {
    width: 42,
  },
  colorPicker: {
    gap: space.sm,
  },
  colorPickerPreview: {
    alignSelf: "stretch",
  },
  colorPickerPanel: {
    borderRadius: radii.md,
    minHeight: 180,
  },
  colorPickerSlider: {
    borderRadius: 999,
    minHeight: 28,
  },
  imageActionsRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  imageActionTile: {
    flex: 1,
    minHeight: 92,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imageActionTitle: {
    fontSize: typography.body,
    fontWeight: "600",
  },
  attachedImagePreviewWrap: {
    marginTop: space.sm,
    marginBottom: space.sm,
  },
  attachedImageFrame: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  attachedImage: {
    ...StyleSheet.absoluteFillObject,
  },
  attachedImageRemoveBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.52)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "flex-end",
  },
  dateSheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xl,
  },
  dateSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.sm,
  },
  dateSheetTitle: {
    fontSize: typography.title2,
    fontWeight: "700",
  },
  datePickerScroll: {
    flexGrow: 0,
  },
  datePickerScrollContent: {
    flexGrow: 1,
    alignItems: "stretch",
  },
  datePickerMinBox: {
    width: "100%",
    alignSelf: "stretch",
  },
  onlineSearchRow: {
    flexDirection: "row",
    gap: space.sm,
    marginBottom: space.sm,
  },
  onlineSearchInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: typography.body,
  },
  onlineSearchBtn: {
    width: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  unsplashLink: {
    marginBottom: space.sm,
  },
  unsplashLinkText: {
    fontSize: typography.caption,
    fontWeight: "600",
  },
  onlineGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    paddingBottom: space.md,
    justifyContent: "center",
  },
  onlineLoading: {
    width: "100%",
    paddingVertical: space.lg,
  },
  onlineImageTile: {
    width: "48%",
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  onlineImage: {
    width: "100%",
    aspectRatio: 0.65,
  },
  optionList: {
    gap: space.sm,
  },
  optionRow: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionLabel: {
    fontSize: typography.body,
    fontWeight: "600",
  },
});
