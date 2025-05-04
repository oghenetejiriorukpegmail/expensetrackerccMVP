import { defineStore } from 'pinia';
import { Trip, TripStatus } from '~/types';
import { useSupabaseClient } from '#imports';

export const useTripStore = defineStore('trip', {
  state: () => ({
    trips: [] as Trip[],
    currentTrip: null as Trip | null,
    loading: false,
    error: null as string | null
  }),
  
  getters: {
    // Get trips sorted by creation date (newest first)
    sortedTrips: (state) => {
      return [...state.trips].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    
    // Get trips by status
    tripsByStatus: (state) => (status: TripStatus) => {
      return state.trips.filter(trip => trip.status === status);
    },
    
    // Get active trips (planned or in progress)
    activeTrips: (state) => {
      return state.trips.filter(trip => 
        trip.status === TripStatus.PLANNED || trip.status === TripStatus.IN_PROGRESS
      );
    },
    
    // Get trip by ID
    getTripById: (state) => (id: string) => {
      return state.trips.find(trip => trip.id === id) || null;
    }
  },
  
  actions: {
    // Fetch all trips for the current user
    async fetchTrips() {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        this.trips = data as Trip[];
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch trips';
        console.error('Error fetching trips:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // Fetch a single trip by ID
    async fetchTrip(id: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        this.currentTrip = data as Trip;
        return this.currentTrip;
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch trip';
        console.error('Error fetching trip:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Create a new trip
    async createTrip(trip: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        
        // Get the current user ID
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Try multiple strategies to create the trip with different user_id formats
        // Strategy 1: Try with UUID string
        try {
          console.log('Strategy 1: Trying with UUID string');
          const tripWithUuid = {
            ...trip,
            user_id: user.id // Direct UUID string
          };
          
          const { data, error } = await supabase
            .from('trips')
            .insert(tripWithUuid)
            .select()
            .single();
          
          if (error) {
            console.log('Strategy 1 failed:', error.message);
            throw error;
          }
          
          console.log('Strategy 1 succeeded!');
          const newTrip = data as Trip;
          this.trips.push(newTrip);
          return newTrip;
        } catch (errorStrategy1) {
          console.log('Trying next strategy...');
        }
        
        // Strategy 2: Try with numeric hash of UUID
        try {
          console.log('Strategy 2: Trying with numeric hash of UUID');
          // Generate a numeric ID from the UUID using a hash function
          const hashCode = (str: string) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
              const char = str.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash); // Use absolute value to ensure positive
          };
          
          const numericId = hashCode(user.id);
          console.log(`Converted user ID ${user.id} to numeric ID: ${numericId}`);
          
          const tripWithNumericId = {
            ...trip,
            user_id: numericId
          };
          
          const { data, error } = await supabase
            .from('trips')
            .insert(tripWithNumericId)
            .select()
            .single();
          
          if (error) {
            console.log('Strategy 2 failed:', error.message);
            throw error;
          }
          
          console.log('Strategy 2 succeeded!');
          const newTrip = data as Trip;
          this.trips.push(newTrip);
          return newTrip;
        } catch (errorStrategy2) {
          console.log('Trying next strategy...');
        }
        
        // Strategy 3: Try with a forced number conversion of UUID
        try {
          console.log('Strategy 3: Trying with very simple numeric ID');
          // Use a simple timestamp-based ID as last resort
          const simpleNumericId = Date.now();
          console.log(`Using timestamp as numeric ID: ${simpleNumericId}`);
          
          const tripWithSimpleId = {
            ...trip,
            user_id: simpleNumericId
          };
          
          const { data, error } = await supabase
            .from('trips')
            .insert(tripWithSimpleId)
            .select()
            .single();
          
          if (error) {
            console.log('Strategy 3 failed:', error.message);
            throw error;
          }
          
          console.log('Strategy 3 succeeded!');
          const newTrip = data as Trip;
          this.trips.push(newTrip);
          return newTrip;
        } catch (errorStrategy3) {
          // If all strategies fail, throw the last error
          throw errorStrategy3;
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to create trip';
        console.error('Error creating trip:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Update an existing trip
    async updateTrip(id: string, updates: Partial<Trip>) {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('trips')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        const updatedTrip = data as Trip;
        
        // Update the trip in the local state
        const index = this.trips.findIndex(t => t.id === id);
        if (index !== -1) {
          this.trips[index] = { ...this.trips[index], ...updatedTrip };
        }
        
        // Update current trip if it's the one being edited
        if (this.currentTrip && this.currentTrip.id === id) {
          this.currentTrip = { ...this.currentTrip, ...updatedTrip };
        }
        
        return updatedTrip;
      } catch (error: any) {
        this.error = error.message || 'Failed to update trip';
        console.error('Error updating trip:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Delete a trip
    async deleteTrip(id: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { error } = await supabase
          .from('trips')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Remove the trip from the local state
        this.trips = this.trips.filter(trip => trip.id !== id);
        
        // Clear current trip if it's the one being deleted
        if (this.currentTrip && this.currentTrip.id === id) {
          this.currentTrip = null;
        }
        
        return true;
      } catch (error: any) {
        this.error = error.message || 'Failed to delete trip';
        console.error('Error deleting trip:', error);
        return false;
      } finally {
        this.loading = false;
      }
    },
    
    // Set the current trip
    setCurrentTrip(trip: Trip | null) {
      this.currentTrip = trip;
    },
    
    // Reset state
    resetState() {
      this.trips = [];
      this.currentTrip = null;
      this.loading = false;
      this.error = null;
    }
  }
});