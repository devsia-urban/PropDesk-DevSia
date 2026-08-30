const fs = require('fs');
const path = require('path');

const csvPath = '/Users/divitjain/Downloads/FINAL_CLEAN_DATA_final.csv';

if (!fs.existsSync(csvPath)) {
  console.log("File not found at", csvPath);
  process.exit(1);
}

const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n');
const headers = lines[0].split(',');

// Find indices for numeric columns
const numericCols = ['price', 'bedrooms', 'bathrooms', 'area_sqft'];
const numIndices = numericCols.map(col => headers.indexOf(col)).filter(i => i !== -1);

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  // A simple split by comma works here because our data doesn't have commas inside values
  // (We handled that earlier, but if Apple Numbers added quotes, we should be careful. 
  // Let's use a basic regex to split by comma outside quotes)
  let fields = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
  
  // Actually, a robust CSV parser is better to handle Numbers output.
  // But let's just do a manual iteration
  let row = [];
  let inQuotes = false;
  let currentField = '';
  
  for (let char of lines[i]) {
    if (char === '"') {
      inQuotes = !inQuotes;
      currentField += char;
    } else if (char === ',' && !inQuotes) {
      row.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  row.push(currentField); // last field

  // Fill numeric fields
  numIndices.forEach(idx => {
    if (idx < row.length) {
      let val = row[idx].replace(/"/g, '').trim();
      if (!val || val === '') {
        row[idx] = '0';
      }
    }
  });

  lines[i] = row.join(',');
}

fs.writeFileSync(csvPath, lines.join('\n'));
console.log("Patched all empty numeric fields to 0!");
