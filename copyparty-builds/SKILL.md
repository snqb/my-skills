---
name: copyparty-builds
description: Upload build artifacts (APKs, IPAs, binaries, archives) to a self-hosted copyparty instance for direct download links. Use when sharing builds with testers, installing on devices, or distributing artifacts without app stores.
---

# Copyparty Builds

Upload artifacts to a copyparty file server and get direct download links.

## Config

The copyparty URL is stored in `pass`:

```bash
pass show infra/copyparty-url  # → http://147.45.158.152:3210
```

## Upload

**Always use PUT with the filename in the URL.** Multipart (`-F`) loses the filename and saves as `.bin`.

```bash
COPYPARTY=$(pass infra/copyparty-url)

# Upload a file (PUT with binary body — filename in URL path)
curl -s -X PUT --data-binary @path/to/artifact.apk "${COPYPARTY}/artifact.apk"

# Upload with versioned name
VERSION="v$(date +%Y%m%d-%H%M)"
curl -s -X PUT --data-binary @app.apk "${COPYPARTY}/myapp-${VERSION}.apk"
```

The response includes the download URL on the last line.

> **⚠️ Do NOT use multipart form upload** (`curl -F "file=@..."`) — copyparty saves it with a generated name like `put-1772666493.bin`, not the original filename.

## QR Code for Mobile

After uploading, **always show a QR code** — fastest way to get a file onto a phone/e-ink device:

```bash
# Requires: brew install qrencode (already installed)
DOWNLOAD_URL="${COPYPARTY}/artifact.apk"
qrencode -t UTF8 "$DOWNLOAD_URL"
```

For PNG output (e.g. to embed in a report):
```bash
qrencode -o /tmp/qr.png -s 8 "$DOWNLOAD_URL"
```

## Download

Direct link — works in any browser, phone, curl:

```
${COPYPARTY}/myapp-v20260304-1903.apk
```

Open on Android phone → downloads → tap to install.

## List Files

```bash
# JSON listing
curl -s "${COPYPARTY}/?ls" | jq '.files[] | "\(.href)  \(.sz / 1048576 | floor)MB"'

# Just filenames
curl -s "${COPYPARTY}/?ls" | jq -r '.files[].href'
```

## Delete

```bash
curl -s -X DELETE "${COPYPARTY}/old-artifact.apk"
```

## Subfolder Organization

```bash
# Upload to a project subfolder
curl -s -X PUT --data-binary @app.apk "${COPYPARTY}/krugosvet/app-v1.apk"
curl -s -X PUT --data-binary @site.tar.gz "${COPYPARTY}/mysite/site-v2.tar.gz"

# List subfolder
curl -s "${COPYPARTY}/krugosvet/?ls" | jq -r '.files[].href'
```

## Fastlane Integration

Add a `share` lane to any Android project's `Fastfile`:

```ruby
desc "Build release + upload to copyparty"
lane :share do
  release  # or your build lane
  apk = lane_context[SharedValues::GRADLE_APK_OUTPUT_PATH]
  version = "v#{Time.now.strftime('%Y%m%d-%H%M')}"
  app_name = "myapp"  # change per project
  filename = "#{app_name}-#{version}.apk"
  server = `pass infra/copyparty-url`.strip
  sh("curl -s -X PUT --data-binary @#{apk} #{server}/#{filename}")
  UI.success "Download: #{server}/#{filename}"
end
```

## Server Management

Copyparty runs on `147.45.158.152` (Timeweb, root). Check / start:

```bash
# Check if running
curl -s http://147.45.158.152:3210/ -o /dev/null -w "%{http_code}" --connect-timeout 5

# Start if needed (SSH in, then:)
sshpass -p "$(pass show krugosvet/timeweb/ssh-password)" ssh root@147.45.158.152 \
  'mkdir -p /srv/copyparty && nohup copyparty -p 3210 -v /srv/copyparty::rw > /tmp/copyparty.log 2>&1 &'
```

## Use Cases

- **Android APK** → build, upload, show QR, scan from phone to install
- **Any binary** → share with anyone via direct URL
- **CI artifacts** → upload from build scripts, link in notifications
- **Large files** → no Telegram 50MB limit, no expiry
