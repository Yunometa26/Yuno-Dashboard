const fs = require('fs');

const filePath = 'GitHub/Yuno-Dashboard/package-lock.json';
const outputPath = 'GitHub/Yuno-Dashboard/package-lock.cleaned.json';

// Read the file as text
const content = fs.readFileSync(filePath, 'utf-8');

// Use a regex to split the top-level keys (this is a workaround for huge files)
const match = content.match(/\{[\s\S]*\}/);
if (!match) {
  console.error('Could not find JSON object in file.');
  process.exit(1);
}

const jsonStart = content.indexOf('{');
const jsonEnd = content.lastIndexOf('}');
const jsonString = content.substring(jsonStart, jsonEnd + 1);

// Parse as object, but with a custom reviver to keep only the first occurrence of each key
const seen = new Set();
const cleaned = {};

function parseAndClean(obj) {
  for (const key in obj) {
    if (!seen.has(key)) {
      seen.add(key);
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        cleaned[key] = parseAndClean(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }
  }
  return cleaned;
}

let parsed;
try {
  parsed = JSON.parse(jsonString);
} catch (e) {
  console.error('Failed to parse JSON:', e.message);
  process.exit(1);
}

const result = parseAndClean(parsed);

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('Cleaned file written to', outputPath); 