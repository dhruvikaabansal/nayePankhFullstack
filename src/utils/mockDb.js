// High-fidelity Mock Database using LocalStorage for the NayePankh Volunteer Registration System.
// This allows immediate portfolio evaluation without requiring Supabase credentials setup first.

const MOCK_VOLUNTEERS_KEY = 'nayepankh_volunteers';
const SESSION_KEY = 'nayepankh_admin_session';

const SEED_DATA = [
  {
    id: 'vol-1',
    full_name: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    phone: '+91 98765 43210',
    city: 'New Delhi',
    causes: ['Food Drives', 'Clothing Distribution'],
    availability: 'Weekends',
    hours_per_week: 6,
    skills: 'Event management, coordination, public speaking.',
    status: 'Active',
    registered_at: '2026-03-10T10:15:30.000Z'
  },
  {
    id: 'vol-2',
    full_name: 'Diya Patel',
    email: 'diya.patel@yahoo.com',
    phone: '+91 91234 56789',
    city: 'Mumbai',
    causes: ['Menstrual Hygiene Awareness', 'Education'],
    availability: 'Both',
    hours_per_week: 10,
    skills: 'Trained educator, social work experience, content creation.',
    status: 'Active',
    registered_at: '2026-03-24T14:30:00.000Z'
  },
  {
    id: 'vol-3',
    full_name: 'Rahul Verma',
    email: 'rahul.verma@outlook.com',
    phone: '+91 98111 22233',
    city: 'Lucknow',
    causes: ['Food Drives'],
    availability: 'Weekdays',
    hours_per_week: 4,
    skills: 'Logistics, driving, local community network.',
    status: 'Approved',
    registered_at: '2026-04-05T09:00:00.000Z'
  },
  {
    id: 'vol-4',
    full_name: 'Ananya Iyer',
    email: 'ananya.iyer@gmail.com',
    phone: '+91 94440 55566',
    city: 'Bengaluru',
    causes: ['Education'],
    availability: 'Weekends',
    hours_per_week: 8,
    skills: 'Teaching Mathematics, English tutoring, mentoring kids.',
    status: 'Pending',
    registered_at: '2026-06-12T16:45:00.000Z'
  },
  {
    id: 'vol-5',
    full_name: 'Kabir Mehta',
    email: 'kabir.mehta@gmail.com',
    phone: '+91 99887 76655',
    city: 'Pune',
    causes: ['Clothing Distribution', 'Food Drives'],
    availability: 'Both',
    hours_per_week: 12,
    skills: 'Inventory management, sorting, drives management.',
    status: 'Active',
    registered_at: '2026-04-18T11:20:00.000Z'
  },
  {
    id: 'vol-6',
    full_name: 'Sneha Reddy',
    email: 'sneha.reddy@gmail.com',
    phone: '+91 88877 66554',
    city: 'Hyderabad',
    causes: ['Menstrual Hygiene Awareness'],
    availability: 'Weekdays',
    hours_per_week: 5,
    skills: 'Public health student, research, conducting workshops.',
    status: 'Pending',
    registered_at: '2026-06-14T08:10:00.000Z'
  },
  {
    id: 'vol-7',
    full_name: 'Rohan Gupta',
    email: 'rohan.gupta@gmail.com',
    phone: '+91 90000 11122',
    city: 'Lucknow',
    causes: ['Food Drives', 'Education'],
    availability: 'Weekends',
    hours_per_week: 6,
    skills: 'Photography, social media marketing, local outreach.',
    status: 'Inactive',
    registered_at: '2026-03-02T13:00:00.000Z'
  },
  {
    id: 'vol-8',
    full_name: 'Meera Nair',
    email: 'meera.nair@gmail.com',
    phone: '+91 93333 44455',
    city: 'Kochi',
    causes: ['Education', 'Menstrual Hygiene Awareness'],
    availability: 'Both',
    hours_per_week: 15,
    skills: 'Counseling, mental health advocate, teaching.',
    status: 'Active',
    registered_at: '2026-05-15T10:00:00.000Z'
  },
  {
    id: 'vol-9',
    full_name: 'Vikram Singh',
    email: 'vikram.singh@gmail.com',
    phone: '+91 97777 88899',
    city: 'Jaipur',
    causes: ['Clothing Distribution'],
    availability: 'Weekdays',
    hours_per_week: 5,
    skills: 'Coordination, logistics planning.',
    status: 'Approved',
    registered_at: '2026-05-22T15:30:00.000Z'
  },
  {
    id: 'vol-10',
    full_name: 'Pooja Choudhury',
    email: 'pooja.c@gmail.com',
    phone: '+91 96666 77788',
    city: 'Kolkata',
    causes: ['Menstrual Hygiene Awareness'],
    availability: 'Weekends',
    hours_per_week: 8,
    skills: 'Medical student, health awareness advocacy.',
    status: 'Pending',
    registered_at: '2026-06-10T12:00:00.000Z'
  },
  {
    id: 'vol-11',
    full_name: 'Arjun Das',
    email: 'arjun.das@gmail.com',
    phone: '+91 95555 66677',
    city: 'Guwahati',
    causes: ['Food Drives'],
    availability: 'Weekdays',
    hours_per_week: 6,
    skills: 'Community liaison, logistics support.',
    status: 'Active',
    registered_at: '2026-05-02T11:15:00.000Z'
  },
  {
    id: 'vol-12',
    full_name: 'Neha Kapoor',
    email: 'neha.kapoor@gmail.com',
    phone: '+91 92222 33344',
    city: 'New Delhi',
    causes: ['Education', 'Clothing Distribution'],
    availability: 'Both',
    hours_per_week: 10,
    skills: 'Primary school teacher, art & craft specialist.',
    status: 'Inactive',
    registered_at: '2026-04-28T09:40:00.000Z'
  }
];

export const mockDb = {
  // Initialize Database
  init() {
    const stored = localStorage.getItem(MOCK_VOLUNTEERS_KEY);
    if (!stored) {
      localStorage.setItem(MOCK_VOLUNTEERS_KEY, JSON.stringify(SEED_DATA));
    }
  },

  // Get all volunteers
  getVolunteers() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(MOCK_VOLUNTEERS_KEY)) || [];
    } catch (e) {
      console.error('Error reading mock database', e);
      return [];
    }
  },

  // Save volunteers list
  saveVolunteers(list) {
    localStorage.setItem(MOCK_VOLUNTEERS_KEY, JSON.stringify(list));
  },

  // Add a new volunteer with email duplicate verification
  addVolunteer(volunteerData) {
    this.init();
    const volunteers = this.getVolunteers();
    
    // Validate email duplicate
    const exists = volunteers.some(
      v => v.email.trim().toLowerCase() === volunteerData.email.trim().toLowerCase()
    );
    
    if (exists) {
      throw new Error('A volunteer with this email address has already registered.');
    }

    const newVolunteer = {
      id: `vol-${Date.now()}`,
      full_name: volunteerData.full_name,
      email: volunteerData.email,
      phone: volunteerData.phone,
      city: volunteerData.city,
      causes: volunteerData.causes || [],
      availability: volunteerData.availability,
      hours_per_week: parseInt(volunteerData.hours_per_week) || 0,
      skills: volunteerData.skills || '',
      status: 'Pending', // Starts as pending
      registered_at: new Date().toISOString()
    };

    volunteers.push(newVolunteer);
    this.saveVolunteers(volunteers);
    return newVolunteer;
  },

  // Transition volunteer status in the pipeline
  updateVolunteerStatus(id, newStatus) {
    const validStatuses = ['Pending', 'Approved', 'Active', 'Inactive'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const volunteers = this.getVolunteers();
    const index = volunteers.findIndex(v => v.id === id);
    if (index === -1) {
      throw new Error('Volunteer not found');
    }

    volunteers[index].status = newStatus;
    this.saveVolunteers(volunteers);
    return volunteers[index];
  },

  // Simulate Supabase login
  login(email, password) {
    if (email === 'admin@nayepankh.org' && password === 'admin123') {
      const session = {
        user: { email, role: 'admin' },
        expires_at: Date.now() + 3600000 // 1 hour
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { data: { session }, error: null };
    }
    return { data: { session: null }, error: { message: 'Invalid credentials. Use admin@nayepankh.org / admin123' } };
  },

  // Simulate get session
  getSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return { data: { session: null }, error: null };
      
      const session = JSON.parse(stored);
      if (Date.now() > session.expires_at) {
        this.logout();
        return { data: { session: null }, error: null };
      }
      return { data: { session }, error: null };
    } catch (e) {
      return { data: { session: null }, error: null };
    }
  },

  // Simulate logout
  logout() {
    localStorage.removeItem(SESSION_KEY);
    return { error: null };
  }
};
