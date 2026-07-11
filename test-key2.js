const key1 = '-----BEGIN PRIVATE KEY-----\nMIIEvgAABBBCCCDDDEEEFFFGGGHHHIIIIIJJJKKKLLLMMMNNNOOOPPPQQQRRRSSSTTTUUUVVVWWWXXXYYYZZZ\n-----END PRIVATE KEY-----';
const key2 = '-----BEGIN PRIVATE KEY----- MIIEvgAABBBCCCDDDEEEFFFGGGHHHIIIIIJJJKKKLLLMMMNNNOOOPPPQQQRRRSSSTTTUUUVVVWWWXXXYYYZZZ -----END PRIVATE KEY-----';
const key3 = '"-----BEGIN PRIVATE KEY-----\\nMIIEvgAABBBCCCDDDEEEFFFGGGHHHIIIIIJJJKKKLLLMMMNNNOOOPPPQQQRRRSSSTTTUUUVVVWWWXXXYYYZZZ\\n-----END PRIVATE KEY-----"';
const key4 = 'MIIEvgAABBBCCCDDDEEEFFFGGGHHHIIIIIJJJKKKLLLMMMNNNOOOPPPQQQRRRSSSTTTUUUVVVWWWXXXYYYZZZ';

function formatPrivateKey(key) {
  if (!key) return undefined;
  
  let formatted = key.trim();
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.slice(1, -1);
  } else if (formatted.startsWith("'") && formatted.endsWith("'")) {
    formatted = formatted.slice(1, -1);
  }
  
  formatted = formatted.replace(/\\n/g, '\n');
  
  const isPem = formatted.includes('BEGIN PRIVATE KEY') && formatted.includes('END PRIVATE KEY');
  
  let cleanBase64 = '';
  if (isPem) {
    const matches = formatted.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
    if (matches && matches[1]) {
      cleanBase64 = matches[1].replace(/\s+/g, '');
    } else {
      return formatted;
    }
  } else {
    cleanBase64 = formatted.replace(/\s+/g, '');
  }
  
  const lines = cleanBase64.match(/.{1,64}/g) || [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

console.log('KEY 1:', JSON.stringify(formatPrivateKey(key1)));
console.log('KEY 2:', JSON.stringify(formatPrivateKey(key2)));
console.log('KEY 3:', JSON.stringify(formatPrivateKey(key3)));
console.log('KEY 4:', JSON.stringify(formatPrivateKey(key4)));
