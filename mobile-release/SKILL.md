---
name: mobile-release
description: Build and release Android (Play Store) and iOS (App Store) apps with fastlane. Covers signing, versioning, track promotion, common gotchas, and full Fastfile templates. Use when deploying mobile apps, fixing signing issues, bumping versions, or setting up fastlane from scratch.
---

# Mobile Release — Android & iOS via Fastlane

## Pre-Flight Checklist (Both Platforms)

Before any release:
1. **Pull latest** — `git pull origin main`
2. **Bump version** — Play Store / App Store reject duplicate version codes
3. **Check signing** — wrong key = rejected upload, wasted build time
4. **Run in tmux** — builds take 1-5 min, don't block the agent

## Android

### Signing — The #1 Gotcha

**Two key systems exist:**
- **Upload key** — what you sign the AAB with locally. Play Store validates this.
- **App signing key** — Google re-signs with this. You never touch it.

**Verify your keystore before uploading:**
```bash
keytool -list -v -keystore path/to/keystore.jks -storepass PASSWORD 2>&1 | grep "SHA1:"
```
Compare SHA1 with what Play Console shows under **Setup → App signing → Upload key certificate**.

**Common trap:** Multiple keystores in the project. `build.gradle.kts` may reference one, Fastfile another. They must match what Play Store expects.

**Injected signing (Fastfile overrides build.gradle):**
```ruby
gradle(
  task: "bundleRelease",
  project_dir: ".",
  properties: {
    "android.injected.signing.store.file" => File.expand_path("../path/to/upload.keystore"),
    "android.injected.signing.store.password" => "PASSWORD",
    "android.injected.signing.key.alias" => "aliasName",
    "android.injected.signing.key.password" => "PASSWORD",
  }
)
```

### Version Bumping

Play Store rejects duplicate `versionCode`. Always bump before deploy.

**Where versions live** (check both):
- `app/build.gradle.kts` — often has `versionCode` / `versionName` directly
- `buildSrc/` or version catalogs — some projects centralize in `AppConfig.kt` or `libs.versions.toml`

```kotlin
// app/build.gradle.kts
versionCode = 14       // integer, must increment
versionName = "1.0.5"  // human-readable, shown in Play Store
```

### Target SDK Requirements

Google Play enforces minimum `targetSdk`. As of 2025+: **targetSdk ≥ 35** required for new uploads.

Check: `buildSrc/src/main/kotlin/AppConfig.kt` or `app/build.gradle.kts` → `targetSdk` and `compileSdk`.

### Fastfile Template — Android

```ruby
default_platform(:android)

platform :android do

  desc "Build debug APK"
  lane :debug do
    gradle(task: "assembleDebug", project_dir: ".")
    UI.success "Debug APK: #{lane_context[SharedValues::GRADLE_APK_OUTPUT_PATH]}"
  end

  desc "Build release AAB (signed for Play Store)"
  lane :bundle do
    gradle(
      task: "bundleRelease",
      project_dir: ".",
      properties: {
        "android.injected.signing.store.file" => File.expand_path("../path/to/upload.keystore"),
        "android.injected.signing.store.password" => ENV["KEYSTORE_PASSWORD"] || `pass project/keystore-password`.strip,
        "android.injected.signing.key.alias" => "myAlias",
        "android.injected.signing.key.password" => ENV["KEYSTORE_PASSWORD"] || `pass project/keystore-password`.strip,
      }
    )
    UI.success "Release AAB: #{lane_context[SharedValues::GRADLE_AAB_OUTPUT_PATH]}"
  end

  desc "Build + install on connected device"
  lane :device do
    gradle(task: "assembleDebug", project_dir: ".")
    adb(command: "install -r #{lane_context[SharedValues::GRADLE_APK_OUTPUT_PATH]}")
    adb(command: "shell am start -n com.example.app/.MainActivity")
    UI.success "Installed and launched"
  end

  desc "Deploy to Play Store internal track"
  lane :deploy do
    bundle
    upload_to_play_store(
      track: "internal",
      aab: lane_context[SharedValues::GRADLE_AAB_OUTPUT_PATH],
      skip_upload_apk: true,        # IMPORTANT: stale APKs in build/ cause "both apk and aab" error
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
    UI.success "Deployed to Play Store internal track"
  end

  desc "Promote internal → production"
  lane :promote do
    upload_to_play_store(
      track: "internal",
      track_promote_to: "production",
      skip_upload_apk: true,
      skip_upload_aab: true,
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true,
      skip_upload_changelogs: true
    )
    UI.success "Promoted to production"
  end

end
```

### Play Store Track Flow

```
internal → closed testing → open testing → production
```

Promote between tracks (no re-upload needed):
```bash
# CLI one-liner (when no promote lane exists)
fastlane run upload_to_play_store \
  track:internal track_promote_to:production \
  skip_upload_apk:true skip_upload_aab:true \
  skip_upload_metadata:true skip_upload_images:true \
  skip_upload_screenshots:true skip_upload_changelogs:true \
  json_key:path/to/service-account.json
```

### Service Account Setup

`upload_to_play_store` needs a Google Play service account JSON:
1. Google Cloud Console → create service account
2. Play Console → **Setup → API access** → link the service account, grant **Release manager** role
3. Download JSON key → `keystores/play-store-service-account.json`
4. Reference in Fastfile: `json_key: "keystores/play-store-service-account.json"`

If stored at default Fastfile location (`fastlane/`), fastlane auto-detects. Otherwise pass explicitly.

### Android Gotchas

| Gotcha | Fix |
|--------|-----|
| "Cannot provide both apk and aab" | Add `skip_upload_apk: true` to `upload_to_play_store`, or delete stale APKs from `app/build/outputs/apk/` |
| "Version code N already used" | Bump `versionCode` in build.gradle |
| "Target SDK too low" | Bump `targetSdk` and `compileSdk` to ≥ 35 |
| "Signed with wrong key" | Verify keystore SHA1 matches Play Console upload key |
| Build takes forever | Run in tmux. Gradle caches — second build is faster if no SDK change |
| Deprecation warnings on SDK bump | Warnings are fine. Errors need fixing (rare with minor SDK bumps) |

---

## iOS

### Signing — Certificates & Profiles

**Three things must align:**
1. **Signing certificate** (`.p12`) — developer or distribution
2. **Provisioning profile** (`.mobileprovision`) — links cert + app ID + devices
3. **Xcode project signing settings** — automatic or manual

**fastlane match** (recommended) — stores certs/profiles in git or cloud:
```bash
fastlane match init           # one-time setup
fastlane match appstore       # fetch/create App Store profiles
fastlane match development    # fetch/create dev profiles
```

### Fastfile Template — iOS

```ruby
default_platform(:ios)

platform :ios do

  desc "Build for testing"
  lane :build do
    build_app(
      workspace: "App.xcworkspace",
      scheme: "App",
      configuration: "Debug",
      export_method: "development"
    )
  end

  desc "Deploy to TestFlight"
  lane :beta do
    increment_build_number
    match(type: "appstore")
    build_app(
      workspace: "App.xcworkspace",
      scheme: "App",
      export_method: "app-store"
    )
    upload_to_testflight(
      skip_waiting_for_build_processing: true
    )
    UI.success "Uploaded to TestFlight"
  end

  desc "Deploy to App Store"
  lane :release do
    increment_build_number
    match(type: "appstore")
    build_app(
      workspace: "App.xcworkspace",
      scheme: "App",
      export_method: "app-store"
    )
    upload_to_app_store(
      force: true,
      skip_metadata: true,
      skip_screenshots: true
    )
    UI.success "Submitted to App Store review"
  end

end
```

### App Store Connect API Key (no 2FA prompts)

```ruby
# Appfile or lane
app_store_connect_api_key(
  key_id: "ABC123",
  issuer_id: "def-456-ghi",
  key_filepath: "fastlane/AuthKey_ABC123.p8"
)
```

Generate at: **App Store Connect → Users and Access → Integrations → Keys**

### iOS Gotchas

| Gotcha | Fix |
|--------|-----|
| 2FA prompts block CI | Use App Store Connect API key (`.p8`) |
| "No signing certificate" | `fastlane match nuke distribution` then `fastlane match appstore` |
| "Profile doesn't include device" | Add UDID in Apple Developer portal, regenerate profile |
| Build number already used | `increment_build_number` before upload |
| "Missing compliance info" | Add `ITSAppUsesNonExemptEncryption: NO` to Info.plist (if no custom crypto) |
| Archive fails with SPM | Clean derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData` |

---

## Agent Workflow

When asked to "deploy android" / "release iOS" / "push to store":

```bash
# 1. Pull latest
git pull origin main

# 2. Check current version
grep -E "versionCode|versionName" android/app/build.gradle.kts

# 3. Bump version (ask user or auto-increment)

# 4. Build + upload in tmux
tmux has-session -t pi 2>/dev/null || tmux new-session -d -s pi
tmux new-window -d -t pi -n mobile-deploy 'cd project/android && fastlane deploy 2>&1 | tee /tmp/mobile-deploy.log'

# 5. Monitor
sleep 60 && tmux capture-pane -t pi:mobile-deploy -p -S -40

# 6. Promote if requested
fastlane promote   # or fastlane run upload_to_play_store track:internal track_promote_to:production ...

# 7. Cleanup
tmux kill-window -t pi:mobile-deploy
```

## Debugging Failed Uploads

```bash
# Android: check what Play Store has
fastlane run upload_to_play_store validate_only:true track:production \
  skip_upload_apk:true skip_upload_aab:true json_key:path/to/key.json

# iOS: check TestFlight processing
fastlane run check_app_store_connect_status

# Both: verbose mode
fastlane deploy --verbose
```
