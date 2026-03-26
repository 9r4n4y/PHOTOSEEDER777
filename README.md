# PHOTOSEEDER777: Neural Image Vault

**PHOTOSEEDER777** is a 100% offline, privacy-first tool designed to convert high-resolution images into compact, shareable "Neural Vault Keys." It uses advanced client-side encryption and compression to ensure that your data never leaves your device.

Whether you are storing sensitive documents or sharing private photos, PHOTOSEEDER777 provides a secure, serverless way to manage your visual data.

---

## 🛠 How It Works

PHOTOSEEDER777 operates entirely within your browser's memory. It does not use any cloud storage or external APIs for its core functions.

### 1. Encoding (Image to Key)
- **Lossless Processing**: Your image is drawn onto a high-precision HTML5 Canvas.
- **Neural Compression**: The pixel data is converted into a lossless WebP or PNG format.
- **AES-256 Encryption**: If "Encrypted Mode" is enabled, the data is encrypted using a password-derived key (AES-256).
- **LZ-Compression**: The encrypted string is further compressed using LZ-String to reduce its size.
- **Neural Vault Key**: The final output is a standalone string containing all the image data. It works 100% offline and can be shared via any text-based medium (WhatsApp, Email, etc.).
- **Local Vault Optimization**: For your own convenience, you can save large keys to a local database (IndexedDB) to generate a short **VAULT:** code for use on the same device.

### 2. Decoding (Key to Image)
- **Reconstruction**: The app takes a Vault Key or Local Code and reverses the process.
- **Algorithm-Based Recovery**: The original image is reconstructed using our offline algorithm with 1:1 pixel accuracy—no database or internet connection required.
- **Decryption**: If the key is encrypted, it prompts for the password and decrypts the payload in real-time.

### 3. 100% Offline & Private
- **Zero Backend**: There is no database on a server. Your data stays in the Vault Key or your local device.
- **No Tracking**: No analytics, no cookies, and no data collection.

---

## 📦 Installation Guide

Follow these steps to set up PHOTOSEEDER777 on a fresh device.

### 💻 1. Windows Installation
1.  **Download Node.js**: Go to [nodejs.org](https://nodejs.org/) and download the **LTS** version. Run the installer and click "Next" until finished.
2.  **Download Git**: Go to [git-scm.com](https://git-scm.com/) and download the Windows installer. Install with default settings.
3.  **Open Terminal**: Press `Win + R`, type `cmd`, and press Enter.
4.  **Clone the Project**:
    ```bash
    git clone https://github.com/9r4n4y/PHOTOSEEDER777.git
    cd PHOTOSEEDER777
    ```
5.  **Install Packages**:
    ```bash
    npm install
    ```
6.  **Run the App**:
    ```bash
    npm run dev
    ```
7.  **Open Browser**: Go to `http://localhost:3000`.

---

### 🐧 2. Linux Installation (Ubuntu/Debian)
1.  **Update System**:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
2.  **Install Node.js & Git**:
    ```bash
    sudo apt install -y nodejs npm git
    ```
3.  **Clone the Project**:
    ```bash
    git clone https://github.com/9r4n4y/PHOTOSEEDER777.git
    cd PHOTOSEEDER777
    ```
4.  **Install Packages**:
    ```bash
    npm install
    ```
5.  **Run the App**:
    ```bash
    npm run dev
    ```
6.  **Open Browser**: Go to `http://localhost:3000`.

---

### 📱 3. Android Installation (Termux)
This guide assumes you have a fresh install of **Termux** from F-Droid.

1.  **Update Packages**:
    ```bash
    pkg update && pkg upgrade -y
    ```
2.  **Install Node.js & Git**:
    ```bash
    pkg install nodejs git -y
    ```
3.  **Clone the Project**:
    ```bash
    git clone https://github.com/9r4n4y/PHOTOSEEDER777.git
    cd PHOTOSEEDER777
    ```
4.  **Install Packages**:
    ```bash
    npm install
    ```
5.  **Run the App**:
    ```bash
    npm run dev
    ```
6.  **Access the App**: Open your mobile browser (Chrome/Kiwi) and go to:
    `http://localhost:3000`

---

## 🖥 The "Backend" Architecture

**PHOTOSEEDER777** is a **Serverless SPA** (Single Page Application). 

- **Frontend**: Built with React 19, TypeScript, and Tailwind CSS.
- **Logic Engine**: Custom hooks handle the heavy lifting of image processing and cryptography.
- **Local Storage**: 
  - **IndexedDB**: Used as the "Neural Vault" for high-resolution images.
  - **LocalStorage**: Used for small metadata and backward compatibility.
- **Serving**: In a production environment, it is served as static files via Vite or a simple Express wrapper.

The "Backend" is essentially your own browser's storage. This means your data is as secure as your device.

---

## ❤️ Credits & Inspiration

This project was made possible thanks to the following resources:

- **Album of Babel (ImageVable)**: We took significant inspiration from the [Album of Babel](https://github.com/etoitau/Album-of-Babel) project. Their innovative approach to image-to-text encoding provided the foundation for our Neural Vault Key system.
- **Google AI Studio**: Special thanks to Google AI Studio for providing the tools and environment to build and refine this application.

---

## 📜 License
This project is open-source. Feel free to use, modify, and share.

**Stay Private. Stay Secure. Stay Offline.**
