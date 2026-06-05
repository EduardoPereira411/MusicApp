import React, { useEffect, useRef } from "react";
import { Text, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ToastType } from "@/Context/ToastContext";

interface ToastNotificationProps {
  visible: boolean;
  message: string;
  type: ToastType;
  toastId: number;
  onDismiss: () => void;
}

export function ToastNotification({
  visible,
  message,
  type,
  toastId,
  onDismiss,
}: ToastNotificationProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!visible) return;

    // @ts-ignore - Safe internal lookup for active native driver value
    const currentY = slideAnim.__getValue();

    if (currentY <= -100) {
      Animated.spring(slideAnim, {
        toValue: insets.top + 12,
        useNativeDriver: true,
        bounciness: 6,
        speed: 12,
      }).start();
    } else {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: insets.top - 10,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: insets.top + 12,
          useNativeDriver: true,
          bounciness: 8,
          speed: 14,
        }),
      ]).start();
    }

    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 220,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, 3000);

    return () => clearTimeout(timer);
  }, [visible, toastId, insets.top, slideAnim, onDismiss]);

  const isError = type === "error";

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        isError ? styles.errorContainer : styles.successContainer,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Ionicons
        name={isError ? "alert-circle" : "checkmark-circle"}
        size={18}
        color={isError ? "#FF5252" : "#1DB954"}
        style={styles.icon}
      />
      <Text style={styles.toastText} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  successContainer: {
    backgroundColor: "#282828",
    borderWidth: 1,
    borderColor: "#1DB954-33", // Subtle green accent borders
  },
  errorContainer: {
    backgroundColor: "#2D1919",
    borderWidth: 1,
    borderColor: "#FF5252-55",
  },
  icon: {
    marginRight: 10,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
});
