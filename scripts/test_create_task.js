
const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://wionyuznmwbtxtamfrkj.supabase.co';
const supabaseKey = 'sb_publishable_EZONPeZ_wp9a0pIv6Wzj4A_KRV3kINV'; // Anon key
// Actually, to test RLS we should use an authenticated client.
// We can sign in as a user first.

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateTask() {
    console.log('Testing Task Creation...');

    // 1. Get a user to act as - Skipping admin list, using hardcoded credential below.


    // 2. SignUp/SignIn as ScriptTaskUser
    const email = 'scripttaskuser@taskhub.app';
    const password = 'pass123';

    // Try sign up first
    await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: 'ScriptTaskUser' } }
    });

    // Then sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Auth Failed:', authError.message);
        return;
    }
    const userId = authData.user.id;
    console.log('Authenticated as:', userId);

    // Create Profile manually (mimicking AddMemberModal or assumes trigger)
    await supabase.from('profiles').upsert({
        id: userId,
        username: 'ScriptTaskUser',
        role: 'member',
        status: 'active'
    });
    console.log('Profile created/upserted');

    const newTask = {
        title: 'Script Test Task - Auth',
        description: 'Created via debug script as RealProbe',
        status: 'todo',
        assignee_id: userId,
        start_date: '2025-12-25', // YYYY-MM-DD format
        due_date: '2025-12-31'
    };

    const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

    if (error) {
        console.error('FAILED to create task:', error);
    } else {
        console.log('SUCCESS: Task created:', data);
        // Clean up
        await supabase.from('tasks').delete().eq('id', data.id);
    }
}

testCreateTask();
