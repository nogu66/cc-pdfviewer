# Resources — App Icons

Place your app icon files here before running `bun run dist`.

| File | Platform | Size |
|------|----------|------|
| `icon.icns` | macOS | 512×512 (inside ICNS container) |
| `icon.ico` | Windows | multi-size (256×256 recommended) |
| `icon.png` | Linux | 512×512 px, PNG |

## How to generate

Starting from a single high-resolution PNG (1024×1024 recommended):

### macOS — `icon.icns`

```bash
# Using electron-icon-builder (cross-platform)
npx electron-icon-builder --input=icon-source.png --output=resources/
```

### Windows — `icon.ico`

Use [GIMP](https://www.gimp.org/) → Export As → `.ico`, or any online ICO converter.

### Linux — `icon.png`

Just copy your source PNG and rename it `icon.png`.

---

If no icons are provided, Electron's default icon will be used.
