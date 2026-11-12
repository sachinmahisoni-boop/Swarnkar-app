# Swarnkar Jewellery ERP (Shreem Mahal Jewellers, Bhopal)

A full-stack Indian Jewellery Shop ERP built with React 19, TypeScript, Vite, Tailwind CSS v4, Firebase (Auth & Firestore), and Progressive Web App (PWA) support.

---

## Features
- **POS Billing & GST Invoices**: HSN 7113, 7117, 3% GST calculation, itemized making charges, wastage/touch calculation, old gold exchange credit, and sequential invoice serials (`SMJ/2026-27/0001`).
- **Wholesale Purchase Management**: Inward stock entry with fine gold wastage/touch percentage calculations, vendor ledgers, and Estimate/Non-GST inward purchases.
- **Stock Inventory & Barcode Tags**: Multi-category jewellery tagging with HUID, weight breakdown (Gross/Stone/Net), and low-stock alerts.
- **Girvi Pawn Ledger & Karigar Cards**: Pawn loans interest calculator and goldsmith job card tracking.
- **Multi-Firm Management**: Role-Based Access Control (RBAC) with owner/staff permissions and isolated firm data.
- **Multi-Format Printing & Offline PWA**: A4, A5, and Thermal (80mm/58mm) receipt printing with multi-tab offline Firestore caching.

---

## Deploy on Vercel + Firebase

Follow these steps to deploy this application on Vercel connected to your Firebase project:

### 1. Environment Variables Configuration
In your **Vercel Project Settings** > **Environment Variables**, add the following public client environment variables:

| Variable Name | Description | Example / Note |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `your-project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Google Cloud Project ID | `gen-lang-client-0664621053` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket URL | `your-project-id.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `806529454988` |
| `VITE_FIREBASE_APP_ID` | Firebase Web Application ID | `1:806529454988:web:xxxx` |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Custom Firestore Database ID | `ai-studio-shreemmehaljewel-43dc6672-3b92-433d-a335-2a735e27a34b` (or leave empty for `(default)`) |

> **Important**: **Redeploy after changing environment variables** (Vite environment variables are bundled during the build step and apply only to new builds).

---

### 2. Firebase Console Checklist
Before testing deployment on your Vercel URL, complete this checklist in the [Firebase Console](https://console.firebase.google.com/):

1. **Authorized Domains**:
   - Go to **Authentication** > **Settings** > **Authorized domains**.
   - Add your Vercel deployment domain (e.g. `your-app.vercel.app` and custom domains).
2. **Enable Sign-in Methods**:
   - Go to **Authentication** > **Sign-in method**.
   - Ensure **Google** sign-in (and/or Email/Password if required) is enabled.
3. **Firestore Database ID Match**:
   - In **Firestore Database**, confirm that the active database ID matches `VITE_FIREBASE_FIRESTORE_DATABASE_ID` exactly.
4. **Publish Firestore Security Rules**:
   - Publish the `firestore.rules` file from this repository to your target Firestore database under **Firestore Database** > **Rules**.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables example and configure locally
cp .env.example .env.local

# Start development server
npm run dev

# Run unit tests
npm test

# Run Firebase Firestore Emulator security rules & transaction integration tests
# (Requires Java JRE 17+ and firebase-tools installed)
npm run test:emulator

# Lint & build
npm run lint
npm run build
```
