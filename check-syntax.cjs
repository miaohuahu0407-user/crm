const fs = require('fs');
const content = fs.readFileSync('src/prototypes/crm-customer-detail/index.tsx', 'utf8');

const patterns = [
  ['<div', '</div>'],
  ['<section', '</section>'],
  ['<aside', '</aside>'],
  ['<>', '</>'],
];

for (const [open, close] of patterns) {
  const openCount = (content.match(new RegExp(open, 'g')) || []).length;
  const closeCount = (content.match(new RegExp(close, 'g')) || []).length;
  console.log(`${open}...${close}: open=${openCount}, close=${closeCount}, diff=${openCount - closeCount}`);
}