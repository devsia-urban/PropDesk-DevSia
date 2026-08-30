# 🚀 PropDesk Database Upgrade Guide (v1.0)

This guide helps you upgrade an existing PropDesk database (older versions) to the latest "Complete v1" state. 

## 📋 Prerequisites
1. **Access to Supabase Dashboard**: You must have access to the SQL Editor.
2. **Current Branch Code**: Ensure you have pushed the latest code from the `feat/client-pagination` or `main` branch to your Vercel/Hosting.
3. **🚨 FULL BACKUP**: Before running any SQL, go to **Supabase Dashboard > Database > Backups** and ensure you have a recent snapshot.

---

## 🛠️ Step 1: Run the Master Patch
The **[ULTIMATE_DATABASE_PATCH.sql](file:///Users/divitjain/Desktop/propertymanager/ULTIMATE_DATABASE_PATCH.sql)** script is designed to be "idempotent"—it will add missing columns and tables without touching your existing data.

1.  Open your **Supabase Project**.
2.  Go to the **SQL Editor** tab.
3.  Click **New Query**.
4.  Copy the entire content of `ULTIMATE_DATABASE_PATCH.sql` and paste it into the editor.
5.  Click **Run**.
6.  *Verify*: You should see "Success" and no errors related to existing columns.

---

## 🌐 Step 2: Vercel Environment Variables
The new "Public Property Viewing" (Slugs) requires a site URL to generate sharing links correctly.

In your **Vercel Settings > Environment Variables**, ensure this is set:
-   `NEXT_PUBLIC_APP_URL`: Set this to your production domain (e.g., `https://your-app.vercel.app`).

---

## 📁 Step 3: Storage Buckets
The latest version uses stylized agency logos and property images.

1.  Go to **Storage** in Supabase.
2.  Ensure you have a bucket named `property-images`. 
3.  Check that it is set to **Public**.
4.  If you want to support agency branding, create a bucket named `agency-logos` (Public).

---

## ✅ Step 4: Verification
To ensure everything worked:
1.  **Dashboard**: Check if the "Hot Matches" and "Activity Feed" now load without errors.
2.  **Public Sharing**: Open any property, click **Share > Copy Link**, and paste it into a new tab. It should load a beautiful branded landing page.
3.  **Search**: Try searching for a property by its Title—the new `pg_trgm` indexes should make it near-instant.

---

**You're all set! Your database is now catching up to the latest features.** 🥂
