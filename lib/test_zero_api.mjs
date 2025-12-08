
import { strict as assert } from 'assert';

// 1. Polyfill Browser Environment for Node.js
class MockLocalStorage {
    constructor() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
    clear() { this.store = {}; }
}

global.window = { localStorage: new MockLocalStorage() };
global.localStorage = global.window.localStorage;

// 2. Import the Client
import { supabase } from '../lib/mockSupabase.js';

console.log('🚀 Starting Zero API Logic Tests (incl. User Deletion)...\n');

async function runTests() {
    try {
        // --- SCENARIO 1: SIGN UP ---
        console.log('TEST 1: User Signup');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'test@user.com',
            password: 'password123',
            options: { data: { username: 'TestUser' } }
        });
        assert.equal(signUpError, null, 'Signup should have no error');
        const userId = signUpData.user.id;
        console.log('✅ Signup Passed');

        // --- SCENARIO 2: LOGIN ---
        console.log('\nTEST 2: User Login');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'test@user.com',
            password: 'password123'
        });
        assert.equal(loginError, null);
        console.log('✅ Login Passed');

        // --- SCENARIO 3: PROFILE CREATION ---
        console.log('\nTEST 3: Create Profile');
        await supabase.from('profiles').insert([
            { id: userId, username: 'TestUser', role: 'member', status: 'pending' }
        ]);
        console.log('✅ Profile Created');

        // --- SCENARIO 4: TASK CREATION ---
        console.log('\nTEST 4: Create Task');
        const { data: tasks } = await supabase.from('tasks').insert([{
            title: 'Task 1', status: 'todo', assignee_id: userId
        }]).select();
        const taskId = tasks[0].id;
        console.log('✅ Task Creation Passed');

        // --- SCENARIO 5: ZOMBIE RECOVERY ---
        console.log('\nTEST 5: Zombie User Recovery');
        const zombieUser = { id: 'zombie-1', email: 'z@z.com', user_metadata: { username: 'Z' } };
        const users = JSON.parse(global.localStorage.getItem('taskhub_users') || '[]');
        users.push(zombieUser);
        global.localStorage.setItem('taskhub_users', JSON.stringify(users));

        const { error: recError } = await supabase.auth.signUp({
            email: 'z@z.com', password: 'pw', options: { data: { username: 'Z' } }
        });
        assert.equal(recError, null);
        console.log('✅ Zombie Recovery Passed');

        // --- SCENARIO 6: FULL USER DELETION (The Requested Test) ---
        console.log('\nTEST 6: Full User Deletion (Auth + Profile)');

        // 1. Verify user exists in Auth
        let currentUsers = JSON.parse(global.localStorage.getItem('taskhub_users'));
        assert.ok(currentUsers.some(u => u.id === userId), 'User should exist in Auth before delete');

        // 2. Perform Delete (Simulating Team Page Logic)
        // Note: The frontend calls auth.admin.deleteUser(id) AND profiles.delete().eq('id', id)

        // Step A: Delete Auth
        const { error: delAuthError } = await supabase.auth.admin.deleteUser(userId);
        assert.equal(delAuthError, null, 'Auth deletion failed');

        // Step B: Delete Profile
        const { error: delProfError } = await supabase.from('profiles').delete().eq('id', userId);
        assert.equal(delProfError, null, 'Profile deletion failed');

        // 3. Verify Auth Record is GONE
        currentUsers = JSON.parse(global.localStorage.getItem('taskhub_users'));
        const userFound = currentUsers.find(u => u.id === userId);
        assert.equal(userFound, undefined, 'User Auth record should be strictly removed');

        // 4. Verify Profile is GONE
        const profiles = JSON.parse(global.localStorage.getItem('taskhub_profiles'));
        const profileFound = profiles.find(p => p.id === userId);
        assert.equal(profileFound, undefined, 'User Profile should be removed');

        console.log('✅ full User Deletion Passed (Auth & Profile removed)');

        console.log('\n🎉 ALL SCENARIOS PASSED SUCCESSFULLY!');

    } catch (err) {
        console.error('\n❌ TEST FAILED:', err);
        process.exit(1);
    }
}

runTests();
