const path = require('path');
const fs = require('fs');

const admin = require('firebase-admin');

console.log('🔍 Script started...');
console.log('📁 Current directory:', process.cwd());

// Find service account key
const keyPath = path.join(__dirname, '../serviceAccountKey.json');
console.log('🔑 Looking for key at:', keyPath);
console.log('📋 File exists?', fs.existsSync(keyPath));

if (!fs.existsSync(keyPath)) {
  console.error('\n❌ ERROR: serviceAccountKey.json not found!');
  console.error('   Expected location:', keyPath);
  console.error('   Please download from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require(keyPath);
  console.log('✅ Service account loaded');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin SDK initialized\n');
} catch (error) {
  console.error('❌ Initialization error:', error.message);
  process.exit(1);
}

async function deleteAllUsers() {
  let totalDeleted = 0;
  let batchCount = 0;
  
  try {
    console.log('🗑️  Starting bulk user deletion...\n');
    
    while (true) {
      console.log(`📦 Fetching batch ${batchCount + 1}...`);
      const result = await admin.auth().listUsers(1000);
      console.log(`   Found ${result.users.length} users`);
      
      if (result.users.length === 0) {
        console.log('✅ No more users to delete');
        break;
      }
      
      batchCount++;
      console.log(`🔄 Deleting ${result.users.length} users from batch ${batchCount}...`);
      
      const deletePromises = result.users.map(user => 
        admin.auth().deleteUser(user.uid)
          .then(() => totalDeleted++)
          .catch(err => console.error(`Failed to delete ${user.uid}:`, err.message))
      );
      
      await Promise.all(deletePromises);
      console.log(`   ✅ Deleted ${result.users.length} (Total: ${totalDeleted})\n`);
    }
    
    console.log('\n✨ ============================================');
    console.log(`✨ Successfully deleted ${totalDeleted} users!`);
    console.log('✨ ============================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

deleteAllUsers();
