import { defineStore } from 'pinia';
import { MileageRecord } from '~/types';
import { useSupabaseClient } from '#imports';
import { uploadFile } from '~/utils/supabase';
import { processOdometerWithAI } from '~/utils/ai-processing';

export const useMileageStore = defineStore('mileage', {
  state: () => ({
    mileageRecords: [] as MileageRecord[],
    currentMileage: null as MileageRecord | null,
    tripMileage: [] as MileageRecord[],
    loading: false,
    processingImage: false,
    error: null as string | null
  }),
  
  getters: {
    // Get mileage records sorted by date (newest first)
    sortedMileageRecords: (state) => {
      return [...state.mileageRecords].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },
    
    // Get mileage records for a specific trip
    mileageByTrip: (state) => (tripId: string) => {
      return state.mileageRecords.filter(record => record.trip_id === tripId);
    },
    
    // Get total distance for all mileage records
    totalDistance: (state) => {
      return state.mileageRecords.reduce((sum, record) => sum + record.distance, 0);
    },
    
    // Get total distance for a specific trip
    tripTotalDistance: (state) => (tripId: string) => {
      return state.mileageRecords
        .filter(record => record.trip_id === tripId)
        .reduce((sum, record) => sum + record.distance, 0);
    },
    
    // Get mileage record by ID
    getMileageById: (state) => (id: string) => {
      return state.mileageRecords.find(record => record.id === id) || null;
    }
  },
  
  actions: {
    // Fetch all mileage records for the current user
    async fetchMileageRecords() {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('mileage_records')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        this.mileageRecords = data as MileageRecord[];
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch mileage records';
        console.error('Error fetching mileage records:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // Fetch mileage records for a specific trip
    async fetchTripMileage(tripId: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('mileage_records')
          .select('*')
          .eq('trip_id', tripId)
          .order('date', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        this.tripMileage = data as MileageRecord[];
        return this.tripMileage;
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch trip mileage records';
        console.error('Error fetching trip mileage records:', error);
        return [];
      } finally {
        this.loading = false;
      }
    },
    
    // Fetch a single mileage record by ID
    async fetchMileageRecord(id: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('mileage_records')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        this.currentMileage = data as MileageRecord;
        return this.currentMileage;
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch mileage record';
        console.error('Error fetching mileage record:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Create a new mileage record
    async createMileageRecord(
      mileage: Omit<MileageRecord, 'id' | 'user_id' | 'distance' | 'created_at' | 'updated_at'>,
      startImageFile?: File,
      endImageFile?: File
    ) {
      this.loading = true;
      this.error = null;
      
      try {
        let startImageUrl = mileage.image_start_url;
        let endImageUrl = mileage.image_end_url;
        
        // Upload start odometer image if provided
        if (startImageFile) {
          startImageUrl = await uploadFile(
            startImageFile,
            `mileage/${mileage.trip_id}/start`,
            'mileage'
          );
          
          if (!startImageUrl) {
            throw new Error('Failed to upload start odometer image');
          }
        }
        
        // Upload end odometer image if provided
        if (endImageFile) {
          endImageUrl = await uploadFile(
            endImageFile,
            `mileage/${mileage.trip_id}/end`,
            'mileage'
          );
          
          if (!endImageUrl) {
            throw new Error('Failed to upload end odometer image');
          }
        }
        
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('mileage_records')
          .insert({
            ...mileage,
            image_start_url: startImageUrl,
            image_end_url: endImageUrl
          })
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        const newMileage = data as MileageRecord;
        this.mileageRecords.push(newMileage);
        this.tripMileage.push(newMileage);
        return newMileage;
      } catch (error: any) {
        this.error = error.message || 'Failed to create mileage record';
        console.error('Error creating mileage record:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Update an existing mileage record
    async updateMileageRecord(
      id: string,
      updates: Partial<MileageRecord>,
      startImageFile?: File,
      endImageFile?: File
    ) {
      this.loading = true;
      this.error = null;
      
      try {
        let startImageUrl = updates.image_start_url;
        let endImageUrl = updates.image_end_url;
        
        // Get the current mileage record to get the trip_id
        const mileage = this.getMileageById(id);
        if (!mileage) {
          throw new Error('Mileage record not found');
        }
        
        // Upload start odometer image if provided
        if (startImageFile) {
          startImageUrl = await uploadFile(
            startImageFile,
            `mileage/${mileage.trip_id}/start`,
            'mileage'
          );
          
          if (!startImageUrl) {
            throw new Error('Failed to upload start odometer image');
          }
          
          updates.image_start_url = startImageUrl;
        }
        
        // Upload end odometer image if provided
        if (endImageFile) {
          endImageUrl = await uploadFile(
            endImageFile,
            `mileage/${mileage.trip_id}/end`,
            'mileage'
          );
          
          if (!endImageUrl) {
            throw new Error('Failed to upload end odometer image');
          }
          
          updates.image_end_url = endImageUrl;
        }
        
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('mileage_records')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        const updatedMileage = data as MileageRecord;
        
        // Update the mileage record in the local state
        const index = this.mileageRecords.findIndex(m => m.id === id);
        if (index !== -1) {
          this.mileageRecords[index] = { ...this.mileageRecords[index], ...updatedMileage };
        }
        
        // Update trip mileage if it contains the updated record
        const tripIndex = this.tripMileage.findIndex(m => m.id === id);
        if (tripIndex !== -1) {
          this.tripMileage[tripIndex] = { ...this.tripMileage[tripIndex], ...updatedMileage };
        }
        
        // Update current mileage if it's the one being edited
        if (this.currentMileage && this.currentMileage.id === id) {
          this.currentMileage = { ...this.currentMileage, ...updatedMileage };
        }
        
        return updatedMileage;
      } catch (error: any) {
        this.error = error.message || 'Failed to update mileage record';
        console.error('Error updating mileage record:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Delete a mileage record
    async deleteMileageRecord(id: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { error } = await supabase
          .from('mileage_records')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Remove the mileage record from the local state
        this.mileageRecords = this.mileageRecords.filter(record => record.id !== id);
        this.tripMileage = this.tripMileage.filter(record => record.id !== id);
        
        // Clear current mileage if it's the one being deleted
        if (this.currentMileage && this.currentMileage.id === id) {
          this.currentMileage = null;
        }
        
        return true;
      } catch (error: any) {
        this.error = error.message || 'Failed to delete mileage record';
        console.error('Error deleting mileage record:', error);
        return false;
      } finally {
        this.loading = false;
      }
    },
    
    // Process odometer image and extract reading
    async processOdometerImage(imageFile: File) {
      this.processingImage = true;
      this.error = null;
      
      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        
        // Process with AI
        const extractedData = await processOdometerWithAI(base64);
        
        if (!extractedData) {
          throw new Error('Failed to extract reading from odometer image');
        }
        
        return {
          reading: extractedData.reading || 0,
          date: extractedData.date || new Date().toISOString().split('T')[0],
          confidence: extractedData.confidence
        };
      } catch (error: any) {
        this.error = error.message || 'Failed to process odometer image';
        console.error('Error processing odometer image:', error);
        return null;
      } finally {
        this.processingImage = false;
      }
    },
    
    // Set the current mileage record
    setCurrentMileage(mileage: MileageRecord | null) {
      this.currentMileage = mileage;
    },
    
    // Reset state
    resetState() {
      this.mileageRecords = [];
      this.currentMileage = null;
      this.tripMileage = [];
      this.loading = false;
      this.processingImage = false;
      this.error = null;
    }
  }
});