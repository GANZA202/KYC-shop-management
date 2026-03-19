import { supabase } from '../lib/supabase';
import { Sector } from '../types/database';

export const sectorService = {
  async getSectors() {
    return await supabase
      .from('sectors')
      .select('*')
      .order('name');
  },

  async createSector(sector: Partial<Sector>) {
    return await supabase
      .from('sectors')
      .insert([sector])
      .select()
      .single();
  },

  async updateSector(id: string, sector: Partial<Sector>) {
    return await supabase
      .from('sectors')
      .update(sector)
      .eq('id', id)
      .select()
      .single();
  },

  async deleteSector(id: string) {
    return await supabase
      .from('sectors')
      .delete()
      .eq('id', id);
  }
};
