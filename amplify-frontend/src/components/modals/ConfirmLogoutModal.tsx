import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";

import { LogOut } from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, fonts } from "@/constants/theme";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmLogoutModal({
  visible,
  onCancel,
  onConfirm,
}: Props) {
  const colors = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.lg,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            width: "100%",
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            padding: spacing.xl,
          }}
        >
          {/* Icon */}

          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "#FEE2E2",
              alignSelf: "center",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: spacing.lg,
            }}
          >
            <LogOut
              size={34}
              color="#EF4444"
            />
          </View>

          {/* Title */}

          <Text
            style={{
              textAlign: "center",
              fontSize: 22,
              fontFamily: fonts.display,
              color: colors.text,
            }}
          >
            Log Out
          </Text>

          {/* Subtitle */}

          <Text
            style={{
              textAlign: "center",
              color: colors.textMuted,
              marginTop: spacing.sm,
              lineHeight: 22,
            }}
          >
            Are you sure you want to log out of your
            Amplify account?
          </Text>

          {/* Buttons */}

          <View
            style={{
              flexDirection: "row",
              marginTop: spacing.xl,
            }}
          >
            {/* Cancel */}

            <TouchableOpacity
              onPress={onCancel}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: radius.full,
                backgroundColor: colors.bg,
                alignItems: "center",
                marginRight: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "600",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            {/* Logout */}

            <TouchableOpacity
              onPress={onConfirm}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: radius.full,
                backgroundColor: "#EF4444",
                alignItems: "center",
                marginLeft: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "700",
                }}
              >
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}