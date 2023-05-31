import React, { useState, useEffect } from 'react';
import { Dropdown, Menu, Space, Button, Input } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import axios from 'axios';

const FilterForm = ({ handleSelectFilter }) => {
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState({
    degree: '',
    department: '',
    subsystem: ''
  });

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/filters`, {
        });
        setFilters(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchFilters();
  }, []);

  const onSearchChange = (filterType) => (e) => {
    setSearchText({ ...searchText, [filterType]: e.target.value });
  };

  const handleInputClick = (e) => {
    e.stopPropagation();
  };

  const renderMenuItem = (item, filterType) => (
    item.toLowerCase().includes(searchText[filterType].toLowerCase()) && (
      <Menu.Item
        key={item}
        onClick={() => handleSelectFilter({ filterType, filterValue: item })}
      >
        {item}
      </Menu.Item>
    )
  );

  const renderSearch = (filterType) => (
    <Menu.Item key="search" onClick={e => e.stopPropagation()}>
      <input
      className='h-8 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-12 py-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
        placeholder={`Search ${filterType}`}
        onChange={onSearchChange(filterType)}
        onClick={handleInputClick}
      />
    </Menu.Item>
  );

  const menu = (
    <Menu>
      <Menu.SubMenu key="group1" title="Degree">
        {renderSearch('degree')}
        {filters.degrees?.map(item => renderMenuItem(item, 'degree'))}
      </Menu.SubMenu>
      <Menu.SubMenu key="group2" title="Department">
        {renderSearch('department')}
        {filters.departments?.map(item => renderMenuItem(item, 'department'))}
      </Menu.SubMenu>
      <Menu.SubMenu key="group3" title="Subsystem">
        {renderSearch('subsystem')}
        {filters.subsystems?.map(item => renderMenuItem(item, 'subsystem'))}
      </Menu.SubMenu>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Button>
        <Space>
          Filter
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  );
};

export default FilterForm;
