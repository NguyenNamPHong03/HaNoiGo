import React from 'react';

const Dashboard: React.FC = () => {
  // Mock data - will be replaced with real API data
  const stats = [
    { name: 'Total Places', value: '0', icon: '📍', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { name: 'Total Users', value: '0', icon: '👥', color: 'text-green-600', bgColor: 'bg-green-50' },
    { name: 'Total Reviews', value: '0', icon: '⭐', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { name: 'AI Queries Today', value: '0', icon: '🤖', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ];

  const recentActivities = [
    'System initialized',
    'Admin dashboard ready',
    'Backend integration pending'
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to HaNoiGo Admin Dashboard</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center text-2xl`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className={`text-3xl font-bold ${stat.color}`}>{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activities
            </h3>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full"></div>
                  <p className="ml-3 text-sm text-gray-600">{activity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              System Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Frontend</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Running
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Backend API</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Pending
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Service</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Pending
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard