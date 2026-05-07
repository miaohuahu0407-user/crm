import fs from 'fs';

const filePath = 'd:/胡苗华/供应链项目/一唐/crm/src/prototypes/crm-presale-product/index.tsx';
const newDrawerPath = 'd:/胡苗华/供应链项目/一唐/crm/src/prototypes/crm-presale-product/drawer-new.txt';

let content = fs.readFileSync(filePath, 'utf-8');
const newDrawer = fs.readFileSync(newDrawerPath, 'utf-8');

const startMarker = '      {showDetailDrawer && selectedRecord ? (';
const endMarker = '\n      {showCreateModal ? (';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error('Start:', startIndex, 'End:', endIndex);
  process.exit(1);
}

const prefix = content.slice(0, startIndex);
const suffix = content.slice(endIndex);
const fullNew = prefix + '      ' + newDrawer + suffix;

fs.writeFileSync(filePath, fullNew);
console.log('Drawer replaced successfully. Bytes:', fullNew.length);