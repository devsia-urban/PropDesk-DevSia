const fs = require('fs');

let ctxPath = './lib/context/auth-context.tsx';
let ctxContent = fs.readFileSync(ctxPath, 'utf8');

ctxContent = ctxContent.replace(
    /      if \(\!profileData\) \{\n\s*console\.error\('\[AUTH_DEBUG\] Profile Fetch Error after retries:', fetchError\?\.message\)\n\s*setIsLoading\(false\)\n\s*return\n\s*\}/g,
    `      if (!profileData) {
        console.error('[AUTH_DEBUG] Profile Fetch Error after retries: no profile found in DB for user', session.user.id);
        // Force sign out if the database trigger failed to create the profile, so they don't get stuck in a blank state
        await supabase.auth.signOut();
        setProfile(null);
        setIsLoading(false);
        return;
      }`
);

fs.writeFileSync(ctxPath, ctxContent);
console.log('Fixed auth context missing profile handler');
