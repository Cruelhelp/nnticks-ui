
import { supabase } from '@/lib/supabase';
import { TickData } from '@/types/chartTypes';

class TickService {
  private userId: string | null = null;
  
  setUserId(userId: string | null) {
    this.userId = userId;
  }
  
  async storeTick(tick: TickData) {
    if (!this.userId) return;
    
    try {
      const { error } = await supabase
        .from('ticks')
        .insert({
          timestamp: new Date(tick.timestamp).toISOString(),
          value: tick.value,
          market: tick.market || 'unknown',
          user_id: this.userId
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error storing tick:', error);
    }
  }
  
  async getRecentTicks(market: string, limit: number = 100): Promise<TickData[]> {
    try {
      const { data, error } = await supabase
        .from('ticks')
        .select('*')
        .eq('market', market)
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(tick => ({
        timestamp: new Date(tick.timestamp).getTime(),
        value: Number(tick.value),
        market: tick.market,
        symbol: tick.market
      })).reverse();
    } catch (error) {
      console.error('Error getting ticks:', error);
      return [];
    }
  }
  
  async getTicksInRange(market: string, startTime: Date, endTime: Date): Promise<TickData[]> {
    try {
      const { data, error } = await supabase
        .from('ticks')
        .select('*')
        .eq('market', market)
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(tick => ({
        timestamp: new Date(tick.timestamp).getTime(),
        value: Number(tick.value),
        market: tick.market,
        symbol: tick.market
      }));
    } catch (error) {
      console.error('Error getting ticks in range:', error);
      return [];
    }
  }
  
  async getTickCount(market?: string): Promise<number> {
    try {
      let query = supabase
        .from('ticks')
        .select('*', { count: 'exact', head: true });
      
      if (market) {
        query = query.eq('market', market);
      }
      
      if (this.userId) {
        query = query.eq('user_id', this.userId);
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Error getting tick count:', error);
      return 0;
    }
  }
  
  async clearOldTicks(daysToKeep: number = 7) {
    if (!this.userId) return;
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const { error } = await supabase
        .from('ticks')
        .delete()
        .eq('user_id', this.userId)
        .lt('timestamp', cutoffDate.toISOString());
      
      if (error) throw error;
    } catch (error) {
      console.error('Error clearing old ticks:', error);
    }
  }
}

export const tickService = new TickService();
export default tickService;
