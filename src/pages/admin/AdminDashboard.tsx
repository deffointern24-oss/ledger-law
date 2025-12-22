// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/admin/StatCard';
import { DataTable } from '@/components/admin/DataTable';
import { useAdmin } from '../../contexts/AdminContext';
import {
    Users,
    ShoppingCart,
    DollarSign,
    Package,
    Search,
    Trash2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    const {
        // Dashboard
        dashboardStats,
        fetchDashboardStats,

        // Users
        users,
        usersPagination,
        fetchUsers,
        deleteUser,

        // Orders
        orders,
        ordersPagination,
        fetchOrders,
        updateOrderStatus,
    } = useAdmin();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Fetch initial data
    useEffect(() => {
        fetchDashboardStats();
        fetchUsers(1);
        fetchOrders(1);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(1, searchTerm || undefined);
        }, 700);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Status filter
    useEffect(() => {
        fetchOrders(1, statusFilter || undefined);
    }, [statusFilter]);

    // Handle delete user
    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        await deleteUser(userId);
    };

    // Handle update order status
    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        await updateOrderStatus(orderId, newStatus);
    };

    // User Table Columns
    const userColumns = [
        {
            key: 'name',
            label: 'Name',
            render: (val: any) => val || 'N/A'
        },
        {
            key: 'email',
            label: 'Email',
            render: (val: any) => val || 'N/A'
        },
        {
            key: 'phone',
            label: 'Phone',
            render: (val: any) => val || 'N/A'
        },
        {
            key: 'role',
            label: 'Role',
            render: (val: string) => (
                <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-105 ${
                        val === 'admin'
                            ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 shadow-sm'
                            : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 shadow-sm'
                    }`}
                >
                    {val || 'customer'}
                </span>
            ),
        },
        {
            key: 'createdAt',
            label: 'Joined',
            render: (val: string) => val ? new Date(val).toLocaleDateString() : 'N/A',
        },
        {
            key: '_id',
            label: 'Actions',
            render: (_: any, row: any) => (
                <button
                    onClick={() => handleDeleteUser(row._id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 group"
                    title="Delete"
                >
                    <Trash2 size={16} className="text-red-600 group-hover:text-red-700 transition-colors" />
                </button>
            ),
        },
    ];

    // Order Table Columns
    const orderColumns = [
        {
            key: '_id',
            label: 'Order ID',
            render: (val: string, row: any) => (
                <span className="font-mono text-sm font-semibold text-gray-700">
                    {row.orderNumber || `#${val.slice(-6)}`}
                </span>
            ),
        },
        {
            key: 'customerInfo',
            label: 'Customer',
            render: (val: any, row: any) => {
                return val?.name || row.userId?.name || 'N/A';
            },
        },
        {
            key: 'pricing',
            label: 'Amount',
            render: (val: any) => {
                const total = val?.total || 0;
                return (
                    <span className="font-semibold text-gray-900">
                        ₹{total.toLocaleString()}
                    </span>
                );
            },
        },
        {
            key: 'orderStatus',
            label: 'Status',
            render: (val: string, row: any) => {
                const currentStatus = val || 'Pending';
                return (
                    <select
                        value={currentStatus}
                        onChange={(e) => handleUpdateOrderStatus(row._id, e.target.value)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all duration-300 hover:shadow-md focus:ring-2 focus:ring-offset-1 ${
                            currentStatus === 'Completed'
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 focus:ring-green-400'
                                : currentStatus === 'Pending'
                                ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 focus:ring-yellow-400'
                                : currentStatus === 'Cancelled'
                                ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 focus:ring-red-400'
                                : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 focus:ring-blue-400'
                        }`}
                    >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Under Verification">Under Verification</option>
                        <option value="Documentation">Documentation</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                );
            },
        },
        {
            key: 'paymentStatus',
            label: 'Payment',
            render: (val: string) => (
                <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-105 ${
                        val === 'Completed'
                            ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 shadow-sm'
                            : val === 'Failed'
                            ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 shadow-sm'
                            : val === 'Refunded'
                            ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 shadow-sm'
                            : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 shadow-sm'
                    }`}
                >
                    {val || 'Pending'}
                </span>
            ),
        },
        {
            key: 'createdAt',
            label: 'Date',
            render: (val: string) => val ? new Date(val).toLocaleDateString() : 'N/A',
        },
    ];
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6 space-y-8">
            {/* Overview Section */}
            <section id="overview" className="animate-fadeIn">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                        Dashboard Overview
                    </h1>
                    <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="animate-slideInUp" style={{ animationDelay: '0ms' }}>
                        <StatCard
                            title="Total Orders"
                            value={dashboardStats?.overview?.totalOrders || 0}
                            icon={ShoppingCart}
                            color="blue"
                            trend="↑ 12% from last month"
                        />
                    </div>
                    <div className="animate-slideInUp" style={{ animationDelay: '100ms' }}>
                        <StatCard
                            title="Total Users"
                            value={dashboardStats?.overview?.totalUsers || 0}
                            icon={Users}
                            color="green"
                            trend="↑ 8% from last month"
                        />
                    </div>
                    <div className="animate-slideInUp" style={{ animationDelay: '200ms' }}>
                        <StatCard
                            title="Total Revenue"
                            value={`₹${(dashboardStats?.overview?.totalRevenue || 0).toLocaleString()}`}
                            icon={DollarSign}
                            color="purple"
                            trend="↑ 15% from last month"
                        />
                    </div>
                    <div className="animate-slideInUp" style={{ animationDelay: '300ms' }}>
                        <StatCard
                            title="Services Ordered"
                            value={dashboardStats?.overview?.totalServices || 0}
                            icon={Package}
                            color="orange"
                        />
                    </div>
                </div>

                {/* Orders by Status */}
                {dashboardStats?.ordersByStatus && dashboardStats.ordersByStatus.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 transition-all duration-300 hover:shadow-2xl animate-fadeIn">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                            Orders by Status
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {dashboardStats.ordersByStatus.map((item: any, index: number) => (
                                <div
                                    key={item._id}
                                    className="group text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 cursor-pointer animate-scaleIn"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <p className="text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                                        {item.count || 0}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2 font-medium capitalize">
                                        {item._id || 'Unknown'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Monthly Revenue Chart */}
                {dashboardStats?.monthlyRevenue && dashboardStats.monthlyRevenue.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 transition-all duration-300 hover:shadow-2xl animate-fadeIn">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                            Monthly Revenue (2025)
                        </h2>
                        <div className="h-72 flex items-end justify-between gap-2 px-4">
                            {dashboardStats.monthlyRevenue.map((month: any, index: number) => {
                                const maxRevenue = Math.max(
                                    ...dashboardStats.monthlyRevenue.map((m: any) => m.revenue || 0)
                                );
                                const height = maxRevenue > 0 ? ((month.revenue || 0) / maxRevenue) * 100 : 0;
                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                                return (
                                    <div
                                        key={month._id}
                                        className="flex-1 flex flex-col items-center group animate-slideInUp"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="relative w-full">
                                            <div
                                                className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t-xl transition-all duration-500 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 cursor-pointer group-hover:shadow-lg animate-growUp"
                                                style={{
                                                    height: `${height}%`,
                                                    minHeight: height > 0 ? '10px' : '0',
                                                    animationDelay: `${index * 100}ms`
                                                }}
                                                title={`₹${(month.revenue || 0).toLocaleString()}`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/20 rounded-t-xl"></div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-3 font-medium group-hover:text-blue-600 transition-colors">
                                            {months[month._id - 1] || 'N/A'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* Users Section */}
            <section id="users" className="pt-8 animate-fadeIn">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 transition-all duration-300 hover:shadow-2xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <div className="w-1 h-7 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                            User Management
                        </h2>
                        <div className="relative w-full md:w-auto group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64 transition-all duration-300 hover:border-gray-300"
                            />
                        </div>
                    </div>
                    <DataTable
                        columns={userColumns}
                        data={users}
                        pagination={usersPagination}
                        onPageChange={(page) => fetchUsers(page, searchTerm || undefined)}
                    />
                </div>
            </section>

            {/* Orders Section */}
            <section id="orders" className="pt-8 animate-fadeIn">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 transition-all duration-300 hover:shadow-2xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <div className="w-1 h-7 bg-gradient-to-b from-orange-600 to-red-600 rounded-full"></div>
                            Order Management
                        </h2>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-auto transition-all duration-300 hover:border-gray-300 cursor-pointer bg-white"
                        >
                            <option value="">All Status</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Pending">Pending</option>
                            <option value="Under Verification">Under Verification</option>
                            <option value="Documentation">Documentation</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    <DataTable
                        columns={orderColumns}
                        data={orders}
                        pagination={ordersPagination}
                        onPageChange={(page) => fetchOrders(page, statusFilter || undefined)}
                    />
                </div>
            </section>

            {/* Analytics Section */}
            <section id="analytics" className="pt-8 animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-7 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
                    Analytics & Reports
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-200 p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-scaleIn">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Pending Revenue</h3>
                            <div className="p-2 bg-orange-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                <DollarSign size={20} className="text-orange-700" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-orange-600 mb-1">
                            ₹{(dashboardStats?.overview?.pendingRevenue || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">From pending payments</p>
                    </div>

                    <div className="group bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-sm rounded-2xl shadow-lg border border-green-200 p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-scaleIn" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Completed Orders</h3>
                            <div className="p-2 bg-green-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                <ShoppingCart size={20} className="text-green-700" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-green-600 mb-1">
                            {dashboardStats?.overview?.completedOrders || 0}
                        </p>
                        <p className="text-sm text-gray-600">Successfully completed</p>
                    </div>

                    <div className="group bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200 p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-scaleIn" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Total Income</h3>
                            <div className="p-2 bg-blue-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                <DollarSign size={20} className="text-blue-700" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-blue-600 mb-1">
                            ₹{(dashboardStats?.overview?.totalRevenue || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Revenue from completed payments</p>
                    </div>
                </div>
            </section>

            {/* Add custom CSS animations */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes growUp {
                    from {
                        height: 0;
                    }
                    to {
                        height: var(--final-height);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out forwards;
                }

                .animate-slideInUp {
                    animation: slideInUp 0.6s ease-out forwards;
                }

                .animate-scaleIn {
                    animation: scaleIn 0.5s ease-out forwards;
                }

                .animate-growUp {
                    animation: growUp 0.8s ease-out forwards;
                }
            `}</style>
        </div>
    );
};