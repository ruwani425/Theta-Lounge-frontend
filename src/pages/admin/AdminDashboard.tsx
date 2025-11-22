// src/pages/admin/AdminDashboard.tsx

import React from "react"; 
import { NavLink } from "react-router-dom"; // Need NavLink for links inside AdminCard
import {
  User,
  CalendarCheck,
  Bath, 
  DollarSign,
  Settings,
  Shield,
  LayoutDashboard,
  BookOpen, 
  LineChart as LineChartIcon,
  TrendingUp,
  Clock, 
  Wallet,
  CheckCircle,
} from "lucide-react";
import AdminCard from "../../components/admin/AdminCard"; 

// Recharts imports (assuming they are installed)
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';

// --- MOCK DATA & COLORS ---
const CHART_VIBRANT_COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF0000', 
];

const PIE_DATA = [
    { name: '60 Min Float', value: 400 },
    { name: '90 Min Float', value: 300 },
    { name: 'Package Deal', value: 300 },
    { name: 'Add-on Service', value: 200 },
];

const BAR_DATA = [
    { name: 'Tank 1 (Neptune)', utilization: 85, ideal: 90 },
    { name: 'Tank 2 (Orion)', utilization: 72, ideal: 90 },
    { name: 'Tank 3 (Zen)', utilization: 92, ideal: 90 },
];

const LINE_DATA = [
    { name: 'Wk 1', bookings: 45 },
    { name: 'Wk 2', bookings: 60 },
    { name: 'Wk 3', bookings: 52 },
    { name: 'Wk 4', bookings: 75 },
];

const KPI_DATA = [
    { title: 'Total Revenue', value: '$12,450', change: '+5.1%', icon: Wallet, color: '#1C598C' },
    { title: 'New Bookings', value: '145', change: '+12%', icon: CalendarCheck, color: '#00C49F' },
    { title: 'Avg Session Time', value: '75 min', change: '-2%', icon: Clock, color: '#FFBB28' },
    { title: 'Tank 1 Status', value: 'Ready', change: 'Online', icon: CheckCircle, color: '#FF8042' },
];


// --- CUSTOM TAILWIND STYLES (UI Theme) ---
const CustomStyle = `
  .text-theta-primary { color: #233547; } 
  .bg-theta-light { background-color: #92B8D9; } 
  .text-theta-secondary { color: #475D73; } 
  .bg-theta-background { background-color: #CEDBE6; } 

  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-down { animation: fadeInDown 0.6s ease-out forwards; }
  
  @keyframes fadeInScale {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .animate-fade-in-scale { animation: fadeInScale 0.4s ease-out forwards; }
`;

// 💡 FIX: RESTORING dashboardOptions DEFINITION 
const dashboardOptions = [
  { title: "Appointment Bookings", path: "/admin/bookings", description: "Manage all appointments.", icon: CalendarCheck, },
  { title: "Tank Management", path: "/admin/tank-management", description: "Monitor floating tank capacity and status.", icon: Bath, },
  { title: "User Accounts", path: "/admin/users", description: "Manage all system users.", icon: User, },
  { title: "Services & Pricing", path: "/admin/pricing", description: "Update therapy services and package rates.", icon: DollarSign, },
  { title: "Reports & Analytics", path: "/admin/reports", description: "View performance metrics.", icon: LineChartIcon, },
  { title: "Content Management", path: "/admin/content", description: "Edit website pages and blog posts.", icon: BookOpen, },
  { title: "Access Control", path: "/admin/roles", description: "Manage admin permissions.", icon: Shield, },
  { title: "Global Settings", path: "/admin/settings", description: "Configure application settings.", icon: Settings, },
];

// Type definition for safe access
interface PieLabelRenderProps {
    name?: string;
    percent?: number;
}

// --- CHART COMPONENTS (Defined for correct scope) ---

const RevenuePieChart: React.FC = () => (
    <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100 h-96">
        <h3 className="text-xl font-bold text-theta-primary mb-4">Revenue Breakdown by Service (QTD)</h3>
        <ResponsiveContainer width="100%" height="80%">
            <PieChart>
                <Pie
                    data={PIE_DATA}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={(props: PieLabelRenderProps) => {
                        if (props.name && props.percent !== undefined) {
                            return `${props.name} (${(props.percent * 100).toFixed(0)}%)`;
                        }
                        return ''; 
                    }}
                >
                    {PIE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_VIBRANT_COLORS[index % CHART_VIBRANT_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    </div>
);

const TankUtilizationBarChart: React.FC = () => (
    <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100 h-96">
        <h3 className="text-xl font-bold text-theta-primary mb-4">Tank Utilization (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height="80%">
            <BarChart data={BAR_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#5F8CA1" />
                <YAxis unit="%" domain={[0, 100]} stroke="#5F8CA1" />
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                <Legend />
                <Bar dataKey="utilization" fill={CHART_VIBRANT_COLORS[0]} name="Actual Utilization" />
                <Bar dataKey="ideal" fill={CHART_VIBRANT_COLORS[4]} name="Ideal Target" opacity={0.5} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

const BookingTrendLineChart: React.FC = () => (
    <div className="p-5 bg-white rounded-xl shadow-lg border border-gray-100 h-96">
        <h3 className="text-xl font-bold text-theta-primary mb-4">Weekly Booking Trends</h3>
        <ResponsiveContainer width="100%" height="80%">
            <LineChart data={LINE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#5F8CA1" />
                <YAxis stroke="#5F8CA1" />
                <Tooltip />
                <Legend />
                <Line 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke={CHART_VIBRANT_COLORS[1]} 
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    name="Total Bookings"
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

const StatCard: React.FC<typeof KPI_DATA[0] & { icon: React.ElementType }> = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color 
}) => (
    <div className="p-5 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-between transition-shadow duration-300 hover:shadow-lg">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h4 className="text-3xl font-bold text-gray-800 mb-1">{value}</h4>
            <p className={`text-xs font-semibold ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {change} vs last period
            </p>
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-6 h-6" style={{ color: color }} />
        </div>
    </div>
);


// --- The Dashboard Component ---

const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-theta-background p-0"> 
      <style dangerouslySetInnerHTML={{ __html: CustomStyle }} />

      <div className="relative w-full max-w-full mx-auto 
                 p-10 md:p-12 
                 bg-white shadow-3xl rounded-2xl"> 
        
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="flex items-center justify-center text-4xl md:text-5xl font-extrabold text-theta-primary mb-3 animate-fade-in-down">
            <LayoutDashboard className="w-10 h-10 mr-4" />
            Admin Control Panel
          </h1>
          <p className="text-lg font-medium text-theta-secondary">
            Welcome, Administrator. Manage your Theta Lounge operations with ease.
          </p>
        </header>
        
        <hr className="border-gray-300 mb-8" />

        {/* 1. CORE MANAGEMENT OPTIONS - SMOOTH 6-COLUMN GRID */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-theta-primary mb-6 text-center animate-fade-in">Core Management Options</h2>
          
          {/* 💡 KEY CHANGE: 6-column grid for XL screens. This shrinks the box size smoothly. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 md:gap-8"> 
            {dashboardOptions.map((option, index) => (
              <AdminCard 
                key={option.title}
                title={option.title}
                path={option.path}
                description={option.description}
                Icon={option.icon}
                animationDelay={index * 0.05} 
              />
            ))}
          </div>
        </section>

        {/* 2. OPERATIONAL INSIGHTS (Charts and KPIs) */}
        <section className="mt-12 pt-8 border-t border-gray-300">
            <h2 className="text-2xl md:text-3xl font-bold text-theta-primary mb-8 text-center animate-fade-in">Real-time Operational Insights</h2>
            
            {/* KPI Cards (Stat Boxes) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {KPI_DATA.map((kpi, index) => (
                    <StatCard 
                        key={kpi.title} 
                        title={kpi.title} 
                        value={kpi.value} 
                        change={kpi.change} 
                        icon={kpi.icon}
                        color={kpi.color}
                    />
                ))}
            </div>
            
            <h3 className="text-xl font-bold text-theta-primary mb-6">Detailed Visualizations</h3>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <BookingTrendLineChart /> 
                <TankUtilizationBarChart />
                <RevenuePieChart /> 
                <RevenuePieChart /> 
            </div>
        </section>
      </div>
    </div>
  );
};
export default AdminDashboard;