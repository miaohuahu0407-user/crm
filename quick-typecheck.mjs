import { execSync } from 'child_process';
import fs from 'fs';

try {
  const output = execSync('npx tsc --noEmit -p tsconfig.typecheck.json', {
    cwd: 'd:\\胡苗华\\供应链项目\\一唐\\crm',
    encoding: 'utf-8',
    timeout: 120000,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  fs.writeFileSync('typecheck-result.txt', 'SUCCESS\n' + output);
} catch (e) {
  fs.writeFileSync('typecheck-result.txt', 'ERROR\n' + (e.stdout || '') + '\n' + (e.stderr || ''));
}