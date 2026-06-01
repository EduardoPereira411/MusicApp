# Welcome to your MUsic app 👋

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Creating apk

1. Login to eas:

```
eas login
```

2. Build the apk

```
eas build --platform android --profile preview
```

## Creating APK locally (no EAS queue)

1. Setup project for android build

```
npx expo prebuild --clean
```

2. go into android folder and execute assembleRelease

```
cd android
./gradlew assembleRelease
```

3. The generated file is in:

```
android/app/build/outputs/apk/release/app-release.apk
```
