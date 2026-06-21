const IS_TEMP = process.env.APP_ENV === "temp";

export default {
  expo: {
    name: IS_TEMP ? "MusicAppTemp" : "MusicApp",
    slug: IS_TEMP ? "MusicAppTemp" : "MusicApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: IS_TEMP ? "musicapptemp" : "musicapp",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/images/icon.png",
      bundleIdentifier: IS_TEMP
        ? "com.anonymous.MusicAppTemp"
        : "com.anonymous.MusicApp",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        monochromeImage: "./assets/images/adaptive-icon-monochrome.png",
        backgroundColor: "#100030",
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_AUDIO_PLAYBACK",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      ],
      package: IS_TEMP
        ? "com.anonymous.MusicAppTemp"
        : "com.anonymous.MusicApp",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#100030",
          image: "./assets/images/splash-icon.png",
          resizeMode: "contain",
          android: {
            image: "./assets/images/splash-icon.png",
            imageWidth: 200,
          },
        },
      ],
      "expo-secure-store",
      [
        "expo-audio",
        {
          enableBackgroundPlayback: true,
        },
      ],
      "expo-image",
      [
        "expo-media-control",
        {
          notificationIcon: "./assets/images/mini_icon_monochrome.png",
        },
      ],
      "expo-asset",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "5bef9d8f-2573-40a2-ad8e-66dfc9038a76",
      },
    },
  },
};
