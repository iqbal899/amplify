import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

import { spacing, radius, fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/authStore";
import { updateProfile } from "@/services/profile";

export default function EditProfileScreen() {
  const router = useRouter();
  const colors = useTheme();

  const creator = useAuthStore((state) => state.creator);
  const setCreator = useAuthStore((state) => state.setCreator);

  const [name, setName] = useState(creator?.name ?? "");
  const [phone, setPhone] = useState(creator?.phone ?? "");
  const [instagramUsername, setInstagramUsername] = useState(
    creator?.instagramUsername ?? ""
  );
  const [profileImage, setProfileImage] = useState(
    creator?.profileImage ?? ""
  );

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Name is required.");
      return;
    }

    try {
      setLoading(true);

      const updatedCreator = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        instagramUsername: instagramUsername.trim(),
        profileImage: profileImage.trim(),
      });

      setCreator(updatedCreator);

      Alert.alert("Success", "Profile updated successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Update Failed",
        err?.response?.data?.message ??
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.bg,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: spacing.xl,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginRight: spacing.md,
            }}
          >
            <ArrowLeft
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 24,
              color: colors.text,
              fontFamily: fonts.display,
            }}
          >
            Edit Profile
          </Text>
        </View>

        {/* Name */}

        <Text
          style={{
            color: colors.textMuted,
            marginBottom: spacing.xs,
          }}
        >
          Name
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
          style={{
            backgroundColor: colors.surface,
            color: colors.text,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }}
        />

        {/* Phone */}

        <Text
          style={{
            color: colors.textMuted,
            marginBottom: spacing.xs,
          }}
        >
          Phone
        </Text>

        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Phone number"
          placeholderTextColor={colors.textMuted}
          style={{
            backgroundColor: colors.surface,
            color: colors.text,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }}
        />

        {/* Instagram */}

        <Text
          style={{
            color: colors.textMuted,
            marginBottom: spacing.xs,
          }}
        >
          Instagram Username
        </Text>

        <TextInput
          value={instagramUsername}
          onChangeText={setInstagramUsername}
          placeholder="instagram_username"
          autoCapitalize="none"
          placeholderTextColor={colors.textMuted}
          style={{
            backgroundColor: colors.surface,
            color: colors.text,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }}
        />

        {/* Profile Image */}

        <Text
          style={{
            color: colors.textMuted,
            marginBottom: spacing.xs,
          }}
        >
          Profile Image URL (optional)
        </Text>

        <TextInput
          value={profileImage}
          onChangeText={setProfileImage}
          placeholder="https://..."
          autoCapitalize="none"
          placeholderTextColor={colors.textMuted}
          style={{
            backgroundColor: colors.surface,
            color: colors.text,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.xl,
          }}
        />

        {/* Save Button */}

        <TouchableOpacity
          disabled={loading}
          onPress={handleSave}
          style={{
            backgroundColor: colors.blue,
            borderRadius: radius.full,
            paddingVertical: spacing.md,
            alignItems: "center",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontFamily: fonts.displayMedium,
              }}
            >
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}