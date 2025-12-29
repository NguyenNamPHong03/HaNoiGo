/**
 * TEST SCRIPT - Kiểm tra Google OAuth Avatar Flow
 * 
 * Chạy script này trong DevTools Console sau khi login Google
 * để verify mọi thứ hoạt động đúng
 */

(async function testAvatarFlow() {
  console.log('🧪 === STARTING AVATAR FLOW TEST ===\n');

  // Test 1: Check localStorage
  console.log('📋 Test 1: Check localStorage');
  const token = localStorage.getItem('userToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (token) {
    console.log('✅ userToken exists:', token.substring(0, 30) + '...');
  } else {
    console.log('❌ userToken NOT FOUND');
  }
  
  if (refreshToken) {
    console.log('✅ refreshToken exists:', refreshToken.substring(0, 30) + '...');
  } else {
    console.log('⚠️ refreshToken NOT FOUND (optional)');
  }
  console.log('');

  // Test 2: Test API Call
  console.log('📋 Test 2: Calling /api/auth/profile');
  try {
    const API_URL = 'http://localhost:5000/api';
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('📥 API Response:', data);

    if (data.success && data.data && data.data.user) {
      const user = data.data.user;
      console.log('✅ API returned user data');
      console.log('   - _id:', user._id);
      console.log('   - email:', user.email);
      console.log('   - displayName:', user.displayName);
      console.log('   - avatarUrl:', user.avatarUrl || '❌ MISSING');
      console.log('   - googleId:', user.googleId || '❌ MISSING');
      console.log('   - role:', user.role);

      if (user.avatarUrl) {
        console.log('✅ avatarUrl exists:', user.avatarUrl);
        
        // Test if image loads
        const img = new Image();
        img.onload = () => console.log('✅ Avatar image loads successfully');
        img.onerror = () => console.log('❌ Avatar image FAILED to load');
        img.src = user.avatarUrl;
      } else {
        console.log('❌ avatarUrl is MISSING - Backend problem!');
      }
    } else {
      console.log('❌ API response structure is incorrect');
      console.log('Expected: { success: true, data: { user: {...} } }');
    }
  } catch (error) {
    console.error('❌ API call failed:', error);
  }
  console.log('');

  // Test 3: Check React Context
  console.log('📋 Test 3: Check React User Context');
  console.log('⚠️ Manual check: Open React DevTools → Components tab');
  console.log('   → Find UserProvider → Check "user" state');
  console.log('   → user.avatarUrl should exist');
  console.log('');

  // Test 4: Check DOM
  console.log('📋 Test 4: Check DOM Avatar Elements');
  const avatarImages = document.querySelectorAll('img[src*="googleusercontent"], img[src*="ui-avatars.com"]');
  
  if (avatarImages.length > 0) {
    console.log(`✅ Found ${avatarImages.length} avatar image(s)`);
    avatarImages.forEach((img, i) => {
      console.log(`   Avatar ${i + 1}: ${img.src.substring(0, 60)}...`);
      if (img.src.includes('googleusercontent')) {
        console.log('   ✅ Using Google avatar');
      } else if (img.src.includes('ui-avatars.com')) {
        console.log('   ⚠️ Using fallback UI-Avatars (avatarUrl might be missing)');
      }
    });
  } else {
    console.log('❌ No avatar images found in DOM');
  }
  console.log('');

  // Summary
  console.log('🎯 === TEST SUMMARY ===');
  console.log('Next steps:');
  console.log('1. If avatarUrl is MISSING from API response:');
  console.log('   → Check MongoDB: Does user document have avatarUrl field?');
  console.log('   → Check backend: authController.js googleCallback function');
  console.log('');
  console.log('2. If avatarUrl exists but image not showing:');
  console.log('   → Check browser console for CORS errors');
  console.log('   → Check if Google image URL is accessible');
  console.log('   → Check UserMenu.jsx component');
  console.log('');
  console.log('3. If everything passes but still shows "U":');
  console.log('   → Clear localStorage and try login again');
  console.log('   → Hard refresh (Ctrl+Shift+R)');
  console.log('');
  console.log('✅ Test completed!\n');
})();
