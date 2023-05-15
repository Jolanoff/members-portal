import React from 'react';
import { Tabs } from 'flowbite-react';
import UsersTable from '../components/dashboard/UsersTable';
import RestoreTable from '../components/dashboard/RestoreTable';
import { RiDashboardFill, RiRecycleLine, RiSettings5Line } from 'react-icons/ri'

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
          <RestoreTable/>
        </Tabs.Item>

        <Tabs.Item
          title="Settings"
          icon={RiSettings5Line}
        >
          Settings will be created in v2 :)
        </Tabs.Item>
      </Tabs.Group>



    </section>


  )
}

export default Dashboard