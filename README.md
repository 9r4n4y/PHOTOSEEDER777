# PHOTOSEEDER777: The Neural Image Vault

**PHOTOSEEDER777** is a powerful, privacy-first tool that allows you to convert any image into a secure, shareable text code. Designed for complete offline use, it ensures your visual data remains entirely under your control.

---

## 🌟 Why Use This App?

In an era of constant data breaches and cloud surveillance, **PHOTOSEEDER777** offers a truly private alternative for sharing images.

- **No Cloud, No Servers**: Most apps store your images on their servers. This app doesn't. It converts your image into a "Vault Code" that exists only as text.
- **True Privacy**: You can share the generated code on one platform (like WhatsApp) and the password on another (like Signal or in person). 
- **Man-in-the-Middle Protection**: Even if someone intercepts your message, they cannot see your image without the password.
- **100% Offline**: The app works entirely in your browser. You can even turn off your internet after loading the page, and it will still work perfectly.

> **Security Tip:** Never share your encrypted code and your password on the same messaging platform.

---

## 🚀 Installation Guide

This guide is for everyone, even if you have never installed a technical app before. Follow these steps in order.

### 💻 For Windows Users
1. **Install Node.js**: Go to [nodejs.org](https://nodejs.org/) and download the "LTS" version. Run the installer and click "Next" until finished.
2. **Install Git**: Go to [git-scm.com](https://git-scm.com/) and download the Windows installer. Run it with default settings.
3. **Open Command Prompt**: Press the `Windows Key`, type `cmd`, and press `Enter`.
4. **Download the App**: Type this command and press Enter:
   ```bash
   git clone https://github.com/9r4n4y/PHOTOSEEDER777.git
   ```
5. **Enter the Folder**:
   ```bash
   cd PHOTOSEEDER777
   ```
6. **Install Dependencies**:
   ```bash
   npm install
   ```
7. **Start the App**:
   ```bash
   npm run dev
   ```
8. **Open the App**: The terminal will show a link (usually `http://localhost:3000`). Copy and paste it into your browser.

---

### 🍎 For macOS Users
1. **Open Terminal**: Press `Cmd + Space`, type `Terminal`, and press `Enter`.
2. **Install Homebrew** (if you don't have it): Paste this and press Enter:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. **Install Node.js & Git**:
   ```bash
   brew install node git
   ```
4. **Download & Run**:
   ```bash
   git clone https://github.com/9r4n4y/PHOTOSEEDER777.git
   cd PHOTOSEEDER777
   npm install
   npm run dev
   ```

---

### 🐧 For Linux Users
1. **Open Terminal**.
2. **Install Node.js & Git**:
   ```bash
   sudo apt update
   sudo apt install nodejs npm git -y
   ```
3. **Download & Run**:
   ```bash
   git clone https://github.com/9r4n4y/PHOTOSEEDER777.git
   cd PHOTOSEEDER777
   npm install
   npm run dev
   ```

---

### 📱 For Android (Termux)
1. **Install Termux**: Download it from F-Droid (recommended) or the Play Store.
2. **Update System**: Type these and press Enter:
   ```bash
   pkg update && pkg upgrade -y
   ```
3. **Install Tools**:
   ```bash
   pkg install nodejs git -y
   ```
4. **Download the App**:
   ```bash
   git clone https://github.com/9r4n4y/PHOTOSEEDER777.git
   cd PHOTOSEEDER777
   ```
5. **Install & Run**:
   ```bash
   npm install
   npm run dev
   ```
6. **Access**: Open your mobile browser and go to `http://localhost:3000`.

---

## 🧠 How It Works

1. **Mapping**: The app reads your image pixel-by-pixel.
2. **Encryption**: It uses the **AES-256 algorithm** to lock that data using your password.
3. **Compression**: It shrinks the data so the code is as short as possible.
4. **Sharing**: You get a "Vault Code" which you can copy, save as a `.txt` file, or show as a QR code.
5. **Decryption**: To see the image again, you need the code AND the password. The app reverses the process entirely offline.

---

## ✨ Key Features

- **Encrypted Mode**: The standard way to use the app. Your image is locked with a password.
- **Normal Mode**: For quick use without a password. The raw code is hidden behind a "Show" button to keep your screen clean.
- **Multiple Sharing Options**:
  - **Copy Code**: Copy the text directly.
  - **QR Generation**: Create a QR code for others to scan.
  - **Download .txt**: Save the code as a text file for long-term storage.
- **Flexible Decryption**:
  - **Paste**: Just paste the code and type the password.
  - **QR Scan**: Use your camera to scan a code from another screen.
  - **File Upload**: Upload a `.txt` file you previously saved.

---

## 📸 Image Quality & Size Note

- **Lossless Quality**: The image you get back is exactly the same quality as the one you put in. No pixels are lost.
- **Code Length**: Because the reconstruction is lossless, large images (like 4K photos) will produce very long codes.
- **Recommendation**: For the shortest codes, use smaller images or lower resolutions. For very large images, we recommend using the **Download .txt** option.

---

## 🛡 Security Notes

- **Password Strength**: Use a password that is hard to guess. Since everything is offline, there is no "Forgot Password" button. If you lose the password, the image is gone forever.
- **Offline Guarantee**: This app does not have a database. It does not "save" your images. Once you close the tab, the data is gone unless you saved the Vault Code.
- **Safe Sharing**: Always share your password through a different channel than your code.

---

**Developed with ❤️ by 9r4n4y**
[GitHub Profile](https://github.com/9r4n4y)
