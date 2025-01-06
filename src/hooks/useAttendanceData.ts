import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeDate, generateWednesdayDates } from '@/utils/dateUtils';

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

      // Generate all Wednesday dates between Sep 4, 2024 and Jun 25, 2025
      const startDate = new Date('2024-09-04');
      const endDate = new Date('2025-06-25');
      const allWednesdays = generateWednesdayDates(startDate, endDate);
      
      console.log('Generated Wednesday dates:', allWednesdays);

      // Convert database records to map for easy lookup
      const recordsMap = new Map(
        data.map((record: any) => [
          record.date,
          {
            date: new Date(record.date),
            presentCount: record.present_members?.length || 0,
            totalCount: 36,
            presentMembers: record.present_members || [],
            presentGuests: record.present_guests || []
          }
        ])
      );

      // Create records for all Wednesdays, using existing data if available
      return allWednesdays.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        return recordsMap.get(dateStr) || {
          date,
          presentCount: 0,
          totalCount: 36,
          presentMembers: [],
          presentGuests: []
        };
      });
    }
  });

  const updateAttendance = useMutation({
    mutationFn: async (record: AttendanceRecord) => {
      console.log('Updating attendance record:', record);
      const normalizedDate = normalizeDate(record.date);
      console.log('Normalized date:', normalizedDate);
      
      // First, try to find if a record exists for this date
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('date', normalizedDate.toISOString().split('T')[0])
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
          .eq('date', normalizedDate.toISOString().split('T')[0]);
      } else {
        // If record doesn't exist, insert new one
        result = await supabase
          .from('attendance_records')
          .insert({
            date: normalizedDate.toISOString().split('T')[0],
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