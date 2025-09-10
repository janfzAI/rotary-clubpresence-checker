
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeDate, generateWednesdayDates, RotaryYear } from '@/utils/dateUtils';

interface AttendanceRecord {
  date: Date;
  presentCount: number;
  totalCount: number;
  presentMembers?: number[];
  presentGuests?: number[];
}

export const useAttendanceData = (rotaryYear: RotaryYear) => {
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['attendance', rotaryYear],
    queryFn: async () => {
      console.log('Fetching attendance records from Supabase for year:', rotaryYear);
      const { data: supabaseData, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching attendance:', error);
        throw error;
      }

      console.log('Fetched data from Supabase:', supabaseData);

      // Generate all Wednesday dates for the selected rotary year
      const allWednesdays = generateWednesdayDates(rotaryYear);
      
      console.log('Generated Wednesday dates:', allWednesdays);

      // Convert database records to map for easy lookup
      const recordsMap = new Map(
        supabaseData.map((record: any) => [
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
        const existingRecord = recordsMap.get(dateStr);
        
        if (existingRecord) {
          return {
            ...existingRecord,
            date: new Date(existingRecord.date) // Upewnij się, że data jest obiektem Date
          };
        }
        
        return {
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
      
      const dateStr = normalizedDate.toISOString().split('T')[0];
      const recordData = {
        date: dateStr,
        present_members: record.presentMembers,
        present_guests: record.presentGuests,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      console.log('Sending data to Supabase:', recordData);

      // First try to update
      const { data: updateData, error: updateError } = await supabase
        .from('attendance_records')
        .update(recordData)
        .eq('date', dateStr)
        .select();

      // If no rows were updated, insert new record
      if (!updateError && (!updateData || updateData.length === 0)) {
        console.log('No existing record found, inserting new one');
        const { data: insertData, error: insertError } = await supabase
          .from('attendance_records')
          .insert([recordData])
          .select();

        if (insertError) throw insertError;
        return insertData;
      }

      if (updateError) throw updateError;
      return updateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', rotaryYear] });
    },
    onError: (error) => {
      console.error('Error in updateAttendance mutation:', error);
    }
  });

  return {
    history,
    isLoading,
    updateAttendance
  };
};
