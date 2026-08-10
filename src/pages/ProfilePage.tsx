// src/pages/ProfilePage.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { User, MapPin, Shield, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

// --- LEAFLET IMPORTS ---
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // استایل‌های نقشه

// رفع مشکل لود نشدن آیکون پیش‌فرض Leaflet در Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// ======================================================
// MAP SELECTOR COMPONENT (نقشه تعاملی)
// ======================================================
function MapSelector({ position, setPosition, onLocationChange }: any) {
  const markerRef = useRef<any>(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition(newPos);
          onLocationChange(newPos.lat, newPos.lng);
        }
      },
    }),
    [setPosition, onLocationChange]
  );

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    ></Marker>
  );
}

// ======================================================
// SCHEMAS
// ======================================================
const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone_number: z.string().optional(),
});

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirm: z.string(),
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: 'Passwords do not match',
  path: ['new_password_confirm'],
});

const addressSchema = z.object({
  title: z.string().min(1, 'Title is required (e.g., Home, Work)'),
  state: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  full_address: z.string().min(5, 'Full address is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  receiver_name: z.string().optional(),
  receiver_phone: z.string().optional(),
  is_default: z.boolean().default(false),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// ======================================================
// TYPES
// ======================================================
type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type AddressFormInput = z.input<typeof addressSchema>;
type AddressFormOutput = z.output<typeof addressSchema>;

// ======================================================
// MAIN COMPONENT
// ======================================================
export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'security'>('info');
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // استیت‌های مربوط به نقشه
  const [mapPosition, setMapPosition] = useState<any>({ lat: 35.6892, lng: 51.3890 }); // دیفالت: تهران
  const [isGettingAddress, setIsGettingAddress] = useState(false);

  // --- QUERIES ---
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/users/profile/');
      return response.data;
    },
  });

  const { data: addresses, isLoading: isAddressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await api.get('/users/addresses/');
      return response.data.results || response.data;
    },
  });

  // --- FORMS ---
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const addressForm = useForm<AddressFormInput, unknown, AddressFormOutput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: '', state: '', city: '', full_address: '', postal_code: '',
      receiver_name: '', receiver_phone: '', is_default: false,
    },
  });

  // --- REVERSE GEOCODING LOGIC ---
  const handleLocationChange = async (lat: number, lng: number) => {
    addressForm.setValue('lat', lat);
    addressForm.setValue('lng', lng);
    
    try {
      setIsGettingAddress(true);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      const { address } = response.data;
      if (address) {
        if (address.city || address.town || address.county) {
          addressForm.setValue('city', address.city || address.town || address.county || '');
        }
        if (address.state) {
          addressForm.setValue('state', address.state || '');
        }
        addressForm.setValue('full_address', response.data.display_name || '');
      }
    } catch (error) {
      console.error("Geocoding failed", error);
    } finally {
      setIsGettingAddress(false);
    }
  };

  // --- PROFILE RESET ---
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone_number: profile.phone_number || '',
      });
    }
  }, [profile, profileForm]);

  // --- MUTATIONS ---
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.patch('/users/profile/', data);
      return response.data;
    },
    onSuccess: () => {
      alert('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => alert('Failed to update profile.'),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await api.post('/users/change-password/', data);
      return response.data;
    },
    onSuccess: () => {
      alert('Password changed successfully!');
      passwordForm.reset();
    },
    onError: (error: any) => {
      alert(error.response?.data?.old_password?.[0] || 'Failed to change password.');
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: async (data: AddressFormOutput) => {
      const response = await api.post('/users/addresses/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowAddressForm(false);
      addressForm.reset();
    },
    onError: (error: any) => {
      console.error('Add Address Error:', error.response?.data);
      alert('Failed to add address.');
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/users/addresses/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  // --- LOADING ---
  if (isProfileLoading) {
    return <div className="p-8 text-center text-gray-500">Loading your profile...</div>;
  }

  // --- RENDER ---
  return (
    <div className="bg-gray-50 min-h-[85vh] py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Account</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* SIDEBAR */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <nav className="flex flex-col">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold transition-colors border-l-4 ${
                    activeTab === 'info' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <User size={18} /> Personal Info
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold transition-colors border-l-4 ${
                    activeTab === 'addresses' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MapPin size={18} /> My Addresses
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold transition-colors border-l-4 ${
                    activeTab === 'security' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Shield size={18} /> Security & Password
                </button>
              </nav>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            
            {/* TAB 1 - PERSONAL INFO */}
            {activeTab === 'info' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Personal Information</h2>
                <div className="mb-8 flex bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Email Address</p>
                    <p className="font-bold text-gray-900 mt-1">{profile?.email}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Username</p>
                    <p className="font-bold text-gray-900 mt-1">{profile?.username}</p>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        {...profileForm.register('first_name')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      {profileForm.formState.errors.first_name && (
                        <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.first_name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        {...profileForm.register('last_name')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      {profileForm.formState.errors.last_name && (
                        <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.last_name.message}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        {...profileForm.register('phone_number')}
                        placeholder="e.g. 09123456789"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={!profileForm.formState.isDirty || updateProfileMutation.isPending}
                      className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2 - ADDRESSES */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <Plus size={16} /> Add New
                    </button>
                  )}
                </div>

                {showAddressForm ? (
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
                    <h3 className="font-bold text-gray-800 mb-4">Add a new delivery address</h3>
                    
                    {/* نقشه اینجاست */}
                    <div className="mb-6 relative z-0 border-2 border-gray-200 rounded-xl overflow-hidden h-64 shadow-sm">
                      <MapContainer 
                        center={[35.6892, 51.3890]} 
                        zoom={13} 
                        scrollWheelZoom={true} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; OpenStreetMap contributors'
                        />
                        <MapSelector 
                          position={mapPosition} 
                          setPosition={setMapPosition} 
                          onLocationChange={handleLocationChange} 
                        />
                      </MapContainer>
                      <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-blue-600 border border-blue-100">
                        Click or drag the pin to set location
                      </div>
                    </div>

                    <form onSubmit={addressForm.handleSubmit((data) => addAddressMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Title (e.g. Home, Office)</label>
                          <input
                            {...addressForm.register('title')}
                            className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                          {addressForm.formState.errors.title && (
                            <p className="text-red-500 text-xs mt-1">{addressForm.formState.errors.title.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Receiver Name</label>
                          <input
                            {...addressForm.register('receiver_name')}
                            className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">State</label>
                          <input
                            {...addressForm.register('state')}
                            className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">City</label>
                          <input
                            {...addressForm.register('city')}
                            className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                          {addressForm.formState.errors.city && (
                            <p className="text-red-500 text-xs mt-1">{addressForm.formState.errors.city.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Postal Code</label>
                          <input
                            {...addressForm.register('postal_code')}
                            className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                          {addressForm.formState.errors.postal_code && (
                            <p className="text-red-500 text-xs mt-1">{addressForm.formState.errors.postal_code.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Receiver Phone</label>
                          <input
                            {...addressForm.register('receiver_phone')}
                            className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-600 mb-1 flex justify-between items-center">
                            <span>Full Address</span>
                            {isGettingAddress && <span className="text-blue-500 font-medium animate-pulse">Detecting address...</span>}
                          </label>
                          <textarea
                            {...addressForm.register('full_address')}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            placeholder="Move the pin on the map to auto-fill, then add your unit number."
                          />
                          {addressForm.formState.errors.full_address && (
                            <p className="text-red-500 text-xs mt-1">{addressForm.formState.errors.full_address.message}</p>
                          )}
                        </div>
                        
                        <div className="md:col-span-2 flex items-center">
                          <input
                            type="checkbox"
                            {...addressForm.register('is_default')}
                            id="is_default"
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <label htmlFor="is_default" className="ml-2 text-sm text-gray-700 font-medium cursor-pointer">
                            Set as default address
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            addressForm.reset();
                          }}
                          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={addAddressMutation.isPending || isGettingAddress}
                          className="px-6 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-sm"
                        >
                          {addAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isAddressesLoading ? (
                      <p className="text-sm text-gray-500">Loading addresses...</p>
                    ) : addresses && addresses.length > 0 ? (
                      addresses.map((address: any) => (
                        <div
                          key={address.id}
                          className={`relative p-5 rounded-xl border-2 transition-all ${
                            address.is_default ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {address.is_default && (
                            <span className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                              <CheckCircle2 size={12} /> Default
                            </span>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin size={18} className={address.is_default ? 'text-blue-600' : 'text-gray-400'} />
                            <h3 className="font-bold text-gray-900">{address.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{address.full_address}</p>
                          <p className="text-xs text-gray-500 mb-4">{address.city} • Postal Code: {address.postal_code}</p>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this address?')) {
                                deleteAddressMutation.mutate(address.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <MapPin size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">No addresses saved yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3 - SECURITY */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Change Password</h2>
                <form onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))} className="space-y-5 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      {...passwordForm.register('old_password')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {passwordForm.formState.errors.old_password && (
                      <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.old_password.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      {...passwordForm.register('new_password')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {passwordForm.formState.errors.new_password && (
                      <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.new_password.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      {...passwordForm.register('new_password_confirm')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {passwordForm.formState.errors.new_password_confirm && (
                      <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.new_password_confirm.message}</p>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={updatePasswordMutation.isPending}
                      className="w-full py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black disabled:bg-gray-400 transition-colors shadow-sm"
                    >
                      {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}