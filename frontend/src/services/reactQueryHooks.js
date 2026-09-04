import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Fetch all events
export const useEvents = (params = {}) => {
  return useQuery({
    queryKey: ['events', params],
    queryFn: async () => {
      const res = await api.get('/events', { params });
      return res.data;
    }
  });
};

// Fetch single event by slug or ID
export const useEventDetail = (slugOrId) => {
  return useQuery({
    queryKey: ['event', slugOrId],
    queryFn: async () => {
      const res = await api.get(`/events/${slugOrId}`);
      return res.data;
    },
    enabled: Boolean(slugOrId)
  });
};

// Fetch all categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.categories;
    }
  });
};

// Fetch user's bookings
export const useMyBookings = () => {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await api.get('/bookings/my');
      return res.data.bookings;
    }
  });
};

// Fetch organizer dashboard data
export const useOrganizerDash = () => {
  return useQuery({
    queryKey: ['organizer-dash'],
    queryFn: async () => {
      const res = await api.get('/dashboard/organizer');
      return res.data.data;
    }
  });
};

// Fetch admin dashboard data
export const useAdminDash = () => {
  return useQuery({
    queryKey: ['admin-dash'],
    queryFn: async () => {
      const res = await api.get('/dashboard/admin');
      return res.data.data;
    }
  });
};

// Create booking mutation
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingData) => {
      const res = await api.post('/bookings', bookingData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });
};
