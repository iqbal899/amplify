import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import { colors, spacing, radius, fonts } from "@/constants/theme";
import { login, register } from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

export default function LoginScreen() {
  const router = useRouter();

  const authLogin = useAuthStore((s) => s.login);

  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    try {
      setLoading(true);

      if (isLogin) {
        const response = await login({
          email,
          password,
        });

        authLogin(response.creator, response.token);

        router.replace("/(tabs)/discover");
      } else {
        const response = await register({
          name,
          email,
          phone,
          password,
        });

        authLogin(response.creator, response.token);

        router.replace("/(tabs)/discover");
      }
    } catch (err: any) {
      console.error("[auth] request failed", {
        url: err?.config?.baseURL,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });

      const data = err?.response?.data;
      // Zod failures come back as { errors: [...] }, not { message }
      const validationMessage = Array.isArray(data?.errors)
        ? data.errors.map((e: any) => e.message).join("\n")
        : undefined;
      // No response at all means the request never reached the server
      const networkMessage = err?.response
        ? undefined
        : `Can't reach the server at ${err?.config?.baseURL ?? "the API"}.`;

      Alert.alert(
        "Error",
        data?.message ??
          validationMessage ??
          networkMessage ??
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logo}>A</Text>
        </View>

        <Text style={styles.title}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </Text>

        <Text style={styles.subtitle}>
          {isLogin
            ? "Login to continue earning with Amplify."
            : "Create your creator account."}
        </Text>

        {!isLogin && (
          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#777"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        )}

        {!isLogin && (
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#777"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
          />
        )}

        <TextInput
          placeholder="Email"
          placeholderTextColor="#777"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#777"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          disabled={loading}
          onPress={handleSubmit}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? "Login" : "Create Account"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchText}>
            {isLogin
              ? "Don't have an account? Create Account"
              : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },

  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.blue,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  logo: {
    color: "#fff",
    fontSize: 52,
    fontFamily: fonts.display,
  },

  title: {
    fontSize: 34,
    fontFamily: fonts.display,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  subtitle: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 15,
    fontFamily: fonts.body,
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },

  input: {
    height: 58,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.body,
  },

  button: {
    height: 58,
    borderRadius: radius.full,
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: fonts.displayMedium,
  },

  switchText: {
    marginTop: spacing.xl,
    color: colors.blue,
    textAlign: "center",
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
});