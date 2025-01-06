import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeDate } from '@/utils/dateUtils';

interface AttendanceRecord {
  date: Date;
  presentCount: number;
  totalCount: number;
  presentMembers?: number[];
  presentGuests?: number[];
}

export const useAttendanceData = () => {
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      console.log('Fetching attendance records from Supabase');
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching attendance:', error);
        throw error;
      }

      return data.map((record: any) => ({
        date: new Date(record.date),
        presentCount: record.present_members?.length || 0,
        totalCount: 36, // Total number of members
        presentMembers: record.present_members || [],
        presentGuests: record.present_guests || []
      }));
    }
  });

  const updateAttendance = useMutation({
    mutationFn: async (record: AttendanceRecord) => {
      console.log('Updating attendance record:', record);
      const normalizedDate = normalizeDate(record.date).toISOString();
      
      // First, try to find if a record exists for this date
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('date', normalizedDate)
        .single();

      let result;
      
      if (existingRecord) {
        // If record exists, update it
        result = await supabase
          .from('attendance_records')
          .update({
            present_members: record.presentMembers,
            present_guests: record.presentGuests
          })
          .eq('date', normalizedDate);
      } else {
        // If record doesn't exist, insert new one
        result = await supabase
          .from('attendance_records')
          .insert({
            date: normalizedDate,
            present_members: record.presentMembers,
            present_guests: record.presentGuests
          });
      }

      const { error } = result;
      if (error) {
        console.error('Error updating attendance:', error);
        throw error;
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });

  return {
    history,
    isLoading,
    updateAttendance
  };
};