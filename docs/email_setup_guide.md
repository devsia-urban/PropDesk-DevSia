# Supabase Email Configuration Guide

To make your agency onboarding professional and reliable, follow these steps to set up the premium email templates provided.

## 1. Access Supabase Settings
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project: **Nexoraedge/property-manager**.
3. In the left sidebar, click on **Authentication** -> **Email Templates**.

## 2. Configure Site URL & Redirects
Before updating templates, ensure your site URL is correct:
1. Go to **Authentication** -> **URL Configuration**.
2. **Site URL**: Ensure this is set to `http://localhost:3000` (for local development) or your production domain.
3. **Redirect URLs**: Add `http://localhost:3000/**` to allowed redirect URLs.

## 3. Apply Templates
For each template below, copy the HTML code from the local file and paste it into the **Body** field of the corresponding template in Supabase.

### A. Confirm Signup (Confirm your email)
- **Local File**: [confirm_signup.html](file:///Users/divitjain/Desktop/propertymanager/templates/emails/confirm_signup.html)
- **Supabase Template**: "Confirm signup"
- **Subject**: `Confirm your PropDesk account`

### B. Invite User (Invite user)
- **Local File**: [invite_agency.html](file:///Users/divitjain/Desktop/propertymanager/templates/emails/invite_agency.html)
- **Supabase Template**: "Invite user"
- **Subject**: `You're Invited to Join PropDesk`

### C. Reset Password (Reset password)
- **Local File**: [reset_password.html](file:///Users/divitjain/Desktop/propertymanager/templates/emails/reset_password.html)
- **Supabase Template**: "Reset password"
- **Subject**: `Reset your PropDesk password`

### D. Magic Link (Optional)
If you use Magic Links, you can reuse the `confirm_signup.html` styling.

## 4. Troubleshooting: "Could not exchange code"
If you still see the "Could not exchange code" error after updating:
- **Code Consumed**: This usually happens if your browser or email scanner hits the link first. I have patched the `auth/callback` route to handle this gracefully.
- **Trial & Error**: Try opening the email link in an **Incognito Window** to ensure no previous cookies or pre-fetches interfere.

---
*Powered by NexoraEdge • Professional Real Estate Solutions*
