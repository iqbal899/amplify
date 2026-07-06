import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Extrapolate,
  interpolate,
} from 'react-native-reanimated';
import { colors, spacing, radius, fonts } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

const AnimatedView = Animated.createAnimatedComponent(View);

interface FormData {
  displayName: string;
  phoneNumber: string;
  upiId: string;
}

interface VerificationState {
  upi: boolean;
  phone: boolean;
  otp: string;
  showOtpInput: boolean;
}

export default function KYCScreen() {
  const router = useRouter();
  const { setKYC } = useAuthStore();

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    phoneNumber: '',
    upiId: '',
  });

  const [verification, setVerification] = useState<VerificationState>({
    upi: false,
    phone: false,
    otp: '',
    showOtpInput: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upiLoading, setUpiLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);

  const handleVerifyUPI = async () => {
    if (!formData.upiId.trim()) return;
    setUpiLoading(true);
    setTimeout(() => {
      setVerification((prev) => ({ ...prev, upi: true }));
      setUpiLoading(false);
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (formData.phoneNumber.length !== 10) return;
    setPhoneLoading(true);
    setTimeout(() => {
      setVerification((prev) => ({ ...prev, showOtpInput: true }));
      setPhoneLoading(false);
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    if (verification.otp.length !== 4) return;
    setOtpLoading(true);
    setTimeout(() => {
      setVerification((prev) => ({
        ...prev,
        phone: true,
        showOtpInput: false,
        otp: '',
      }));
      setOtpLoading(false);
    }, 1000);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.displayName.trim()) {
      alert('Please enter your display name');
      return;
    }
    if (formData.phoneNumber.length !== 10) {
      alert('Phone number must be 10 digits');
      return;
    }
    if (!formData.upiId.trim()) {
      alert('Please enter your UPI ID');
      return;
    }

    setIsSubmitting(true);

    // Animate screen transition
    scaleValue.value = withTiming(0.9, { duration: 300 });
    opacityValue.value = withTiming(0, { duration: 300 });

    setTimeout(() => {
      setKYC({
        name: formData.displayName,
        phone: formData.phoneNumber,
        upiId: formData.upiId,
        avatarUrl: '',
        isKYCComplete: true,
        isVerified: true,
      });
      router.replace('/(tabs)/discover');
    }, 300);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedView style={animatedStyle}>
          {/* Header */}
          <Text style={[styles.title, { fontFamily: fonts.display }]}>
            Complete your profile
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            We need a few details to get you started
          </Text>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Display Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { fontFamily: fonts.displayMedium }]}>
                Display Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Your name"
                placeholderTextColor={colors.textSub}
                value={formData.displayName}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, displayName: text }))
                }
              />
            </View>

            {/* Phone Number with OTP */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { fontFamily: fonts.displayMedium }]}>
                Phone Number
              </Text>
              <View style={styles.fieldWithButton}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputWithButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="10-digit number"
                  placeholderTextColor={colors.textSub}
                  keyboardType="number-pad"
                  maxLength={10}
                  value={formData.phoneNumber}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, phoneNumber: text }))
                  }
                  editable={!verification.phone}
                />
                {!verification.phone ? (
                  <TouchableOpacity
                    style={[
                      styles.inlineButton,
                      {
                        backgroundColor: colors.blue,
                        opacity:
                          formData.phoneNumber.length === 10 && !phoneLoading
                            ? 1
                            : 0.5,
                      },
                    ]}
                    onPress={handleSendOTP}
                    disabled={formData.phoneNumber.length !== 10 || phoneLoading}
                  >
                    {phoneLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text
                        style={[
                          styles.inlineButtonText,
                          { fontFamily: fonts.displayMedium },
                        ]}
                      >
                        Send OTP
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedIcon}>✓</Text>
                  </View>
                )}
              </View>

              {/* OTP Input */}
              {verification.showOtpInput && !verification.phone && (
                <View style={styles.otpSection}>
                  <View style={styles.otpFieldWithButton}>
                    <TextInput
                      style={[
                        styles.otpInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      placeholder="4-digit OTP"
                      placeholderTextColor={colors.textSub}
                      keyboardType="number-pad"
                      maxLength={4}
                      value={verification.otp}
                      onChangeText={(text) =>
                        setVerification((prev) => ({ ...prev, otp: text }))
                      }
                    />
                    <TouchableOpacity
                      style={[
                        styles.inlineButton,
                        {
                          backgroundColor: colors.blue,
                          opacity:
                            verification.otp.length === 4 && !otpLoading
                              ? 1
                              : 0.5,
                        },
                      ]}
                      onPress={handleVerifyOTP}
                      disabled={verification.otp.length !== 4 || otpLoading}
                    >
                      {otpLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text
                          style={[
                            styles.inlineButtonText,
                            { fontFamily: fonts.displayMedium },
                          ]}
                        >
                          Verify
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* UPI ID with Verify */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { fontFamily: fonts.displayMedium }]}>
                UPI ID
              </Text>
              <View style={styles.fieldWithButton}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputWithButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="yourname@upi"
                  placeholderTextColor={colors.textSub}
                  value={formData.upiId}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, upiId: text }))
                  }
                  editable={!verification.upi}
                />
                {!verification.upi ? (
                  <TouchableOpacity
                    style={[
                      styles.inlineButton,
                      {
                        backgroundColor: colors.blue,
                        opacity:
                          formData.upiId.trim().length > 0 && !upiLoading
                            ? 1
                            : 0.5,
                      },
                    ]}
                    onPress={handleVerifyUPI}
                    disabled={
                      formData.upiId.trim().length === 0 || upiLoading
                    }
                  >
                    {upiLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text
                        style={[
                          styles.inlineButtonText,
                          { fontFamily: fonts.displayMedium },
                        ]}
                      >
                        Verify
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedIcon}>✓</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.blue,
                opacity: isSubmitting ? 0.7 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.submitText, { fontFamily: fonts.displayMedium }]}>
                Complete Setup
              </Text>
            )}
          </TouchableOpacity>
        </AnimatedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.xl,
  },
  formContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  fieldWithButton: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  inputWithButton: {
    flex: 1,
  },
  inlineButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  inlineButtonText: {
    fontSize: 12,
    color: '#fff',
  },
  otpSection: {
    marginTop: spacing.sm,
  },
  otpFieldWithButton: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  verifiedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  submitButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  submitText: {
    fontSize: 16,
    color: '#fff',
  },
});
