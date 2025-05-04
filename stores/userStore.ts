import { defineStore } from 'pinia';
import { Profile, UserSettings, CurrencyCode, ExpenseType } from '~/types';
import { createSupabaseClient } from '~/utils/supabase';

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null as Profile | null,
    settings: null as UserSettings | null,
    loading: false,
    error: null as string | null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.profile,
    
    defaultCurrency: (state) => state.settings?.default_currency || CurrencyCode.USD,
    
    mileageRate: (state) => state.settings?.mileage_rate || 0.58,
    
    defaultExpenseType: (state) => state.settings?.default_expense_type || ExpenseType.OTHER,
    
    hasExcelTemplate: (state) => !!state.settings?.excel_template_url
  },
  
  actions: {
    // Fetch user profile
    async fetchProfile(supabaseClient?: any) {
      this.loading = true;
      this.error = null;
      
      try {
        // Create a new client if none is provided
        const client = supabaseClient || createSupabaseClient();
        
        // First get the current session to ensure we're authenticated
        const { data: { session } } = await client.auth.getSession();
        if (!session) {
          console.error('No active session found when fetching profile');
          throw new Error('No active session');
        }
        
        // Then get the user from the session
        const user = session.user;
        if (!user) {
          console.error('Session exists but no user found');
          throw new Error('User not authenticated');
        }
        
        console.log('Fetching profile for user:', user.id);
        
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          // If profile doesn't exist, create one
          if (error.code === 'PGRST116') {
            console.log('Profile not found. Creating new profile...');
            const newProfile = await this.createProfile(user, client);
            if (newProfile) {
              this.profile = newProfile;
              // Also fetch user settings
              await this.fetchSettings(client);
              return this.profile;
            } else {
              throw new Error('Failed to create profile');
            }
          } else {
            throw error;
          }
        }
        
        this.profile = data as Profile;
        
        // Also fetch user settings
        await this.fetchSettings(client);
        
        return this.profile;
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch profile';
        console.error('Error fetching profile:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Create user profile
    async createProfile(user: any, supabaseClient?: any) {
      try {
        // Create a new client if none is provided
        const client = supabaseClient || createSupabaseClient();
        
        // Create profile
        const { data: profileData, error: profileError } = await client
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || ''
          })
          .select()
          .single();
        
        if (profileError) {
          throw profileError;
        }
        
        // Create default user settings
        const { error: settingsError } = await client
          .from('user_settings')
          .insert({
            user_id: user.id
          });
        
        if (settingsError) {
          throw settingsError;
        }
        
        return profileData as Profile;
      } catch (error: any) {
        console.error('Error creating profile:', error);
        return null;
      }
    },
    
    // Fetch user settings
    async fetchSettings(supabaseClient?: any) {
      this.loading = true;
      this.error = null;
      
      try {
        // Use the provided client or create a new one
        const client = supabaseClient || createSupabaseClient();
        
        // First check if we have a profile loaded
        if (this.profile) {
          // Use the profile ID if we have it
          const userId = this.profile.id;
          console.log('Using profile ID for settings:', userId);
          
          try {
            const { data, error } = await client
              .from('user_settings')
              .select('*')
              .eq('user_id', userId)
              .single();
            
            if (error) {
              // If settings don't exist, create default settings
              if (error.code === 'PGRST116') {
                console.log('Settings not found. Creating default settings...');
                try {
                  const newSettings = await this.createDefaultSettings(userId, client);
                  if (newSettings) {
                    this.settings = newSettings;
                    return this.settings;
                  }
                } catch (createError) {
                  console.error('Error creating default settings:', createError);
                  // Continue with default settings in memory instead of failing
                }
                
                // Fallback to in-memory default settings
                console.log('Using in-memory default settings');
                this.settings = {
                  id: 'default',
                  user_id: userId,
                  default_currency: 'USD',
                  mileage_rate: 0.58,
                  default_expense_type: 'other',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } as UserSettings;
                return this.settings;
              } else {
                console.warn('Error fetching settings:', error);
                // Continue with default settings rather than failing
              }
            } else {
              this.settings = data as UserSettings;
              return this.settings;
            }
          } catch (fetchError) {
            console.error('Exception fetching settings:', fetchError);
            // Continue with default settings
          }
          
          // Fallback to in-memory default settings
          console.log('Using in-memory default settings');
          this.settings = {
            id: 'default',
            user_id: userId,
            default_currency: 'USD',
            mileage_rate: 0.58,
            default_expense_type: 'other',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as UserSettings;
          return this.settings;
        }
        
        // If we don't have a profile, get the user from the session
        try {
          const { data: { session } } = await client.auth.getSession();
          if (!session || !session.user) {
            throw new Error('User not authenticated');
          }
          
          const user = session.user;
          console.log('Using session user ID for settings:', user.id);
          
          const { data, error } = await client
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (error) {
            // If settings don't exist, create default settings
            if (error.code === 'PGRST116') {
              console.log('Settings not found. Creating default settings...');
              try {
                const newSettings = await this.createDefaultSettings(user.id, client);
                if (newSettings) {
                  this.settings = newSettings;
                  return this.settings;
                }
              } catch (createError) {
                console.error('Error creating default settings:', createError);
                // Continue with default settings in memory
              }
            } else {
              console.warn('Error fetching settings:', error);
              // Continue with default settings
            }
          } else {
            this.settings = data as UserSettings;
            return this.settings;
          }
          
          // Fallback to in-memory default settings
          console.log('Using in-memory default settings');
          this.settings = {
            id: 'default',
            user_id: user.id,
            default_currency: 'USD',
            mileage_rate: 0.58,
            default_expense_type: 'other',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as UserSettings;
          return this.settings;
        } catch (sessionError) {
          console.error('Error getting session:', sessionError);
          
          // Last resort fallback
          this.settings = {
            id: 'default',
            user_id: 'anonymous',
            default_currency: 'USD',
            mileage_rate: 0.58,
            default_expense_type: 'other',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as UserSettings;
          return this.settings;
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch settings';
        console.error('Error fetching settings:', error);
        
        // Return default settings even in case of error
        if (!this.settings) {
          this.settings = {
            id: 'default',
            user_id: this.profile?.id || 'anonymous',
            default_currency: 'USD',
            mileage_rate: 0.58,
            default_expense_type: 'other',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as UserSettings;
        }
        
        return this.settings;
      } finally {
        this.loading = false;
      }
    },
    
    // Create default user settings
    async createDefaultSettings(userId: string, supabaseClient?: any) {
      try {
        // Create a new client if none is provided
        const client = supabaseClient || createSupabaseClient();
        
        const { data, error } = await client
          .from('user_settings')
          .insert({
            user_id: userId,
            default_currency: 'USD',
            mileage_rate: 0.58,
            default_expense_type: 'other'
          })
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        return data as UserSettings;
      } catch (error: any) {
        console.error('Error creating default settings:', error);
        return null;
      }
    },
    
    // Update user profile
    async updateProfile(updates: Partial<Profile>, supabaseClient?: any) {
      this.loading = true;
      this.error = null;
      
      try {
        if (!this.profile) {
          throw new Error('Profile not loaded');
        }
        
        // Create a new client if none is provided
        const client = supabaseClient || createSupabaseClient();
        
        const { data, error } = await client
          .from('profiles')
          .update(updates)
          .eq('id', this.profile.id)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        this.profile = { ...this.profile, ...data } as Profile;
        return this.profile;
      } catch (error: any) {
        this.error = error.message || 'Failed to update profile';
        console.error('Error updating profile:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Update user settings
    async updateSettings(updates: Partial<UserSettings>, supabaseClient?: any) {
      this.loading = true;
      this.error = null;
      
      try {
        if (!this.profile) {
          throw new Error('Profile not loaded');
        }
        
        // Create a new client if none is provided
        const client = supabaseClient || createSupabaseClient();
        
        const { data, error } = await client
          .from('user_settings')
          .update(updates)
          .eq('user_id', this.profile.id)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        this.settings = { ...this.settings, ...data } as UserSettings;
        return this.settings;
      } catch (error: any) {
        this.error = error.message || 'Failed to update settings';
        console.error('Error updating settings:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Upload Excel template
    async uploadExcelTemplate(file: File, supabaseClient?: any) {
      this.loading = true;
      this.error = null;
      
      try {
        if (!this.profile) {
          throw new Error('Profile not loaded');
        }
        
        // Create a new client if none is provided
        const client = supabaseClient || createSupabaseClient();
        
        // Upload template file
        const fileName = `templates/${this.profile.id}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await client.storage
          .from('templates')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
          });
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL
        const { data: { publicUrl } } = client.storage
          .from('templates')
          .getPublicUrl(uploadData.path);
        
        // Update user settings with template URL
        const { data, error } = await client
          .from('user_settings')
          .update({ excel_template_url: publicUrl })
          .eq('user_id', this.profile.id)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        this.settings = { ...this.settings, ...data } as UserSettings;
        return publicUrl;
      } catch (error: any) {
        this.error = error.message || 'Failed to upload Excel template';
        console.error('Error uploading Excel template:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Reset state (e.g., on logout)
    resetState() {
      this.profile = null;
      this.settings = null;
      this.loading = false;
      this.error = null;
    }
  }
});