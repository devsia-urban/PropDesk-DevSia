const fs = require('fs');

let apiPath = './app/accept-invite/page.tsx';
let apiContent = fs.readFileSync(apiPath, 'utf8');

// Replace the redirect logic in accept-invite
apiContent = apiContent.replace(
    /        window\.location\.hash = ''\n\s*setStep\("done"\)\n\s*setTimeout\(\(\) => \{\n\s*router\.push\("\/dashboard"\)\n\s*router\.refresh\(\)\n\s*\}, 2000\)/,
    `        window.location.hash = ''
        setStep("done")
        
        // AUTO-FIX: Guarantee profile exists before redirecting to dashboard
        try {
          await fetch('/api/team/fix-profile', { method: 'POST' })
        } catch (e) {
          console.error('Auto-fix failed', e)
        }

        setTimeout(() => {
          router.push("/dashboard")
          router.refresh()
        }, 1000)`
);

// Also fix the setInterval loop so it can ALSO hit fix-profile just in case they landed directly on syncing=true
apiContent = apiContent.replace(
    /      if \(window\.location\.hash\.includes\('syncing=true'\)\) \{\n\s*setStep\('syncing'\)\n\s*const retryInterval = setInterval\(async \(\) => \{\n\s*const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\)/,
    `      if (window.location.hash.includes('syncing=true')) {
        setStep('syncing')
        
        // Fire a fix immediately before polling starts
        fetch('/api/team/fix-profile', { method: 'POST' }).catch(console.error)
        
        const retryInterval = setInterval(async () => {
          const { data: { user } } = await supabase.auth.getUser()`
);

fs.writeFileSync(apiPath, apiContent);
console.log('Fixed accept-invite.tsx');
