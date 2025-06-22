#!/usr/bin/env node

/**
 * Ensure Admin Access in Choreo
 * Comprehensive script to ensure alesierraalta@gmail.com has admin access in both databases
 */

import { createClient } from '@supabase/supabase-js';

// Database configurations
const DATABASES = {
    production: {
        name: 'LUMO Production',
        projectId: 'ubjujxtvlubxowsphvuk',
        url: process.env.SUPABASE_PROD_URL || 'https://ubjujxtvlubxowsphvuk.supabase.co',
        key: process.env.SUPABASE_PROD_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY
    },
    development: {
        name: 'LUMO Development', 
        projectId: 'ndprriqyhddjoixrlqnz',
        url: process.env.SUPABASE_DEV_URL || 'https://ndprriqyhddjoixrlqnz.supabase.co',
        key: process.env.SUPABASE_DEV_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY
    }
};

const ROOT_USER_EMAIL = 'alesierraalta@gmail.com';

async function ensureAdminAccess() {
    console.log('🔧 Ensuring Admin Access for Root User in Choreo...\n');
    console.log(`👤 Root User: ${ROOT_USER_EMAIL}\n`);

    for (const [env, config] of Object.entries(DATABASES)) {
        console.log(`📊 Processing ${config.name} (${env})...`);
        
        if (!config.key) {
            console.log(`❌ No service key configured for ${env} environment`);
            console.log(`   Set SUPABASE_${env.toUpperCase()}_SERVICE_KEY environment variable`);
            continue;
        }

        try {
            const supabase = createClient(config.url, config.key);
            
            // Step 1: Check if user exists
            console.log('   1️⃣ Checking if user exists...');
            const { data: existingUser, error: userError } = await supabase
                .from('users')
                .select('id, email, name, role_id, is_active')
                .eq('email', ROOT_USER_EMAIL)
                .single();

            if (userError && userError.code !== 'PGRST116') {
                console.log(`   ❌ Error checking user: ${userError.message}`);
                continue;
            }

            // Step 2: Get or create ADMIN role
            console.log('   2️⃣ Ensuring ADMIN role exists...');
            let adminRoleId;
            
            const { data: adminRole, error: roleError } = await supabase
                .from('roles')
                .select('id, name')
                .eq('name', 'ADMIN')
                .single();

            if (roleError && roleError.code === 'PGRST116') {
                // Create ADMIN role if it doesn't exist
                console.log('   🔨 Creating ADMIN role...');
                const { data: newRole, error: createRoleError } = await supabase
                    .from('roles')
                    .insert([{
                        name: 'ADMIN',
                        description: 'Administrator with full access'
                    }])
                    .select('id')
                    .single();

                if (createRoleError) {
                    console.log(`   ❌ Error creating ADMIN role: ${createRoleError.message}`);
                    continue;
                }
                adminRoleId = newRole.id;
                console.log(`   ✅ Created ADMIN role with ID: ${adminRoleId}`);
            } else if (roleError) {
                console.log(`   ❌ Error checking ADMIN role: ${roleError.message}`);
                continue;
            } else {
                adminRoleId = adminRole.id;
                console.log(`   ✅ Found existing ADMIN role with ID: ${adminRoleId}`);
            }

            // Step 3: Create or update user with ADMIN role
            if (!existingUser) {
                console.log('   3️⃣ Creating root user with ADMIN role...');
                const { data: newUser, error: createUserError } = await supabase
                    .from('users')
                    .insert([{
                        email: ROOT_USER_EMAIL,
                        name: 'Alejandro Sierra (ROOT)',
                        role_id: adminRoleId,
                        is_active: true
                    }])
                    .select('id, email, name')
                    .single();

                if (createUserError) {
                    console.log(`   ❌ Error creating user: ${createUserError.message}`);
                    continue;
                }

                console.log(`   ✅ Created root user: ${newUser.email} (ID: ${newUser.id})`);
            } else {
                console.log('   3️⃣ Updating existing user to ADMIN role...');
                const { error: updateUserError } = await supabase
                    .from('users')
                    .update({
                        role_id: adminRoleId,
                        is_active: true,
                        name: 'Alejandro Sierra (ROOT)',
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', ROOT_USER_EMAIL);

                if (updateUserError) {
                    console.log(`   ❌ Error updating user: ${updateUserError.message}`);
                    continue;
                }

                console.log(`   ✅ Updated user to ADMIN role: ${existingUser.email} (ID: ${existingUser.id})`);
            }

            // Step 4: Verify the changes
            console.log('   4️⃣ Verifying admin access...');
            const { data: verifyUser, error: verifyError } = await supabase
                .from('users')
                .select(`
                    id, email, name, is_active,
                    roles!inner(name, description)
                `)
                .eq('email', ROOT_USER_EMAIL)
                .single();

            if (verifyError) {
                console.log(`   ❌ Error verifying user: ${verifyError.message}`);
                continue;
            }

            console.log(`   ✅ Verification successful:`);
            console.log(`      - User: ${verifyUser.email}`);
            console.log(`      - Role: ${verifyUser.roles.name}`);
            console.log(`      - Active: ${verifyUser.is_active}`);
            console.log(`      - Description: ${verifyUser.roles.description}`);

        } catch (error) {
            console.log(`   ❌ Unexpected error: ${error.message}`);
        }

        console.log('');
    }

    console.log('🎯 Admin Access Configuration Complete!\n');
    
    // Step 5: Generate Choreo deployment configuration
    console.log('📋 Choreo Deployment Configuration:');
    console.log('   Add these secrets in Choreo console:');
    console.log('   - DATABASE_URL: (Your production Supabase connection string)');
    console.log('   - JWT_SECRET: (32+ character secret key)');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL: https://ubjujxtvlubxowsphvuk.supabase.co');
    console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY: (Your Supabase anon key)');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Verify Choreo secrets are configured');
    console.log('   2. Trigger new deployment in Choreo');
    console.log('   3. Test login with alesierraalta@gmail.com');
    console.log('   4. Verify admin access in dashboard');
}

// Run the script
ensureAdminAccess().catch(console.error); 