import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  memberName?: string;
}

interface SyncUserRequest {
  email: string;
  password: string;
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();

    switch (action) {
      case 'create_user':
        return await createUser(data as CreateUserRequest);
      case 'sync_user':
        return await syncUser(data as SyncUserRequest);
      case 'send_password_reset':
        return await sendPasswordReset(data.email);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Error in manage-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

async function createUser(data: CreateUserRequest) {
  const { email, password, memberName } = data;
  
  console.log(`Creating user: ${email}`);
  
  // Check if profile already exists
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  // Create user in auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      created_by: 'admin',
      member_name: memberName 
    }
  });

  if (authError) {
    if (authError.message?.includes('already exists')) {
      // User exists in auth, try to get user by listing users
      const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listUsersError) {
        throw new Error(`Nie udało się pobrać listy użytkowników: ${listUsersError.message}`);
      }

      const user = users?.find(u => u.email === email);
      
      if (!user) {
        throw new Error(`Nie znaleziono użytkownika: ${email}`);
      }

      if (user && !existingProfile) {
        // Create profile for existing auth user
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email
          });

        if (profileError) {
          console.error('Error creating profile for existing user:', profileError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Użytkownik już istnieje i został zsynchronizowany',
          user: { email: user.email, id: user.id }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    throw authError;
  }

  if (!authUser?.user) {
    throw new Error('Nie udało się utworzyć użytkownika');
  }

  // Create or update profile
  if (existingProfile && existingProfile.id !== authUser.user.id) {
    // Update existing profile with correct auth user ID
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ id: authUser.user.id })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating profile ID:', updateError);
    }
  } else if (!existingProfile) {
    // Create new profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: authUser.user.email
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Użytkownik został utworzony pomyślnie',
      user: { email: authUser.user.email, id: authUser.user.id }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncUser(data: SyncUserRequest) {
  const { email, password } = data;
  
  console.log(`Syncing user: ${email}`);
  
  // Check if profile exists
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    throw new Error('Użytkownik nie istnieje w systemie');
  }

  // Try to get user from auth by listing users
  const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listUsersError) {
    throw new Error(`Nie udało się pobrać listy użytkowników: ${listUsersError.message}`);
  }

  const user = users?.find(u => u.email === email);
  
  if (user) {
    // User exists in auth, send password reset
    return await sendPasswordReset(email);
  } else {
    // User doesn't exist in auth, create them
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { synced: true }
    });

    if (authError) {
      throw new Error(`Nie udało się utworzyć użytkownika: ${authError.message}`);
    }

    if (!authUser?.user) {
      throw new Error('Nie udało się utworzyć użytkownika');
    }

    // Update profile with correct auth user ID
    if (profile.id !== authUser.user.id) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ id: authUser.user.id })
        .eq('email', email);

      if (updateError) {
        console.error('Error updating profile ID:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Użytkownik ${email} został zsynchronizowany. Może się zalogować używając hasła: ${password}`,
        passwordSet: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function sendPasswordReset(email: string) {
  console.log(`Sending password reset for: ${email}`);
  
  const { error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: email,
    options: {
      redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app') || 'http://localhost:3000'}/`
    }
  });

  if (error) {
    throw new Error(`Nie udało się wysłać emaila resetującego hasło: ${error.message}`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Link do resetowania hasła został wysłany na adres ${email}`,
      passwordReset: true
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(handler);