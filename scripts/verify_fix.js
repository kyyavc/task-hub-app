const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local manually
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const buffer = fs.readFileSync(envPath);
        let content;
        // Handle BOM
        if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
            content = buffer.toString('utf16le');
        } else {
            content = buffer.toString('utf8');
        }
        content.split(/\r?\n/).forEach(line => {
            const cleanLine = line.trim();
            if (!cleanLine || cleanLine.startsWith('#')) return;
            const [key, ...valParts] = cleanLine.split('=');
            const val = valParts.join('=');
            if (key && val) process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
        });
    }
} catch (e) {
    console.error("Error loading .env.local", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFix() {
    console.log('--- Starting Verification ---');

    // 0. Sign In
    console.log('0. Signing in...');
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: process.env.NEXT_PUBLIC_TEST_USER_EMAIL || 'master@taskhub.app',
        password: process.env.NEXT_PUBLIC_TEST_USER_PASSWORD || 'master1234'
    });

    if (signInError) {
        console.error('WARN: Sign-in failed (continuing, might have Service Role Key):', signInError.message);
    } else {
        console.log('   Signed in successfully.');
    }

    // 1. Create a dummy task
    console.log('1. Creating test task...');
    const { data: { user } } = await supabase.auth.getUser();

    const { data: task, error: createError } = await supabase
        .from('tasks')
        .insert([{
            title: 'Verification Task',
            description: 'Testing completed_at trigger',
            status: 'todo',
            assignee_id: user?.id
        }])
        .select()
        .single();

    if (createError) {
        if (createError.message.includes('completed_at')) {
            console.error('FAIL: Creation failed possibly due to schema issue:', createError.message);
        } else {
            console.error('FAIL: Creation failed:', createError.message);
        }
        return;
    }
    console.log('   Task created:', task.id);

    // 2. Mark as done
    console.log('2. Updating status to "done"...');
    const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', task.id)
        .select()
        .single();

    if (updateError) {
        console.error('FAIL: Update failed:', updateError.message);
        return;
    }


    // 3. Verify completed_at
    console.log('3. Checking completed_at...');
    console.log('   Available keys:', Object.keys(updatedTask));

    if (updatedTask.completed_at) {
        console.log('PASS: completed_at is set:', updatedTask.completed_at);
    } else {
        console.error('FAIL: completed_at is NULL despite status being done.');
        if (!('completed_at' in updatedTask)) {
            console.error('      CRITICAL: "completed_at" column is MISSING from the result. The ALTER TABLE command likely did not run.');
        } else {
            console.error('      Column exists but value is null. Trigger might not be working.');
        }
    }

    // Cleanup
    console.log('4. Cleaning up...');
    await supabase.from('tasks').delete().eq('id', task.id);
    console.log('--- Verification Complete ---');
}

verifyFix();
