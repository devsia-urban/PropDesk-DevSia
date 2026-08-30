const fs = require('fs');

let apiPath = './app/api/team/fix-profile/route.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

apiContent = apiContent.replace(
    /await supabaseAdmin\.from\('profiles'\)\.insert\(\{(.*?)\}\)/s,
    `const { error: insertError } = await supabaseAdmin.from('profiles').insert({$1});\n    if (insertError) throw insertError;`
);

fs.writeFileSync(apiPath, apiContent);
console.log('Fixed fix-profile API');
