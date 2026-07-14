import React from "react";
import { APP } from "@/constants/app";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Bug,
  BookOpen,
  CircleHelp,
  Info,
} from "lucide-react-native";

import { spacing, radius, fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const supportItems = [
  {
    title: "Frequently Asked Questions",
    subtitle: "Common questions about campaigns.",
    icon: CircleHelp,
    color: "#3B82F6",
    action: "faq",
  },
  {
    title: "Contact Support",
    subtitle: APP.SUPPORT_EMAIL,
    icon: Mail,
    color: "#10B981",
    action: "email",
  },
  {
    title: "Report a Problem",
    subtitle: "Found a bug? Tell us.",
    icon: Bug,
    color: "#EF4444",
    action: "bug",
  },
  {
    title: "Terms & Rules",
    subtitle: "Campaign guidelines and policies.",
    icon: BookOpen,
    color: "#F59E0B",
    action: "terms",
  },
  {
    title: "App Information",
    subtitle: `Developed by ${APP.COMPANY} • Version ${APP.VERSION}`,
    icon: Info,
    color: "#8B5CF6",
    action: "info",
  },
];

export default function HelpSupport() {
  const router = useRouter();
  const colors = useTheme();

  const openEmail = async (url: string) => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        "No Email App",
        "No email application was found on your device."
      );
    }
  };

  const handlePress = (action: string) => {
    switch (action) {
      case "email":
        openEmail(`mailto:${APP.SUPPORT_EMAIL}`);
        break;

      case "faq":
        router.push("/modals/faq");
        break;

      case "bug":
        openEmail(
          `mailto:${APP.SUPPORT_EMAIL}?subject=` +
            encodeURIComponent("DoorBeen Bug Report") +
            "&body=" +
            encodeURIComponent(`Describe the issue below:

--------------------------------

Device:
Android / iOS

App Version:
${APP.VERSION}

Steps to reproduce:

1.

2.

3.

Expected Result:

Actual Result:

--------------------------------`)
        );
        break;

      case "terms":
        router.push("/modals/terms-and-rules");
        break;

      case "info":
        Alert.alert(
          APP.NAME,
          `Developed by ${APP.COMPANY}

Version: ${APP.VERSION}
Build: ${APP.BUILD}

© 2026 DoorBeen
For creators. By creators.
All Rights Reserved.`
        );
        break;

      default:
        Alert.alert(
          "Coming Soon",
          "This feature will be available soon."
        );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <View
          style={{
            padding: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={26} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={{
              marginLeft: spacing.md,
              fontSize: 24,
              fontFamily: fonts.display,
              color: colors.text,
            }}
          >
            Help & Support
          </Text>
        </View>

        <Text
          style={{
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.xl,
            fontFamily: fonts.body,
            color: colors.textMuted,
            lineHeight: 22,
          }}
        >
          Need assistance? We're here to help you with campaigns, submissions
          and your creator account.
        </Text>

        {supportItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handlePress(item.action)}
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                marginHorizontal: spacing.lg,
                marginBottom: spacing.md,
                padding: spacing.lg,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${item.color}15`,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: spacing.md,
                }}
              >
                <Icon size={22} color={item.color} />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.displayMedium,
                    fontSize: 16,
                    color: colors.text,
                  }}
                >
                  {item.title}
                </Text>

                <Text
                  style={{
                    marginTop: 5,
                    fontFamily: fonts.body,
                    color: colors.textMuted,
                  }}
                >
                  {item.subtitle}
                </Text>
              </View>

              <ChevronRight
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          );
        })}

        <View
          style={{
            backgroundColor: colors.surface,
            marginHorizontal: spacing.lg,
            marginTop: spacing.md,
            marginBottom: spacing.xl,
            padding: spacing.xl,
            borderRadius: radius.xl,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.greenGlow,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <Mail size={24} color={colors.green} />
          </View>

          <Text
            style={{
              fontFamily: fonts.displayMedium,
              fontSize: 17,
              color: colors.text,
            }}
          >
            Need immediate assistance?
          </Text>

          <Text
            style={{
              marginTop: spacing.sm,
              textAlign: "center",
              color: colors.textMuted,
              lineHeight: 22,
              fontFamily: fonts.body,
            }}
          >
            Reach us anytime at
          </Text>

          <TouchableOpacity
            onPress={() =>
              openEmail(`mailto:${APP.SUPPORT_EMAIL}`)
            }
            style={{ marginTop: spacing.sm }}
          >
            <Text
              style={{
                color: colors.green,
                fontFamily: fonts.displayMedium,
                fontSize: 15,
              }}
            >
              {APP.SUPPORT_EMAIL}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}