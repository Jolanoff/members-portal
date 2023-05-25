import React from 'react';
import { Tabs } from 'flowbite-react';
import UsersTable from '../components/dashboard/UsersTable';
import RestoreTable from '../components/dashboard/RestoreTable';
import { RiDashboardFill, RiRecycleLine, RiSettings5Line } from 'react-icons/ri'
import TagControl from '../components/dashboard/TagControl';

const Dashboard = () => {
  return (
    <section className="p-3 sm:p-5">
      <Tabs.Group
        aria-label="Tabs with icons"
        style="underline"
      >
        <Tabs.Item
          active={true}
          title="Dashboard"
          icon={RiDashboardFill}
        >
          <UsersTable />
        </Tabs.Item>

        <Tabs.Item
          title="Restore"
          icon={RiRecycleLine}
        >
          <RestoreTable />
        </Tabs.Item>

        <Tabs.Item
          title="Settings"
          icon={RiSettings5Line}
        >
          <div className="flex flex-col h-full p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <div className="flex flex-row space-x-6">
              <div className="flex-1">
                <TagControl />
              </div>
              <div className="flex-1">
              <TagControl />

              </div>
            </div>
          </div>
        </Tabs.Item>
      </Tabs.Group>



    </section>


  )
}

export default Dashboard