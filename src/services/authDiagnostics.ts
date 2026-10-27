import { auth } from './firebase.ts';
import { getSupabaseClient, isSupabaseConfigured } from './supabase.ts';

export interface DiagnosticResult {
  timestamp: string;
  firebaseAuth: {
    isUserSignedIn: boolean;
    uid: string | null;
    email: string | null;
    displayName: string | null;
    emailVerified: boolean | null;
    isAnonymous: boolean | null;
    tokenRetrievalSuccess: boolean;
    tokenPreview?: string;
    tokenExpiry?: string;
    tokenError?: string;
  };
  supabaseClient: {
    isConfigured: boolean;
    clientInitialized: boolean;
    authHeaderConfigured: boolean;
    authHeaderPreview?: string;
    customHeaders: Record<string, string>;
  };
  liveProbe: {
    tested: boolean;
    success: boolean;
    status: number | string;
    message: string;
    responseTimeMs?: number;
    errorDetails?: any;
  };
}

/**
 * Diagnostics runner:
 * 1. Checks and logs current Firebase Auth state.
 * 2. Retrieves current Firebase ID token.
 * 3. Initializes Supabase client with the ID token in Authorization header.
 * 4. Probes Supabase connectivity and validates that 'server unreachable' errors are resolved.
 */
export async function runFirebaseAuthSupabaseDiagnostics(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  const currentUser = auth.currentUser;

  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    firebaseAuth: {
      isUserSignedIn: Boolean(currentUser),
      uid: currentUser?.uid || null,
      email: currentUser?.email || null,
      displayName: currentUser?.displayName || null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tokenRetrievalSuccess: false
    },
    supabaseClient: {
      isConfigured: isSupabaseConfigured(),
      clientInitialized: false,
      authHeaderConfigured: false,
      customHeaders: {}
    },
    liveProbe: {
      tested: false,
      success: false,
      status: 'pending',
      message: 'Probe initialized'
    }
  };

  let idToken: string | null = null;

  // Step 1: Firebase Auth ID Token Extraction
  if (currentUser) {
    try {
      idToken = await currentUser.getIdToken(true);
      result.firebaseAuth.tokenRetrievalSuccess = true;
      result.firebaseAuth.tokenPreview = `${idToken.substring(0, 14)}...${idToken.substring(idToken.length - 8)}`;
      
      try {
        const tokenResult = await currentUser.getIdTokenResult();
        result.firebaseAuth.tokenExpiry = tokenResult.expirationTime;
      } catch (_) {}
    } catch (tokenErr: any) {
      result.firebaseAuth.tokenRetrievalSuccess = false;
      result.firebaseAuth.tokenError = tokenErr?.message || String(tokenErr);
    }
  }

  // Step 2: Supabase Client Initialization with Authorization header verification
  const userId = currentUser?.uid || 'anonymous_user';
  const email = currentUser?.email || 'anonymous@university.edu';
  const effectiveToken = idToken || undefined;

  const supabaseClient = getSupabaseClient(userId, email, effectiveToken);
  
  if (supabaseClient) {
    result.supabaseClient.clientInitialized = true;
    result.supabaseClient.authHeaderConfigured = Boolean(effectiveToken);
    result.supabaseClient.authHeaderPreview = effectiveToken 
      ? `Bearer ${effectiveToken.substring(0, 10)}...` 
      : 'Bearer anon-key / public key';
    result.supabaseClient.customHeaders = {
      'x-user-id': userId,
      'x-user-email': email.toLowerCase().trim(),
      'Authorization': effectiveToken ? `Bearer ${effectiveToken.substring(0, 8)}...` : 'Not Attached (Signed Out)'
    };
  }

  // Step 3: Live Query Probe to verify connection and prevent 'server unreachable' errors
  if (supabaseClient) {
    result.liveProbe.tested = true;
    try {
      const probeStart = Date.now();
      const { data, error, status } = await supabaseClient
        .from('courses')
        .select('id, name')
        .limit(1);

      result.liveProbe.responseTimeMs = Date.now() - probeStart;
      result.liveProbe.status = status || 200;

      if (error) {
        result.liveProbe.success = false;
        result.liveProbe.message = `Supabase responded with status ${status}: ${error.message}`;
        result.liveProbe.errorDetails = {
          code: error.code,
          details: error.details,
          hint: error.hint
        };
      } else {
        result.liveProbe.success = true;
        result.liveProbe.message = `Supabase query successful (${result.liveProbe.responseTimeMs}ms). Token authorized correctly.`;
      }
    } catch (networkErr: any) {
      result.liveProbe.success = false;
      result.liveProbe.status = 'UNREACHABLE';
      result.liveProbe.message = `Server unreachable error: ${networkErr?.message || 'Failed to fetch'}`;
      result.liveProbe.errorDetails = networkErr?.stack || String(networkErr);
    }
  } else {
    result.liveProbe.tested = false;
    result.liveProbe.message = 'Supabase client could not be initialized (missing configuration).';
  }

  // Output structured diagnostic log to console
  console.group('🔍 [ILMISTAAN DIAGNOSTICS] Firebase Auth & Supabase Authorization Probe');
  console.log('Timestamp:', result.timestamp);
  console.log('Firebase User:', result.firebaseAuth);
  console.log('Supabase Client Config:', result.supabaseClient);
  console.log('Live Probe Result:', result.liveProbe);
  console.groupEnd();

  return result;
}
