import React, { useState, useEffect } from 'react';
import { User, Mail, Package, Clock, CheckCircle, XCircle, AlertCircle, Phone, Calendar, Waves } from 'lucide-react';
import apiRequest from '../core/axios';
import Swal from 'sweetalert2';
import { useAuth } from '../components/AuthProvider';
import { getCookie, AUTH_TOKEN_KEY } from '../utils/cookieUtils';
import Avatar from '../components/Avatar';
import type { AuthUser } from '../redux/authSlice';

// --- Interfaces for Typing ---
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface UserProfile extends AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

// 🛑 MODIFIED INTERFACE: Added optional startDate and expiryDate
interface PackageActivation {
  _id: string;
  packageName: string;
  status: 'Pending' | 'Contacted' | 'Confirmed' | 'Rejected';
  preferredDate: string;
  createdAt: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  message?: string;
    // 🆕 NEW: startDate and expiryDate fields are included here
    startDate?: string;
    expiryDate?: string;
  packageId: {
    name: string;
    duration: string;
    sessions: number;
    totalPrice: number;
  };
}

interface Appointment {
  _id: string;
  reservationId: string; // Added field
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  status: 'pending' | 'confirmed' | 'canceled' | 'completed'; // Matches controller output
  name: string;
  contactNumber: string;
  specialNote?: string;
  isPackageUser: boolean; 
  createdAt: string;
}

const COLORS = {
  primary: "#0873A1",    // Dark Blue
  darkest: "#035C84",    // Deep Navy
  medium: "#2DA0CC",     // Medium Blue
  light: "#94CCE7",      // Sky Blue
  white: "#FFFFFF",
  bgLight: "#F8FAFC",    // Page background
  grayBorder: "#E2E8F0", 
  grayText: "#64748B",
  success: "#10B981",    
  warning: "#F59E0B",
  error: "#EF4444",
};

const UserProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [packages, setPackages] = useState<PackageActivation[]>([]);
  const [reservations, setReservations] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'reservations'>('packages');

  useEffect(() => {
    fetchProfile();
    fetchMyPackages();
    fetchMyReservations();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = getCookie(AUTH_TOKEN_KEY);
      
      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Required',
          text: 'Please log in to access this page',
        });
        return;
      }

      const response: ApiResponse<UserProfile> = await apiRequest.get('/users/me');
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to fetch profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPackages = async () => {
    try {
      const response: ApiResponse<PackageActivation[]> = await apiRequest.get('/users/me/packages');
      if (response.success) {
        setPackages(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchMyReservations = async () => {
    try {
      const response: ApiResponse<Appointment[]> = await apiRequest.get('/appointments/me');
      if (response.success) {
        setReservations(response.data); 
      }
    } catch (error: any) {
      console.error('Error fetching reservations:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to fetch reservations',
      });
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

// 1. Updated getStatusIcon to use your theme's 'grayText'
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'completed':
      return <CheckCircle className="w-5 h-5" style={{ color: COLORS.success }} />;
    case 'pending':
      return <Clock className="w-5 h-5" style={{ color: COLORS.warning }} />;
    case 'contacted':
      return <Phone className="w-5 h-5" style={{ color: COLORS.primary }} />;
    case 'rejected':
    case 'canceled':
      return <XCircle className="w-5 h-5" style={{ color: COLORS.error }} />;
    default:
      // Replaced gray600 with grayText
      return <AlertCircle className="w-5 h-5" style={{ color: COLORS.grayText }} />;
  }
};

// 2. Updated getStatusColor mapping
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'completed': return COLORS.success;
    case 'pending': return COLORS.warning;
    case 'contacted': return COLORS.primary;
    case 'rejected':
    case 'canceled': return COLORS.error;
    default: return COLORS.grayText; // Replaced gray600
  }
};

// 3. Updated Loading State colors
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bgLight }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4" style={{ borderColor: COLORS.primary }}></div>
        <p className="text-xl font-bold" style={{ color: COLORS.grayText }}>Loading profile...</p>
      </div>
    </div>
  );
}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bgLight }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4" style={{ borderColor: COLORS.primary }}></div>
          <p className="text-xl font-bold" style={{ color: COLORS.primary }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12" style={{ backgroundColor: COLORS.bgLight }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Page Header Area */}
        <div className="mb-8 flex items-center gap-4">
           <div className="p-3 rounded-2xl shadow-lg" style={{ backgroundColor: COLORS.darkest }}>
              <Waves className="w-8 h-8 text-white" />
           </div>
           <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: COLORS.darkest }}>My Account</h1>
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.medium }}>Floating Theraphy Member Portal</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Profile Side */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl border-2 shadow-xl p-8 sticky top-28 overflow-hidden" style={{ backgroundColor: COLORS.white, borderColor: `${COLORS.light}30` }}>
              <div className="text-center relative z-10">
                <div className="inline-block p-1 rounded-full border-4 mb-6" style={{ borderColor: COLORS.light }}>
                  <Avatar
                    src={profile?.profileImage}
                    name={profile?.name}
                    size="xl"
                    fallbackColor={COLORS.primary}
                  />
                </div>
                
                <h2 className="text-2xl font-black mb-1" style={{ color: COLORS.darkest }}>
                  {profile?.name || authUser?.name}
                </h2>
                
                <div className="flex items-center justify-center gap-2 mb-6 text-sm font-medium" style={{ color: COLORS.grayText }}>
                  <Mail className="w-4 h-4" />
                  {profile?.email || authUser?.email}
                </div>

                <span
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm"
                  style={{
                    backgroundColor: profile?.role === 'admin' ? `${COLORS.darkest}15` : `${COLORS.primary}15`,
                    color: profile?.role === 'admin' ? COLORS.darkest : COLORS.primary,
                  }}
                >
                  <User className="w-4 h-4" />
                  {profile?.role || 'client'}
                </span>

                <div className="mt-8 pt-8 border-t-2" style={{ borderColor: `${COLORS.light}20` }}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold uppercase tracking-tighter" style={{ color: COLORS.grayText }}>Member Since</span>
                      <span className="text-sm font-black" style={{ color: COLORS.darkest }}>
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-sky-50 p-3 rounded-xl border border-sky-100">
                      <span className="text-xs font-bold uppercase tracking-tighter" style={{ color: COLORS.grayText }}>Active Packages</span>
                      <span className="text-sm font-black" style={{ color: COLORS.primary }}>
                        {packages.filter(p => p.status === 'Confirmed').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tabbed Content */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border-2 shadow-sm p-2" style={{ backgroundColor: COLORS.white, borderColor: `${COLORS.light}30` }}>
              
              <div className="flex p-2 bg-slate-100/50 rounded-2xl mb-4">
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all"
                  style={{ 
                    backgroundColor: activeTab === 'packages' ? COLORS.primary : 'transparent', 
                    color: activeTab === 'packages' ? COLORS.white : COLORS.grayText,
                  }}
                  onClick={() => setActiveTab('packages')}
                >
                  <Package className="w-4 h-4" />
                  Packages
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all"
                  style={{ 
                    backgroundColor: activeTab === 'reservations' ? COLORS.primary : 'transparent', 
                    color: activeTab === 'reservations' ? COLORS.white : COLORS.grayText,
                  }}
                  onClick={() => setActiveTab('reservations')}
                >
                  <Calendar className="w-4 h-4" />
                  Reservations
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[700px]">
                {activeTab === 'packages' ? (
                  packages.length === 0 ? (
                    <div className="text-center py-16">
                      <Package className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: COLORS.primary }} />
                      <p className="font-bold" style={{ color: COLORS.grayText }}>No active packages found.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {packages.map((pkg) => (
                        <div key={pkg._id} className="border-2 rounded-2xl p-6 transition-all hover:border-sky-300" style={{ borderColor: COLORS.grayBorder }}>
                          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                            <div>
                              <h4 className="text-xl font-black mb-1" style={{ color: COLORS.darkest }}>{pkg.packageName}</h4>
                              <p className="text-xs font-black uppercase tracking-widest" style={{ color: COLORS.medium }}>{pkg.packageId?.sessions} Sessions Total</p>
                            </div>
                            <div className="flex items-center gap-2 self-start md:self-center bg-slate-50 px-3 py-1.5 rounded-lg border">
                              {getStatusIcon(pkg.status)}
                              <span className="text-xs font-black uppercase tracking-tighter" style={{ color: getStatusColor(pkg.status) }}>{pkg.status}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 border-t border-slate-100">
                             {/* 🛑 Start/Expiry Logic Re-integrated */}
                             {pkg.status === 'Confirmed' && pkg.startDate && pkg.expiryDate ? (
                               <>
                                 <div>
                                   <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Start Date</p>
                                   <p className="text-sm font-bold" style={{ color: COLORS.success }}>{formatDate(pkg.startDate)}</p>
                                 </div>
                                 <div>
                                   <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Expiry Date</p>
                                   <p className="text-sm font-bold" style={{ color: COLORS.error }}>{formatDate(pkg.expiryDate)}</p>
                                 </div>
                               </>
                             ) : (
                               <div>
                                 <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Requested On</p>
                                 <p className="text-sm font-bold" style={{ color: COLORS.darkest }}>{formatDate(pkg.createdAt)}</p>
                               </div>
                             )}
                             <div>
                               <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Price Paid</p>
                               <p className="text-sm font-bold" style={{ color: COLORS.primary }}>Rs. {pkg.packageId?.totalPrice.toLocaleString()}</p>
                             </div>
                          </div>

                          {/* Status Messages */}
                          {pkg.status === 'Pending' && (
                            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${COLORS.warning}10` }}>
                              <p className="text-xs font-bold flex items-center gap-2" style={{ color: COLORS.warning }}>
                                <Clock className="w-4 h-4" /> Your request is pending review.
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  /* Reservations logic similarly restored ... */
                  <div className="space-y-4">
                    {reservations.map((res) => (
                      <div key={res._id} className="border-2 rounded-2xl p-5 hover:border-sky-300 transition-all flex justify-between items-center" style={{ borderColor: COLORS.grayBorder }}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${getStatusColor(res.status)}15` }}>
                            <Calendar className="w-6 h-6" style={{ color: getStatusColor(res.status) }} />
                          </div>
                          <div>
                            <h4 className="font-black text-lg" style={{ color: COLORS.darkest }}>#{res.reservationId}</h4>
                            <p className="text-xs font-bold text-slate-400">{new Date(res.date).toLocaleDateString()} • {res.time}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase px-3 py-1 rounded-md border" style={{ borderColor: getStatusColor(res.status), color: getStatusColor(res.status) }}>
                          {res.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;