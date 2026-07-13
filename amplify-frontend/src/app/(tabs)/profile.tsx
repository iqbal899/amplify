import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  History,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react-native";

import { spacing, radius, fonts } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useCampaignStore } from "@/store/campaignStore";
import { useThemeStore } from "@/store/themeStore";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";

import ConfirmLogoutModal from "@/components/modals/ConfirmLogoutModal";
import {
  getProfile,
  updateProfile,
} from "@/services/profile";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useTheme();

  const { themeMode, setThemeMode } =
    useThemeStore();

  const [logoutVisible, setLogoutVisible] =
    React.useState(false);

  const creator = useAuthStore(
    (state) => state.creator
  );

  const logout = useAuthStore(
    (state) => state.logout
  );

  const setCreator = useAuthStore(
    (state) => state.setCreator
  );

  const { enrolled } = useCampaignStore();

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfile();

        setCreator(profile);
      } catch (err) {
        console.log("PROFILE ERROR");
        console.log(err);
      }
    }

    loadProfile();
  }, []);

  const handleLogout = () => {
    setLogoutVisible(true);
  };

  const confirmLogout = () => {
    setLogoutVisible(false);

    logout();

    router.replace("/");
  };


  const handleSettingPress = (
    setting: string
  ) => {
    switch (setting) {
      case "history":
        router.push("/modals/campaign-history");
        break;

      // case "terms":
      //   router.push("/modals/terms-and-rules");
      //   break;

      // case "help":
      //   router.push("/modals/help-support");
      //   break;

      // case "notifications":
      //   router.push("/modals/notifications");
      //   break;

      case "logout":
        handleLogout();
        break;

      default:
        Alert.alert(
          "Coming Soon",
          `${setting} feature coming soon`
        );
    }
  };
  const handleEditProfile = () => {
    router.push("/modals/edit-profile");
  };

  const handleYouTubeConnect = () => {
    Alert.alert(
      "Coming Soon",
      "YouTube integration coming soon."
    );
  };

  const displayName = creator?.name ?? "Creator";

  const instagramUsername = creator?.instagramUsername;

  const instagramConnected = !!instagramUsername;

  const settingsItems = [
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "history",
      label: "Campaign History",
      icon: History,
    },
    {
      id: "terms",
      label: "Terms & Rules",
      icon: FileText,
    },
    {
      id: "help",
      label: "Help & Support",
      icon: HelpCircle,
    },
    {
      id: "logout",
      label: "Log out",
      icon: LogOut,
      isRed: true,
    },
  ];

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.bg,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: spacing.xl,
        }}
      >
        {/* Header */}

        <View
          style={{
            padding: spacing.lg,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.blue,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: 30,
                color: colors.bg,
                fontFamily: fonts.display,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 24,
              color: colors.text,
              fontFamily: fonts.display,
            }}
          >
            {displayName}
          </Text>

          <Text
            style={{
              color: colors.textMuted,
              marginTop: spacing.xs,
            }}
          >
            {creator?.email}
          </Text>

          {instagramConnected && (
            <Text
              style={{
                color: colors.blue,
                marginTop: spacing.xs,
              }}
            >
              @{instagramUsername}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleEditProfile}
            style={{
              marginTop: spacing.md,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: colors.surface,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: "600",
              }}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Creator Info */}

        <View
          style={{
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                marginBottom: spacing.sm,
              }}
            >
              Phone
            </Text>

            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                marginBottom: spacing.lg,
              }}
            >
              {creator?.phone ?? "Not Added"}
            </Text>

            <Text
              style={{
                color: colors.textMuted,
                marginBottom: spacing.sm,
              }}
            >
              Instagram Username
            </Text>

            <Text
              style={{
                color: colors.text,
                fontSize: 16,
              }}
            >
              {creator?.instagramUsername
                ? `@${creator.instagramUsername}`
                : "Not Connected"}
            </Text>
          </View>
        </View>

        {/* Statistics */}

        <View
          style={{
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              paddingVertical: spacing.lg,
            }}
          >
            <View
              style={{
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  color: colors.blue,
                  fontWeight: "700",
                }}
              >
                {enrolled.length}
              </Text>

              <Text
                style={{
                  color: colors.textMuted,
                  marginTop: spacing.xs,
                }}
              >
                Campaigns
              </Text>
            </View>

            <View
              style={{
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  color: colors.blue,
                  fontWeight: "700",
                }}
              >
                {creator?.createdAt
                  ? new Date(
                    creator.createdAt
                  ).getFullYear()
                  : "--"}
              </Text>

              <Text
                style={{
                  color: colors.textMuted,
                  marginTop: spacing.xs,
                }}
              >
                Joined
              </Text>
            </View>
          </View>
        </View>

        {/* Connected Accounts */}

        <View
          style={{
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
              marginBottom: spacing.md,
            }}
          >
            Connected Accounts
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
              }}
            >
              Instagram
            </Text>

            <Text
              style={{
                color: instagramConnected
                  ? colors.green
                  : colors.textMuted,
              }}
            >
              {instagramConnected
                ? `@${instagramUsername}`
                : "Not Connected"}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
              }}
            >
              YouTube
            </Text>

            <TouchableOpacity
              onPress={handleYouTubeConnect}
            >
              <Text
                style={{
                  color: colors.blue,
                  fontWeight: "600",
                }}
              >
                Connect
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Settings */}

        <View
          style={{
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.xl,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: fonts.displayMedium,
              color: colors.text,
              marginBottom: spacing.md,
            }}
          >
            Settings
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              overflow: "hidden",
            }}
          >
            {settingsItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() =>
                    handleSettingPress(item.id)
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: spacing.lg,
                    borderBottomWidth:
                      index === settingsItems.length - 1
                        ? 0
                        : 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Icon
                      size={20}
                      color={
                        item.isRed
                          ? "#EF4444"
                          : colors.text
                      }
                    />

                    <Text
                      style={{
                        marginLeft: spacing.md,
                        fontSize: 16,
                        color: item.isRed
                          ? "#EF4444"
                          : colors.text,
                        fontFamily: fonts.body,
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>

                  {!item.isRed && (
                    <ChevronRight
                      size={18}
                      color={colors.textMuted}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <ConfirmLogoutModal
          visible={logoutVisible}
          onCancel={() => setLogoutVisible(false)}
          onConfirm={confirmLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}