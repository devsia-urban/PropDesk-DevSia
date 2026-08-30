const fs = require('fs');

let apiPath = './app/api/team/fix-profile/route.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

apiContent = apiContent.replace(
    /full_name: user\.user_metadata\?\.full_name \|\| 'Team Member',/g,
    `email: user.email,
      full_name: user.user_metadata?.full_name || 'Team Member',`
);

fs.writeFileSync(apiPath, apiContent);
console.log('Fixed fix-profile API missing email');
