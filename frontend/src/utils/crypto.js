import forge from 'node-forge';
import CryptoJS from 'crypto-js';

/**
 * Generate RSA key pair for E2EE
 * @returns {Object} { publicKey, privateKey }
 */
export function generateKeyPair() {
  const rsa = forge.pki.rsa;
  const keypair = rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  
  const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
  
  return {
    publicKey: publicKeyPem,
    privateKey: privateKeyPem
  };
}

/**
 * Generate random salt for password hashing
 * @returns {string} salt in hex format
 */
export function generateSalt() {
  return forge.random.getBytesSync(16);
}

/**
 * Generate random IV for encryption
 * @returns {string} IV in hex format
 */
export function generateIV() {
  const iv = forge.random.getBytesSync(16);
  // console.log(' Generated IV:');
  // console.log('IV type:', typeof iv);
  // console.log(' IV length:', iv.length);
  // console.log(' IV preview:', iv.substring(0, 10) + '...');
  // console.log(' IV as hex:', forge.util.bytesToHex(iv));
  return iv;
}

/**
 * Hash password with salt using PBKDF2
 * @param {string} password - Plain text password
 * @param {string} salt - Salt for hashing
 * @returns {string} Hashed password
 */
export function hashPassword(password, salt) {
  const key = forge.pkcs5.pbkdf2(password, salt, 10000, 32);
  return forge.util.encode64(key);
}

/**
 * Encrypt private key with password-derived key
 * @param {string} privateKey - Private key to encrypt
 * @param {string} password - User password
 * @param {string} salt - Salt for key derivation
 * @param {string} iv - IV for encryption
 * @returns {string} Encrypted private key
 */
export function encryptPrivateKey(privateKey, password, salt, iv) {
  const key = forge.pkcs5.pbkdf2(password, salt, 10000, 32);
  const cipher = forge.cipher.createCipher('AES-CBC', key);
  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(privateKey));
  cipher.finish();
  
  return forge.util.encode64(cipher.output.data);
}

/**
 * Decrypt private key with password-derived key
 * @param {string} encryptedPrivateKey - Encrypted private key
 * @param {string} password - User password
 * @param {string} salt - Salt for key derivation
 * @param {string} iv - IV for decryption
 * @returns {string} Decrypted private key
 */
export function decryptPrivateKey(encryptedPrivateKey, password, salt, iv) {
  try {
    // console.log(' decryptPrivateKey called with:');
    // console.log('encryptedPrivateKey length:', encryptedPrivateKey?.length);
    // console.log('salt type:', typeof salt, 'value:', salt);
    // console.log('iv type:', typeof iv, 'value:', iv);
    
    const key = forge.pkcs5.pbkdf2(password, salt, 10000, 32);
    const decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({ iv: iv });
    decipher.update(forge.util.createBuffer(forge.util.decode64(encryptedPrivateKey)));
    decipher.finish();
    
    const decryptedData = decipher.output.data;
    // console.log('Private key decrypted, type:', typeof decryptedData, 'length:', decryptedData.length);
    // console.log('Decrypted preview:', decryptedData.substring(0, 100) + '...');
    
    return decryptedData;
  } catch (error) {
    // console.error('decryptPrivateKey error:', error);
    throw new Error('Failed to decrypt private key. Invalid password.');
  }
}

/**
 * Generate shared secret from private key and public key using ECDH
 * @param {string} privateKeyPem - Private key in PEM format
 * @param {string} publicKeyPem - Public key in PEM format
 * @returns {string} Shared secret
 */
export function generateSharedSecret(privateKeyPem, publicKeyPem) {
  try {
    // console.log('generateSharedSecret called with:');
    // console.log('privateKeyPem type:', typeof privateKeyPem, 'length:', privateKeyPem?.length);
    // console.log('publicKeyPem type:', typeof publicKeyPem, 'length:', publicKeyPem?.length);
    // console.log('privateKeyPem preview:', privateKeyPem?.substring(0, 100) + '...');
    // console.log('publicKeyPem preview:', publicKeyPem?.substring(0, 100) + '...');

    if (!privateKeyPem || !publicKeyPem) {
      throw new Error('Missing private or public key');
    }

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

    // console.log(' Keys parsed successfully');

    // Generate a consistent shared secret by using deterministic key ordering
    // Extract the public key from private key for comparison
    const myPublicKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e);
    const myPublicKeyPem = forge.pki.publicKeyToPem(myPublicKey);
    
    // Always combine keys in lexicographic order to ensure same result
    let key1, key2;
    if (myPublicKeyPem < publicKeyPem) {
      key1 = myPublicKeyPem;
      key2 = publicKeyPem;
    } else {
      key1 = publicKeyPem;
      key2 = myPublicKeyPem;
    }
    
    const combined = key1 + key2;
    //console.log('Combined keys in order:', key1.substring(0, 50) + '...', key2.substring(0, 50) + '...');
    
    const hash = forge.md.sha256.create();
    hash.update(combined);

    const result = hash.digest().toHex().substring(0, 32); // 256-bit key
    //console.log('Shared secret generated successfully:', result.substring(0, 16) + '...');
    return result;
  } catch (error) {
    // console.error('generateSharedSecret error details:', error);
    // console.error('Error message:', error.message);
    // console.error('Error stack:', error.stack);
    throw new Error('Failed to generate shared secret: ' + error.message);
  }
}

/**
 * Encrypt message with shared secret and IV
 * @param {string} message - Plain text message
 * @param {string} sharedSecret - Shared secret key
 * @param {string} iv - IV for encryption
 * @returns {string} Encrypted message
 */
export function encryptMessage(message, sharedSecret, iv) {
  // console.log('encryptMessage called with:');
  // console.log('message:', message);
  // console.log('sharedSecret:', sharedSecret?.substring(0, 16) + '...');
  // console.log('iv (raw):', iv);
  // console.log('iv length:', iv?.length);
  
  const key = CryptoJS.enc.Hex.parse(sharedSecret);
  // IV should be treated as binary bytes, convert to WordArray
  const ivWordArray = CryptoJS.enc.Utf8.parse(iv);
  
  //console.log('Key and IV prepared for encryption');
  
  const encrypted = CryptoJS.AES.encrypt(message, key, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  const result = encrypted.toString();
  // console.log(' Encrypted result:', result);
  return result;
}

/**
 * Decrypt message with shared secret and IV
 * @param {string} ciphertext - Encrypted message
 * @param {string} sharedSecret - Shared secret key
 * @param {string} iv - IV for decryption
 * @returns {string} Decrypted message
 */
export function decryptMessage(ciphertext, sharedSecret, iv) {
  // console.log('decryptMessage called with:');
  // console.log('ciphertext:', ciphertext);
  // console.log('sharedSecret:', sharedSecret?.substring(0, 16) + '...');
  // console.log('iv (raw):', iv);
  // console.log('iv length:', iv?.length);
  
  try {
    const key = CryptoJS.enc.Hex.parse(sharedSecret);
    const ivWordArray = CryptoJS.enc.Utf8.parse(iv);

    // console.log('Key and IV prepared for decryption');

    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    // console.log('Decrypted result length:', result?.length);
    // console.log(' Decrypted result:', result);
    
    if (!result) {
      // console.error('Decryption resulted in empty string!');
      // console.error('Possible causes: wrong key, wrong IV, corrupted ciphertext');
      // console.error(' Key hex:', sharedSecret);
      // console.error(' IV raw:', iv);
      // console.error(' Ciphertext:', ciphertext);
    }
    
    return result;
  } catch (error) {
    // console.error('Decryption error:', error);
    // console.error('Error details:', error.message);
    return '[Decryption failed: ' + error.message + ']';
  }
}

/**
 * Convert string to hex
 * @param {string} str - String to convert
 * @returns {string} Hex string
 */
export function stringToHex(str) {
  return forge.util.bytesToHex(str);
}

/**
 * Convert hex to string
 * @param {string} hex - Hex string to convert
 * @returns {string} String
 */
export function hexToString(hex) {
  return forge.util.hexToBytes(hex);
} 

const formatMessageTime = (timestamp) => {
  if (!timestamp) {
    return 'Vừa xong';
  }

  const messageDate = new Date(timestamp);
  const now = new Date();

  if (isNaN(messageDate.getTime())) {
    return 'Vừa xong';
  }

  const diffInMs = now - messageDate;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 10) {
    return 'Vừa xong';
  } else if (diffInSeconds < 60) {
    return `${diffInSeconds} giây trước`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  } else {
    return messageDate.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}; 