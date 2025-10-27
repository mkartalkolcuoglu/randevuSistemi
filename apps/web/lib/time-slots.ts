/**
 * Generates time slots based on the given interval
 * @param startHour - Start hour (default: 9)
 * @param endHour - End hour (default: 17)
 * @param intervalMinutes - Interval in minutes (default: 30)
 * @returns Array of time strings in HH:MM format
 */
export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 17,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      // Skip lunch break (12:00-12:59)
      if (hour === 12) continue;
      
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeStr);
      
      // Break if we've reached the end of the day
      if (hour === endHour && minute === 0) {
        break;
      }
    }
  }
  
  return slots;
}

/**
 * Working hours data structure
 */
export interface WorkingHours {
  monday?: { start: string; end: string; closed: boolean };
  tuesday?: { start: string; end: string; closed: boolean };
  wednesday?: { start: string; end: string; closed: boolean };
  thursday?: { start: string; end: string; closed: boolean };
  friday?: { start: string; end: string; closed: boolean };
  saturday?: { start: string; end: string; closed: boolean };
  sunday?: { start: string; end: string; closed: boolean };
}

/**
 * Parses working hours from JSON string or object
 */
export function parseWorkingHours(workingHours: string | WorkingHours | null | undefined): WorkingHours {
  if (!workingHours) {
    return getDefaultWorkingHours();
  }

  if (typeof workingHours === 'string') {
    try {
      return JSON.parse(workingHours);
    } catch {
      return getDefaultWorkingHours();
    }
  }

  return workingHours;
}

/**
 * Gets default working hours (9-18, Sunday closed)
 */
export function getDefaultWorkingHours(): WorkingHours {
  return {
    monday: { start: '09:00', end: '18:00', closed: false },
    tuesday: { start: '09:00', end: '18:00', closed: false },
    wednesday: { start: '09:00', end: '18:00', closed: false },
    thursday: { start: '09:00', end: '18:00', closed: false },
    friday: { start: '09:00', end: '18:00', closed: false },
    saturday: { start: '09:00', end: '17:00', closed: false },
    sunday: { start: '10:00', end: '16:00', closed: true }
  };
}

/**
 * Gets working hours for a specific day
 * @param date - Date string in YYYY-MM-DD format
 * @param workingHours - Working hours object
 * @returns Working hours for that day, or null if closed
 */
export function getWorkingHoursForDay(date: string, workingHours: WorkingHours): { start: string; end: string } | null {
  const dayOfWeek = new Date(date + 'T00:00:00').getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const dayMap: { [key: number]: keyof WorkingHours } = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  };
  
  const dayKey = dayMap[dayOfWeek];
  const dayHours = workingHours[dayKey];
  
  if (!dayHours || dayHours.closed) {
    return null; // Closed
  }
  
  return {
    start: dayHours.start,
    end: dayHours.end
  };
}

/**
 * Checks if a date is a working day
 */
export function isWorkingDay(date: string, workingHours: WorkingHours): boolean {
  return getWorkingHoursForDay(date, workingHours) !== null;
}

