const fs = require('fs');

let ctxPath = './lib/context/auth-context.tsx';
let ctxContent = fs.readFileSync(ctxPath, 'utf8');

ctxContent = ctxContent.replace(
    /      if \(\!profileData\) \{\n\s*console\.error\('\[AUTH_DEBUG\] Profile Fetch Error after retries: no profile found in DB for user', userId\);\n\s*\/\/ Force sign out if the database trigger failed to create the profile, so they don't get stuck in a blank state\n\s*await supabase\.auth\.signOut\(\);\n\s*setProfile\(null\);\n\s*setIsLoading\(false\);\n\s*return;\n\s*\}/,
    `      if (!profileData) {
        console.error('[AUTH_DEBUG] Profile Fetch Error after retries: no profile found in DB for user', userId);
        
        // Auto-fix: try to have the backend force-create the profile using Admin privileges!
        try {
          const res = await fetch('/api/team/fix-profile', { method: 'POST' });
          if (res.ok) {
            const { data: retryData } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (retryData) {
              profileData = retryData;
              console.log('[AUTH_DEBUG] Profile auto-fixed successfully!');
            }
          }
        } catch (e) {
          console.error('[AUTH_DEBUG] Auto-fix failed', e);
        }

        if (!profileData) {
          // Force sign out if the database trigger AND auto-fix failed
          await supabase.auth.signOut();
          setProfile(null);
          setIsLoading(false);
          return;
        }
      }`
);

fs.writeFileSync(ctxPath, ctxContent);
console.log('Added auto-fix to auth context');
