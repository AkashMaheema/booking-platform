// Calculate future dates relative to execution time
const now = new Date();
const addDays = (days: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const bookingsData = [
  { customerName: 'John Doe', customerEmail: 'johndoe@example.com', customerPhone: '1234567890', serviceTitle: 'Haircut', bookingDate: addDays(1), bookingTime: '09:00', status: 'CONFIRMED' },
  { customerName: 'Jane Doe', customerEmail: 'janedoe@example.com', customerPhone: '0987654321', serviceTitle: 'Hair Coloring', bookingDate: addDays(1), bookingTime: '11:00', status: 'PENDING' },
  { customerName: 'Alice Wonderland', customerEmail: 'alice@example.com', customerPhone: '1112223333', serviceTitle: 'Massage Therapy', bookingDate: addDays(2), bookingTime: '10:00', status: 'CONFIRMED' },
  { customerName: 'John Doe', customerEmail: 'johndoe@example.com', customerPhone: '1234567890', serviceTitle: 'Beard Trim', bookingDate: addDays(2), bookingTime: '13:00', status: 'PENDING' },
  { customerName: 'Jane Doe', customerEmail: 'janedoe@example.com', customerPhone: '0987654321', serviceTitle: 'Spa Package', bookingDate: addDays(3), bookingTime: '09:00', status: 'CONFIRMED' },
  { customerName: 'Alice Wonderland', customerEmail: 'alice@example.com', customerPhone: '1112223333', serviceTitle: 'Nail Care', bookingDate: addDays(3), bookingTime: '12:00', status: 'CANCELLED' },
  { customerName: 'John Doe', customerEmail: 'johndoe@example.com', customerPhone: '1234567890', serviceTitle: 'Personal Training', bookingDate: addDays(4), bookingTime: '10:00', status: 'COMPLETED' },
  { customerName: 'Jane Doe', customerEmail: 'janedoe@example.com', customerPhone: '0987654321', serviceTitle: 'Facial Treatment', bookingDate: addDays(4), bookingTime: '14:00', status: 'PENDING' },
  { customerName: 'Alice Wonderland', customerEmail: 'alice@example.com', customerPhone: '1112223333', serviceTitle: 'Makeup Service', bookingDate: addDays(5), bookingTime: '09:00', status: 'CONFIRMED' },
  { customerName: 'John Doe', customerEmail: 'johndoe@example.com', customerPhone: '1234567890', serviceTitle: 'Consultation', bookingDate: addDays(5), bookingTime: '11:00', status: 'COMPLETED' },
  { customerName: 'Jane Doe', customerEmail: 'janedoe@example.com', customerPhone: '0987654321', serviceTitle: 'Haircut', bookingDate: addDays(6), bookingTime: '10:00', status: 'PENDING' },
  { customerName: 'Alice Wonderland', customerEmail: 'alice@example.com', customerPhone: '1112223333', serviceTitle: 'Hair Coloring', bookingDate: addDays(6), bookingTime: '13:00', status: 'CONFIRMED' },
  { customerName: 'John Doe', customerEmail: 'johndoe@example.com', customerPhone: '1234567890', serviceTitle: 'Massage Therapy', bookingDate: addDays(7), bookingTime: '09:00', status: 'CANCELLED' },
  { customerName: 'Jane Doe', customerEmail: 'janedoe@example.com', customerPhone: '0987654321', serviceTitle: 'Beard Trim', bookingDate: addDays(7), bookingTime: '12:00', status: 'PENDING' },
  { customerName: 'Alice Wonderland', customerEmail: 'alice@example.com', customerPhone: '1112223333', serviceTitle: 'Spa Package', bookingDate: addDays(8), bookingTime: '10:00', status: 'CONFIRMED' },
  { customerName: 'John Doe', customerEmail: 'johndoe@example.com', customerPhone: '1234567890', serviceTitle: 'Nail Care', bookingDate: addDays(8), bookingTime: '14:00', status: 'PENDING' },
  { customerName: 'Jane Doe', customerEmail: 'janedoe@example.com', customerPhone: '0987654321', serviceTitle: 'Personal Training', bookingDate: addDays(9), bookingTime: '11:00', status: 'CONFIRMED' },
  { customerName: 'Alice Wonderland', customerEmail: 'alice@example.com', customerPhone: '1112223333', serviceTitle: 'Facial Treatment', bookingDate: addDays(9), bookingTime: '15:00', status: 'COMPLETED' },
  { customerName: 'John Doe', customerEmail: 'johndoe@example.com', customerPhone: '1234567890', serviceTitle: 'Makeup Service', bookingDate: addDays(10), bookingTime: '09:00', status: 'PENDING' },
  { customerName: 'Jane Doe', customerEmail: 'janedoe@example.com', customerPhone: '0987654321', serviceTitle: 'Consultation', bookingDate: addDays(10), bookingTime: '12:00', status: 'CONFIRMED' },
];
