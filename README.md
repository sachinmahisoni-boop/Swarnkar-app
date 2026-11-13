# Swarnkar Jewellery ERP (Shreem Mahal Jewellers, Bhopal)

A full-stack Indian Jewellery Shop ERP built with React 19, TypeScript, Vite, Tailwind CSS v4, Firebase (Auth & Firestore), and Progressive Web App (PWA) support.

---

## Features
- **POS Billing & GST Invoices**: HSN 7113, 7117, 3% GST calculation, itemized making charges, wastage/touch calculation, old gold exchange credit, and sequential invoice serials (`SMJ/2026-27/0001`).
- **Wholesale Purchase Management**: Inward stock entry with fine gold wastage/touch percentage calculations, vendor ledgers, and Estimate/Non-GST inward purchases.
- **Stock Inventory & Barcode Tags**: Multi-category jewellery tagging with HUID, weight breakdown (Gross/Stone/Net), and low-stock alerts.
- **Girvi Pawn Ledger & Karigar Cards**: Pawn loans interest calculator and goldsmith job card tracking.
- **Secure Multi-User Platform & Master Control**:
  - New users register via Google Sign-In or Email/Password and enter a strict `pending` approval gate with no firm data access until approved.
  - Platform Master Admins (verified server-side via `platform_admins/{uid}` in Firestore) manage user approvals (`trial` / `active` / `suspended`), per-user invoice quota (`trialInvoiceLimit`) & expiry (`trialEndsAt`), 16 granular module/action permissions, firm inspection, and append-only `audit_logs`.
  - Trial limits are atomically enforced per firm owner via `users/{ownerUid}/usage/invoices` inside the same Firestore transaction (`createInvoiceAtomic`) using deterministic `${series}_${count}` invoice IDs verified with `getAfter()` in `firestore.rules`. When `trialEndsAt` expires or `trialInvoiceLimit` is reached, new writes are blocked across operational collections while reads, backup/export, and invoice cancellation remain available.
  - Firm Owners with `staffManagement` permission can invite cashier/manager staff by email; staff permissions are strictly capped at the owner's permissions.
- **Multi-Format Printing & Offline PWA**: A4, A5, and 80mm Thermal receipt printing (with saved Shop Default layout in Settings) and real-time pulsing Firestore sync indicators.

---

## Deploy on Vercel + Firebase

### 1. Environment Variables Configuration
In your **Vercel Project Settings** > **Environment Variables**, add ONLY the public Firebase configuration variables (never store admin passwords or secrets in any `VITE_*` variable):

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
   - Enable **Google** sign-in (and **Email/Password** if desired).
3. **Firestore Database ID Match**:
   - In **Firestore Database**, confirm that the active database ID matches `VITE_FIREBASE_FIRESTORE_DATABASE_ID` exactly.
4. **Publish Firestore Security Rules**:
   - Copy the contents of `firestore.rules` from this repository and publish them under **Firestore Database** > **Rules** for your target database ID.

---

### 3. Create the First Master Admin
Master Admin access is verified **solely** by server-side existence of a document in `platform_admins/{uid}` (`allow write: if false;` prevents any client from elevating itself).

1. Sign in once to your deployed app with your Master Google account (it will create your initial `users/{uid}` doc in `pending` state and display your Firebase **UID** on the approval screen, or copy your UID from **Firebase Console > Authentication > Users**).
2. Open **Firebase Console > Firestore Database** (make sure your custom database ID is selected).
3. Click **Start collection** and enter Collection ID: `platform_admins`.
4. Set Document ID to your exact Firebase Auth **UID** (for example `abc123XYZ...`).
5. Add fields such as:
   - `uid` (string): `<your-firebase-uid>`
   - `createdAt` (string or timestamp): `<current date>`
6. Click **Save**, then refresh the app (or click **Refresh Approval Status**). The **Master Control** dashboard tab will now unlock automatically.
7. Inside **Master Control > Rules & Support**, set your **Admin WhatsApp / Phone** and default **Trial Invoice Limit / Days** — these are stored in `system_config/public` so pending or trial-expired users immediately see your Contact Admin links.

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
# (Requires Java JRE 17+ available on PATH)
npm run test:emulator

# Lint & build
npm run lint
npm run build
```

### Testing Security Rules with Firestore Emulator
`npm run test:emulator` executes `src/lib/firestore.emulator.test.ts` against a local Firebase Firestore Emulator (`127.0.0.1:8088`).

- **Prerequisite**: **Java JRE 17+** (for example, OpenJDK 17 or 21) must be installed and available on your system `PATH` (`java -version`). The Firebase Firestore Emulator runs on the JVM and will fail to start if `java` is missing.
- **No Cloud Project Required**: `npm run test:emulator` uses the local demo project ID (`demo-swarnkar-test`) and tests `firestore.rules` offline.

