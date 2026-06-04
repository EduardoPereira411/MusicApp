import { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface ToastNotificationProps {
  visible: boolean;
  message: string;
  toastId: number;
  onDismiss: () => void;
}

export function ToastNotification({
  visible,
  message,
  toastId,
  onDismiss,
}: ToastNotificationProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!visible) return;

    // Check the current position of the toast
    // @ts-ignore - __getValue() is internal but completely safe for reading native driver values
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
    }, 2000);

    return () => clearTimeout(timer);
  }, [visible, toastId, insets.top, slideAnim, onDismiss]);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Ionicons
        name="checkmark-circle"
        size={18}
        color="#1DB954"
        style={styles.icon}
      />
      <Text style={styles.toastText} numberOfLines={1}>
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
    backgroundColor: "#282828",
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
