// src/api/base44Client.js
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hsutxzrzgcvquvonarfd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdXR4enJ6Z2N2cXV2b25hcmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDQwNzcsImV4cCI6MjA5NjE4MDA3N30.UKr0aUy9BmAabIscyBv1FcYS6XVPSk8Y62Pehrvyigo';
const defaultBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'public';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const normalizeSortKey = (sort) => {
  if (!sort) return null;
  const order = sort.startsWith('-') ? 'desc' : 'asc';
  const key = sort.replace(/^-/, '');
  return {
    column: key === 'created_date' ? 'created_at' : key,
    order,
  };
};

const applySort = (query, sort) => {
  const sortData = normalizeSortKey(sort);
  if (!sortData || !sortData.column) return query;
  return query.order(sortData.column, { ascending: sortData.order === 'asc' });
};

const ensureSuccess = (result) => {
  if (result.error) {
    throw result.error;
  }
  return result.data ?? [];
};

const listRecords = async (table, sort) => {
  let query = supabase.from(table).select('*');
  query = applySort(query, sort);
  const result = await query;
  return ensureSuccess(result);
};

const getRecord = async (table, id) => {
  const result = await supabase.from(table).select('*').eq('id', id).single();
  return ensureSuccess(result);
};

const createRecord = async (table, payload) => {
  const result = await supabase.from(table).insert([payload]).select().single();
  return ensureSuccess(result);
};

const updateRecord = async (table, id, payload) => {
  const result = await supabase.from(table).update(payload).eq('id', id);
  if (result.error) throw result.error;
  return result.data;
};

const deleteRecord = async (table, id) => {
  const result = await supabase.from(table).delete().eq('id', id);
  if (result.error) throw result.error;
  return result.data;
};

const uploadFile = async ({ file }) => {
  const filePath = `uploads/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const { error: uploadError } = await supabase.storage.from(defaultBucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (uploadError) {
    console.warn('Supabase storage upload failed:', uploadError);
    return { file_url: URL.createObjectURL(file) };
  }

  const { data, error: urlError } = supabase.storage.from(defaultBucket).getPublicUrl(filePath);
  if (urlError) {
    console.warn('Failed to get Supabase public URL:', urlError);
    return { file_url: URL.createObjectURL(file) };
  }

  return { file_url: data.publicUrl };
};

const parseResetToken = (token) => token || null;

const loginViaEmailPassword = async (email, password) => {
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data;
};

const loginWithProvider = async (provider, redirectTo = '/') => {
  const result = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}${redirectTo}` } });
  if (result.error) throw result.error;
  return result;
};

const register = async ({ email, password }) => {
  const result = await supabase.auth.signUp({ email, password }, { redirectTo: `${window.location.origin}/login` });
  if (result.error) throw result.error;
  return result.data;
};

const verifyOtp = async () => {
  return { access_token: null };
};

const resendOtp = async () => {
  return true;
};

const resetPasswordRequest = async (email) => {
  const result = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (result.error) throw result.error;
  return result.data;
};

const resetPassword = async ({ resetToken, newPassword }) => {
  const token = parseResetToken(resetToken);
  if (token) {
    await supabase.auth.setSession({ access_token: token, refresh_token: token });
  }
  const result = await supabase.auth.updateUser({ password: newPassword });
  if (result.error) throw result.error;
  return result.data;
};

const me = async () => {
  const result = await supabase.auth.getSession();
  if (result.error) throw result.error;
  if (!result.data?.session?.user) {
    throw new Error('Not authenticated');
  }
  return result.data.session.user;
};

const logout = async () => {
  const result = await supabase.auth.signOut();
  if (result.error) throw result.error;
  window.location.href = '/login';
};

const redirectToLogin = (redirect = '/login') => {
  window.location.href = redirect;
};

const setToken = async (access_token) => {
  if (!access_token) return null;
  const result = await supabase.auth.setSession({ access_token, refresh_token: access_token });
  if (result.error) throw result.error;
  return result.data;
};

export const base44 = {
  auth: {
    loginViaEmailPassword,
    loginWithProvider,
    register,
    verifyOtp,
    resendOtp,
    resetPasswordRequest,
    resetPassword,
    me,
    logout,
    redirectToLogin,
    setToken,
  },
  entities: {
    Photo: {
      list: (sort) => listRecords('photos', sort),
      create: (payload) => createRecord('photos', payload),
      update: (id, payload) => updateRecord('photos', id, payload),
      delete: (id) => deleteRecord('photos', id),
      get: (id) => getRecord('photos', id),
      useList: () => {
        const [data, setData] = useState([]);
        useEffect(() => {
          listRecords('photos').then(setData).catch(console.error);
        }, []);
        return data;
      },
      useGet: (id) => {
        const [data, setData] = useState(null);
        useEffect(() => {
          if (!id) return;
          getRecord('photos', id).then(setData).catch(console.error);
        }, [id]);
        return data;
      },
    },
    Collection: {
      list: (sort) => listRecords('collections', sort),
      create: (payload) => createRecord('collections', payload),
      update: (id, payload) => updateRecord('collections', id, payload),
      delete: (id) => deleteRecord('collections', id),
      get: (id) => getRecord('collections', id),
      useList: () => {
        const [data, setData] = useState([]);
        useEffect(() => {
          listRecords('collections').then(setData).catch(console.error);
        }, []);
        return data;
      },
      useGet: (id) => {
        const [data, setData] = useState(null);
        useEffect(() => {
          if (!id) return;
          getRecord('collections', id).then(setData).catch(console.error);
        }, [id]);
        return data;
      },
    },
    Person: {
      list: (sort) => listRecords('people', sort),
      create: (payload) => createRecord('people', payload),
      update: (id, payload) => updateRecord('people', id, payload),
      delete: (id) => deleteRecord('people', id),
      get: (id) => getRecord('people', id),
      useList: () => {
        const [data, setData] = useState([]);
        useEffect(() => {
          listRecords('people').then(setData).catch(console.error);
        }, []);
        return data;
      },
      useGet: (id) => {
        const [data, setData] = useState(null);
        useEffect(() => {
          if (!id) return;
          getRecord('people', id).then(setData).catch(console.error);
        }, [id]);
        return data;
      },
    },
  },
  integrations: {
    Core: {
      UploadFile: uploadFile,
    },
  },
};

export default base44;
