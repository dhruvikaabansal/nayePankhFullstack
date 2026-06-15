import { createClient } from '@supabase/supabase-js';
import { mockDb } from './utils/mockDb';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid and not placeholders
const hasCredentials = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const supabase = hasCredentials ? createClient(supabaseUrl, supabaseAnonKey) : null;
export const isMockMode = !hasCredentials;

// Unified database operations API
export const db = {
  // Get all volunteers
  async getVolunteers() {
    if (isMockMode) {
      return { data: mockDb.getVolunteers(), error: null };
    }
    
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('registered_at', { ascending: false });
      return { data, error };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  },

  // Register a new volunteer
  async addVolunteer(volunteerData) {
    if (isMockMode) {
      try {
        const data = mockDb.addVolunteer(volunteerData);
        return { data, error: null };
      } catch (e) {
        return { data: null, error: { message: e.message } };
      }
    }

    try {
      // First, check if email already exists in Supabase to prevent duplicate registration
      const { data: existing, error: checkError } = await supabase
        .from('volunteers')
        .select('email')
        .eq('email', volunteerData.email.trim().toLowerCase());
      
      if (checkError) throw checkError;
      if (existing && existing.length > 0) {
        return { data: null, error: { message: 'A volunteer with this email address has already registered.' } };
      }

      // Proceed with insert
      const newVolunteer = {
        full_name: volunteerData.full_name,
        email: volunteerData.email.trim().toLowerCase(),
        phone: volunteerData.phone,
        city: volunteerData.city,
        causes: volunteerData.causes,
        availability: volunteerData.availability,
        hours_per_week: parseInt(volunteerData.hours_per_week) || 0,
        skills: volunteerData.skills || '',
        status: 'Pending' // default
      };

      const { data, error } = await supabase
        .from('volunteers')
        .insert([newVolunteer])
        .select();
      
      return { data: data ? data[0] : null, error };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  },

  // Transition volunteer status in the pipeline
  async updateVolunteerStatus(id, newStatus) {
    if (isMockMode) {
      try {
        const data = mockDb.updateVolunteerStatus(id, newStatus);
        return { data, error: null };
      } catch (e) {
        return { data: null, error: { message: e.message } };
      }
    }

    try {
      const { data, error } = await supabase
        .from('volunteers')
        .update({ status: newStatus })
        .eq('id', id)
        .select();
      
      return { data: data ? data[0] : null, error };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  },

  // Sign in admin
  async login(email, password) {
    if (isMockMode) {
      return mockDb.login(email, password);
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { data, error };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  },

  // Sign out admin
  async logout() {
    if (isMockMode) {
      return mockDb.logout();
    }
    
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (e) {
      return { error: { message: e.message } };
    }
  },

  // Fetch active session
  async getSession() {
    if (isMockMode) {
      return mockDb.getSession();
    }
    
    try {
      const { data, error } = await supabase.auth.getSession();
      return { data, error };
    } catch (e) {
      return { data: { session: null }, error: { message: e.message } };
    }
  },

  // Set up subscription for session changes (used in main App router)
  onAuthStateChange(callback) {
    if (isMockMode) {
      // For mock mode, we don't have real time auth updates, but we return a mock unsubscribe
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    
    return supabase.auth.onAuthStateChange(callback);
  }
};
