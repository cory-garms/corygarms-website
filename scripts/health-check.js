import { execSync } from 'child_process';
import https from 'https';

console.log('--- 🚀 Starting Weekly Health Check ---');

// 1. Check NPM Audit
console.log('\n[1/3] Running NPM Security Audit...');
try {
  // We only fail on critical or high vulnerabilities
  execSync('npm audit --audit-level=high', { stdio: 'inherit' });
  console.log('✅ NPM Audit Passed. No high-level vulnerabilities.');
} catch (error) {
  console.error('❌ NPM Audit Failed. Please update dependencies.');
  process.exit(1);
}

// 2. Check Build Command Integrity
console.log('\n[2/3] Verifying Astro Build Integrity...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Astro Build Pipeline is Healthy.');
} catch (error) {
  console.error('❌ Build process failed. Check your recent commits.');
  process.exit(1);
}

// 3. DNS/SSL Check for corygarms.com
console.log('\n[3/3] Checking SSL/DNS for corygarms.com...');
const options = {
  hostname: 'corygarms.com',
  port: 443,
  method: 'GET',
};

const req = https.request(options, (res) => {
  if (res.statusCode >= 200 && res.statusCode < 400) {
    console.log(`✅ corygarms.com is live and responding (Status: ${res.statusCode}). SSL certificate is valid.`);
    console.log('\n--- 🎉 All Health Checks Passed! ---');
    process.exit(0);
  } else {
    console.warn(`⚠️ Warning: corygarms.com responded with status ${res.statusCode}.`);
    process.exit(0);
  }
});

req.on('error', (e) => {
  console.error(`❌ SSL/DNS Check Failed: ${e.message}`);
  console.error('Has the Vercel/Netlify DNS record propagated from GoDaddy?');
  process.exit(1);
});

req.end();
