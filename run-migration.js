#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting image migration to Cloudinary...\n');

// First, compile the backend TypeScript files
console.log('📦 Compiling backend TypeScript files...\n');

const compileProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'backend')
});

compileProcess.on('close', (compileCode) => {
  if (compileCode !== 0) {
    console.log('❌ Backend compilation failed. Please check the errors above.');
    return;
  }

  console.log('✅ Backend compilation successful!\n');
  console.log('🔄 Starting image migration...\n');

  // Run the migration script
  const migrationProcess = spawn('node', [path.join(__dirname, 'backend/src/scripts/migrateImages.js')], {
    stdio: 'inherit',
    cwd: __dirname
  });

  migrationProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n🧹 Running cleanup to remove any remaining Unsplash URLs...\n');

      // Run the cleanup script
      const cleanupProcess = spawn('node', [path.join(__dirname, 'backend/src/scripts/cleanupImages.js')], {
        stdio: 'inherit',
        cwd: __dirname
      });

      cleanupProcess.on('close', (cleanupCode) => {
        if (cleanupCode === 0) {
          console.log('\n✅ Cleanup completed successfully!');
          console.log('\n📋 Next steps:');
          console.log('1. Check your Cloudinary dashboard to verify uploaded images');
          console.log('2. Test the application to ensure images are displaying correctly');
          console.log('3. All Unsplash URLs have been replaced with Cloudinary images');
        } else {
          console.log(`\n❌ Cleanup failed with exit code ${cleanupCode}`);
          console.log('Please check the error messages above and try again.');
        }
      });

      cleanupProcess.on('error', (error) => {
        console.error('❌ Error running cleanup:', error.message);
      });
    } else {
      console.log(`\n❌ Migration failed with exit code ${code}`);
      console.log('Please check the error messages above and try again.');
    }
  });

  migrationProcess.on('error', (error) => {
    console.error('❌ Error running migration:', error.message);
  });
});
