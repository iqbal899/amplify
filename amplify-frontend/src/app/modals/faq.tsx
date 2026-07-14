import React, { useState } from "react";
import { FAQS } from "@/constants/faq";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CircleHelp,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";

import {
  spacing,
  radius,
  fonts,
} from "@/constants/theme";


export default function FAQScreen() {
  const colors = useTheme();

  const router = useRouter();

  const [expanded, setExpanded] =
    useState<number | null>(0);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.bg,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
          >
            <ChevronLeft
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.title,
              { color: colors.text },
            ]}
          >
            Frequently Asked Questions
          </Text>
        </View>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Everything you need to know
          about campaigns, submissions,
          and rewards.
        </Text>

        {FAQS.map((item, index) => {
          const isOpen =
            expanded === index;

          return (
            <View
              key={index}
              style={[
                styles.card,
                {
                  backgroundColor:
                    colors.surface,
                },
              ]}
            >
              <TouchableOpacity
                style={
                  styles.questionRow
                }
                onPress={() =>
                  setExpanded(
                    isOpen
                      ? null
                      : index
                  )
                }
              >
                <View
                  style={
                    styles.left
                  }
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor:
                          colors.greenGlow,
                      },
                    ]}
                  >
                    <CircleHelp
                      size={18}
                      color={
                        colors.green
                      }
                    />
                  </View>

                  <Text
                    style={[
                      styles.question,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    {item.question}
                  </Text>
                </View>

                {isOpen ? (
                  <ChevronUp
                    size={20}
                    color={
                      colors.green
                    }
                  />
                ) : (
                  <ChevronDown
                    size={20}
                    color={
                      colors.textMuted
                    }
                  />
                )}
              </TouchableOpacity>

              {isOpen && (
                <View
                  style={
                    styles.answerContainer
                  }
                >
                  <Text
                    style={[
                      styles.answer,
                      {
                        color:
                          colors.textMuted,
                      },
                    ]}
                  >
                    {item.answer}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        <View
          style={{
            height: spacing.xxl,
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
  },

  title: {
    marginLeft: spacing.md,
    fontSize: 24,
    fontFamily: fonts.display,
  },

  subtitle: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    fontFamily: fonts.body,
    lineHeight: 22,
    fontSize: 14,
  },

  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    overflow: "hidden",
  },

  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.md,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },

  question: {
    flex: 1,
    fontFamily: fonts.displayMedium,
    fontSize: 15,
    lineHeight: 22,
  },

  answerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingLeft: 72,
  },

  answer: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 24,
  },
});