-- Fix attendance date: change from 2025-10-22 to 2025-11-19
UPDATE attendance_records 
SET date = '2025-11-19', updated_at = now()
WHERE id = '2259b2fb-8552-48b1-b328-6e41dbb5b2a8' 
  AND date = '2025-10-22';