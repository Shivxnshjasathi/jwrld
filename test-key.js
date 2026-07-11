const key1 = '-----BEGIN PRIVATE KEY-----\\nMIIEvg...\\n-----END PRIVATE KEY-----';
const key2 = '-----BEGIN PRIVATE KEY----- MIIEvg... -----END PRIVATE KEY-----';
const key3 = '"-----BEGIN PRIVATE KEY-----\\nMIIEvg...\\n-----END PRIVATE KEY-----"';
const key4 = '-----BEGIN PRIVATE KEY-----\nMIIEvg...\n-----END PRIVATE KEY-----';

function formatPrivateKey(key) {
  if (!key) return undefined;
  
  let formatted = key.trim();
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.slice(1, -1);
  } else if (formatted.startsWith("'") && formatted.endsWith("'")) {
    formatted = formatted.slice(1, -1);
  }
  
  formatted = formatted.replace(/\\n/g, '\n');
  
  if (formatted.includes('-----BEGIN PRIVATE KEY-----') && !formatted.includes('\n')) {
    formatted = formatted.replace('-----BEGIN PRIVATE KEY----- ', '-----BEGIN PRIVATE KEY-----\n');
    formatted = formatted.replace(' -----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
    
    const parts = formatted.split('\n');
    if (parts.length === 3) {
      parts[1] = parts[1].replace(/ /g, '\n');
      formatted = parts.join('\n');
    }
  }
  
  return formatted;
}

console.log('KEY 1:', JSON.stringify(formatPrivateKey(key1)));
console.log('KEY 2:', JSON.stringify(formatPrivateKey(key2)));
console.log('KEY 3:', JSON.stringify(formatPrivateKey(key3)));
console.log('KEY 4:', JSON.stringify(formatPrivateKey(key4)));
