export function getShiftTimes(shift) {
  const times = {
    morning: { start: '08:00', end: '16:00' },
    middle: { start: '16:00', end: '00:00' },
    night: { start: '00:00', end: '08:00' }
  };
  return times[shift] || times.morning;
}
