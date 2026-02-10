// resources/js/Pages/Dashboard/Index.jsx

import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    BarChart3, 
    Users, 
    FileText, 
    CheckCircle2, 
    Clock, 
    TrendingUp,
    Calendar,
    Award
} from 'lucide-react';

export default function Dashboard({ auth, statistics }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dashboard" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                        Welcome back, {auth.user.name}! 👋
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Here's what's happening with your KKN activities
                    </p>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <AnalyticsCard
                        title="Total Students"
                        value={statistics.total_students}
                        change="+12%"
                        trend="up"
                        icon={Users}
                        color="blue"
                        mounted={mounted}
                        delay={0}
                    />
                    
                    <AnalyticsCard
                        title="Active Groups"
                        value={statistics.active_groups}
                        change="+5%"
                        trend="up"
                        icon={Users}
                        color="green"
                        mounted={mounted}
                        delay={100}
                    />
                    
                    <AnalyticsCard
                        title="Reports Submitted"
                        value={statistics.reports_submitted}
                        change="+18%"
                        trend="up"
                        icon={FileText}
                        color="purple"
                        mounted={mounted}
                        delay={200}
                    />
                    
                    <AnalyticsCard
                        title="Completion Rate"
                        value={`${statistics.completion_rate}%`}
                        change="+3%"
                        trend="up"
                        icon={CheckCircle2}
                        color="amber"
                        mounted={mounted}
                        delay={300}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2">
                        <GlassCard>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Recent Activity
                                </h2>
                                <Link 
                                    href="/activity"
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                                >
                                    View All
                                </Link>
                            </div>
                            
                            <div className="space-y-4">
                                {statistics.recent_activities.map((activity, index) => (
                                    <ActivityItem 
                                        key={index} 
                                        activity={activity}
                                        mounted={mounted}
                                        delay={400 + (index * 50)}
                                    />
                                ))}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Quick Actions & Upcoming */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <GlassCard>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <QuickActionButton 
                                    href="/logbook/create"
                                    icon={Calendar}
                                    label="Add Logbook Entry"
                                    color="blue"
                                />
                                <QuickActionButton 
                                    href="/reports/upload"
                                    icon={FileText}
                                    label="Upload Report"
                                    color="green"
                                />
                                <QuickActionButton 
                                    href="/workshops"
                                    icon={Award}
                                    label="View Workshops"
                                    color="purple"
                                />
                            </div>
                        </GlassCard>

                        {/* Upcoming Events */}
                        <GlassCard>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Upcoming Events
                            </h3>
                            <div className="space-y-3">
                                {statistics.upcoming_events.map((event, index) => (
                                    <EventItem 
                                        key={index}
                                        event={event}
                                        mounted={mounted}
                                        delay={600 + (index * 50)}
                                    />
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* Registration Trend Chart */}
                <div className="mt-6">
                    <GlassCard>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                            Registration Trends
                        </h2>
                        <RegistrationChart data={statistics.registration_trends} />
                    </GlassCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// Analytics Card Component with Glassmorphism
function AnalyticsCard({ title, value, change, trend, icon: Icon, color, mounted, delay }) {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        amber: 'from-amber-500 to-amber-600',
    };

    return (
        <div 
            className={`
                backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 
                border border-white/20 dark:border-slate-700/50
                rounded-2xl p-6 
                shadow-xl shadow-black/5
                hover:shadow-2xl hover:scale-105
                transition-all duration-500
                ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`
                    p-3 rounded-xl bg-gradient-to-br ${colors[color]}
                    shadow-lg shadow-${color}-500/50
                `}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`
                    text-sm font-semibold px-2 py-1 rounded-lg
                    ${trend === 'up' 
                        ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30' 
                        : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                    }
                `}>
                    {change}
                </span>
            </div>
            
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {value}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
                {title}
            </p>
        </div>
    );
}

// Glass Card Component
function GlassCard({ children, className = '' }) {
    return (
        <div className={`
            backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 
            border border-white/20 dark:border-slate-700/50
            rounded-2xl p-6 
            shadow-xl shadow-black/5
            ${className}
        `}>
            {children}
        </div>
    );
}

// Activity Item Component
function ActivityItem({ activity, mounted, delay }) {
    return (
        <div 
            className={`
                flex items-center gap-4 p-4 rounded-xl
                bg-slate-50/50 dark:bg-slate-900/50
                hover:bg-slate-100/50 dark:hover:bg-slate-900/70
                transition-all duration-300
                ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}
            `}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="flex-shrink-0">
                <div className={`
                    w-10 h-10 rounded-full
                    flex items-center justify-center
                    ${activity.type === 'logbook' && 'bg-blue-100 dark:bg-blue-900/30'}
                    ${activity.type === 'report' && 'bg-green-100 dark:bg-green-900/30'}
                    ${activity.type === 'workshop' && 'bg-purple-100 dark:bg-purple-900/30'}
                `}>
                    {activity.type === 'logbook' && <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                    {activity.type === 'report' && <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />}
                    {activity.type === 'workshop' && <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                </div>
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {activity.title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                    {activity.description}
                </p>
            </div>
            
            <div className="text-xs text-slate-500 dark:text-slate-500">
                {activity.time}
            </div>
        </div>
    );
}

// Quick Action Button
function QuickActionButton({ href, icon: Icon, label, color }) {
    const colors = {
        blue: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400',
        purple: 'hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    };

    return (
        <Link
            href={href}
            className={`
                flex items-center gap-3 p-3 rounded-xl
                transition-all duration-300
                ${colors[color]}
                group
            `}
        >
            <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{label}</span>
        </Link>
    );
}

// Event Item Component
function EventItem({ event, mounted, delay }) {
    return (
        <div 
            className={`
                p-4 rounded-xl border border-slate-200 dark:border-slate-700
                hover:border-blue-300 dark:hover:border-blue-600
                transition-all duration-300
                ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
            `}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {event.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {event.date}
                    </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    {event.type}
                </span>
            </div>
        </div>
    );
}

// Simple Registration Chart Component (can be replaced with recharts)
function RegistrationChart({ data }) {
    return (
        <div className="h-64 flex items-end justify-around gap-2">
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                        style={{ 
                            height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
                        }}
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                        {item.month}
                    </span>
                </div>
            ))}
        </div>
    );
}
