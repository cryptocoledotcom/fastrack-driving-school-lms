export const formatTime24to12 = (time24) => {
  if (!time24 || typeof time24 !== 'string') return time24;
  
  const [hours, minutes] = time24.split(':');
  let hour = parseInt(hours, 10);
  const minute = minutes;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  
  if (hour > 12) {
    hour -= 12;
  } else if (hour === 0) {
    hour = 12;
  }
  
  return `${hour}:${minute} ${ampm}`;
};

export const parseLocalDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const [year, month, day] = parts;
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  
  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) return null;
  
  return new Date(yearNum, monthNum - 1, dayNum);
};

export const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  
  const date = parseLocalDate(dateString);
  if (!date) return dateString;
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};
