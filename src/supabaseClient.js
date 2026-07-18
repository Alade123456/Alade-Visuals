// A mock supabase client for local-only execution
export const supabase = {
  auth: {
    getSession: async () => {
      const authData = localStorage.getItem('mock_supabase_auth');
      return { data: { session: authData ? JSON.parse(authData) : null }, error: null };
    },
    onAuthStateChange: (cb) => {
      // Very basic mock
      return { data: { subscription: { unsubscribe: () => {} } }, unsubscribe: () => {} };
    },
    signUp: async ({ email, password, options }) => {
      const session = {
        user: { id: 'local-user', email, user_metadata: options?.data || {} },
        access_token: 'mock-token'
      };
      localStorage.setItem('mock_supabase_auth', JSON.stringify(session));
      return { data: { session }, error: null };
    },
    signInWithPassword: async ({ email, password }) => {
      const session = {
        user: { id: 'local-user', email, user_metadata: {} },
        access_token: 'mock-token'
      };
      localStorage.setItem('mock_supabase_auth', JSON.stringify(session));
      return { data: { session }, error: null };
    },
    signInWithOAuth: async (options) => {
      return { data: {}, error: null };
    },
    signOut: async () => {
      localStorage.removeItem('mock_supabase_auth');
      return { error: null };
    },
    getUser: async () => {
      const authData = localStorage.getItem('mock_supabase_auth');
      return { data: { user: authData ? JSON.parse(authData).user : null }, error: null };
    }
  },
  from: (table) => {
    return {
      select: (query) => ({
        eq: (col, val) => Object.assign(Promise.resolve({ data: [], error: null }), {
          single: async () => ({ data: null, error: { code: 'PGRST116' } })
        })
      }),
      insert: async (data) => ({ error: null }),
      update: (data) => ({ eq: (col, val) => ({ eq: async (col2, val2) => ({ error: null }) }) }),
      upsert: async (data) => ({ error: null }),
      delete: () => ({ eq: (col, val) => ({ eq: async (col2, val2) => ({ error: null }) }) })
    };
  }
};
