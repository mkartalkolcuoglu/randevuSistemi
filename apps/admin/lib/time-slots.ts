/**
 * Generates time slots based on the given interval
 * @param startHour - Start hour (default: 9)
 * @param endHour - End hour (default: 19)
 * @param intervalMinutes - Interval in minutes (default: 30)
 * @returns Array of time strings in HH:MM format
 */
export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 19,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeStr);
      
      // Break if we've reached the end hour
      if (hour === endHour && minute === 0) {
        break;
      }
    }
  }
  
  return slots;
}

