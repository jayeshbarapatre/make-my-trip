import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VendorLayout from '../components/Vendor/VendorLayout';
import { useVendor } from '../context/VendorContext';
import { useSaaS } from '../context/SaaSContext';
import { vendorHotelsService } from '../services/vendorService';
import {
  SaaSButton,
  SaaSCard,
  SaaSTable,
  SaaSBadge,
  SaaSLoader
} from '../components/SaaS/UI';
import {
  RiAddLine,
  RiArrowRightLine,
  RiFileListLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiDraftLine,
  RiBarChartGroupedLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  DRAFT:            { label: 'Draft',          badge: 'badge-neutral bg-base-300 text-base-content/70', Icon: RiDraftLine,           color: 'text-base-content/65' },
  PENDING_APPROVAL: { label: 'Pending Review', badge: 'badge-warning bg-warning/10 border-warning/15 text-warning', Icon: RiTimeLine, color: 'text-warning' },
  APPROVED:         { label: 'Approved',       badge: 'badge-success bg-success/10 border-success/15 text-success', Icon: RiCheckboxCircleLine, color: 'text-success' },
  REJECTED:         { label: 'Rejected',       badge: 'badge-error bg-error/10 border-error/15 text-error', Icon: RiCloseCircleLine, color: 'text-error' },
};

const VendorDashboard = () => {
  const { vendor } = useVendor();
  const { categories, customListings } = useSaaS();
  
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await vendorHotelsService.getAll();
      setHotels(res.data.data.hotels || []);
      setError('');
    } catch (err) {
      setError('Loaded fallback stats for non-hotel dynamic categories.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generic calculations combining backend statistics and client fallback state
  const totalHotelsCount = hotels.length;
  const customListingsCount = customListings.length;
  const combinedTotalListings = totalHotelsCount + customListingsCount;

  // Status mapping
  const totalDraft = hotels.filter(h => h.listingStatus === 'DRAFT').length + 
                     customListings.filter(l => l.listingStatus === 'DRAFT').length;

  const totalPending = hotels.filter(h => h.listingStatus === 'PENDING_APPROVAL').length + 
                       customListings.filter(l => l.listingStatus === 'PENDING_APPROVAL').length;

  const totalApproved = hotels.filter(h => h.listingStatus === 'APPROVED').length + 
                        customListings.filter(l => l.listingStatus === 'APPROVED').length;

  const totalRejected = hotels.filter(h => h.listingStatus === 'REJECTED').length + 
                        customListings.filter(l => l.listingStatus === 'REJECTED').length;

  const allItemsList = [
    ...hotels.map(h => ({ id: h.id, name: h.name, type: 'Hotel', city: h.city, status: h.listingStatus, editPath: `/vendor/hotels/${h.id}/edit` })),
    ...customListings.map(l => ({ 
      id: l.id, 
      name: l.name || l.title || 'Dynamic Listing', 
      type: categories.find(c => c.id === l.categoryId)?.name || 'Custom',
      city: l.city || l.from || 'Local', 
      status: l.listingStatus, 
      editPath: `/vendor/listing/${l.categoryId}/edit/${l.id}` 
    }))
  ];

  return (
    <VendorLayout>
      {loading ? (
        <SaaSLoader type="stats" />
      ) : (
        <div className="space-y-6">

          {/* Alert messages */}
          {error && (
            <div className="alert alert-info text-xs font-semibold py-2.5 rounded-xl">
              <span>{error}</span>
            </div>
          )}

          {/* Dynamic Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-base-content tracking-tight">
                Welcome back, {vendor?.name || 'Merchant Partner'} 👋
              </h2>
              <p className="text-sm text-base-content/40 font-medium mt-0.5">Antigravity Merchant Workspace Center</p>
            </div>
            
            {/* Quick Listing Creator link */}
            <Link to="/vendor/hotels/create">
              <SaaSButton variant="primary" size="sm" icon={RiAddLine}>
                Add Hotel Listing
              </SaaSButton>
            </Link>
          </div>

          {/* Listing Performance Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-base-100 border border-base-200/60 shadow-xs rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/40">Total Inventory</span>
                <p className="text-3xl font-bold mt-1 text-base-content">{combinedTotalListings}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <RiBarChartGroupedLine className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="p-4 bg-base-100 border border-base-200/60 shadow-xs rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/40">Draft Submissions</span>
                <p className="text-3xl font-bold mt-1 text-base-content">{totalDraft}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-neutral/10 text-base-content/70 flex items-center justify-center shrink-0">
                <RiDraftLine className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="p-4 bg-base-100 border border-base-200/60 shadow-xs rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/40">Under Review</span>
                <p className="text-3xl font-bold mt-1 text-base-content">{totalPending}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                <RiTimeLine className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="p-4 bg-base-100 border border-base-200/60 shadow-xs rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/40">Approved & Live</span>
                <p className="text-3xl font-bold mt-1 text-success">{totalApproved}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                <RiCheckboxCircleLine className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="p-4 bg-base-100 border border-base-200/60 shadow-xs rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/40">Needs Editing</span>
                <p className="text-3xl font-bold mt-1 text-error">{totalRejected}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
                <RiCloseCircleLine className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {/* Modular Section Categories Navigator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.slice(0, 3).map((cat) => {
              const count = cat.id === 'hotel' ? totalHotelsCount : cat.id === 'flight' ? 0 : 0;
              return (
                <div key={cat.id} className="p-5 bg-base-100 border border-base-200/60 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-2xl">{cat.icon}</span>
                    <h4 className="font-bold text-sm text-base-content mt-2">{cat.name} Listings</h4>
                    <p className="text-[10px] font-medium text-base-content/50 leading-relaxed mt-1">
                      Manage all dynamic inventory schemas registered under {cat.name}.
                    </p>
                  </div>
                  <Link 
                    to={cat.id === 'hotel' ? '/vendor/hotels' : cat.id === 'flight' ? '/vendor/flights' : '/vendor/buses'} 
                    className="flex items-center gap-1.5 text-xs text-secondary font-bold hover:gap-2.5 transition-all mt-4"
                  >
                    Open inventory console <RiArrowRightLine className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Combined Inventory Table */}
          <SaaSCard title="Consolidated Merchant Inventory" subtitle="Overview of listings across all product channels">
            {allItemsList.length === 0 ? (
              <div className="text-center py-10 text-base-content/40">
                <RiFileListLine className="w-10 h-10 mx-auto opacity-50 mb-3" />
                <p className="text-xs font-semibold">No active listed inventory found</p>
                <Link to="/vendor/hotels/create" className="mt-3 inline-block">
                  <SaaSButton variant="primary" size="sm">Register First Asset</SaaSButton>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="text-xs text-base-content/40 uppercase tracking-widest bg-base-200/40">
                      <th>Item Details</th>
                      <th>Category</th>
                      <th>Operational Area</th>
                      <th>Status Badge</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allItemsList.slice(0, 6).map((item) => (
                      <tr key={item.id} className="hover:bg-base-200/30 transition-colors border-b border-base-200/50">
                        <td>
                          <div className="font-bold text-xs text-base-content">{item.name}</div>
                          <span className="text-[10px] text-base-content/40 font-semibold uppercase">ID: {item.id}</span>
                        </td>
                        <td>
                          <span className="badge badge-sm badge-neutral font-bold">{item.type}</span>
                        </td>
                        <td className="text-xs font-semibold text-base-content/65">{item.city}</td>
                        <td>
                          <SaaSBadge status={item.status} />
                        </td>
                        <td className="text-right">
                          <Link to={item.editPath}>
                            <SaaSButton variant="ghost" size="xs">Edit</SaaSButton>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SaaSCard>

          {/* Reusable Approval status explanation widget */}
          <div className="p-5 bg-base-100 border border-base-200/60 rounded-2xl space-y-4">
            <h4 className="font-bold text-sm text-base-content tracking-tight">Merchant Compliance & Lifecycle</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className="p-3 bg-base-200/30 border border-base-200/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <cfg.Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                    <span className="text-xs font-bold text-base-content">{cfg.label}</span>
                  </div>
                  <p className="text-[10px] font-medium text-base-content/40 leading-relaxed">
                    {key === 'DRAFT' && 'Unpublished listing. Merchant is preparing specifications.'}
                    {key === 'PENDING_APPROVAL' && 'Listing is locked. Platform administrators are reviewing compliance.'}
                    {key === 'APPROVED' && 'Item is live, verified, and ready to accept bookings from users.'}
                    {key === 'REJECTED' && 'Listing did not meet guidelines. Check comments to resubmit.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </VendorLayout>
  );
};

export default VendorDashboard;
