import React, { useState, useEffect } from 'react';
import { Dropdown, Menu, Space, Button, Tag } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import axios from 'axios';

const FilterForm = ({ handleSelectFilter }) => {
  const [filters, setFilters] = useState({ tags: [], departments: [], subsystems: [] });
  const [selectedFilter, setSelectedFilter] = useState({ tags: [], department: [], subsystem: [] });
  const [searchText, setSearchText] = useState({ tags: '', department: '', subsystem: '' });

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/filters`, {});
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
  useEffect(() => {
    handleSelectFilter(selectedFilter);
  }, [selectedFilter, handleSelectFilter]);

  const handleFilterSelect = (filterType, filterValue) => {
    if (!selectedFilter[filterType].includes(filterValue)) {
      setSelectedFilter({
        ...selectedFilter,
        [filterType]: [...(selectedFilter[filterType] || []), filterValue],
      });
    }
  };
  const handleFilterReset = (filterType, filterValue) => {
    setSelectedFilter(prevState => {
      const newFilter = { ...prevState };
      newFilter[filterType] = newFilter[filterType].filter(value => value !== filterValue);
      return newFilter;
    });
  };
  const renderMenuItem = (item, filterType) => (
    item && item.toLowerCase().includes(searchText[filterType].toLowerCase()) && (
      <Menu.Item
        key={item}
        onClick={() => handleFilterSelect(filterType, item)}
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

  const ScrollableMenu = ({ items, filterType }) => (
    <div className='overflow-y-auto max-h-48 uppercase'>
      {items && items.map(item => renderMenuItem(item, filterType))}
    </div>
  );

  const menu = (
    <Menu>
      <Menu.SubMenu key="tagsGroup" title="Tags">
        {renderSearch('tags')}
        <Menu.Divider />
        <ScrollableMenu items={filters.tags} filterType='tags' />
      </Menu.SubMenu>
      <Menu.SubMenu key="departmentGroup" title="Department">
        {renderSearch('department')}
        <Menu.Divider />
        <ScrollableMenu items={filters.departments} filterType='department' />
      </Menu.SubMenu>
      <Menu.SubMenu key="subsystemGroup" title="Subsystem">
        {renderSearch('subsystem')}
        <Menu.Divider />
        <ScrollableMenu items={filters.subsystems} filterType='subsystem' />
      </Menu.SubMenu>

    </Menu>
  );

  return (
    <Space>
      <div>
        <Dropdown overlay={menu}>
          <Button>
            <Space>
              Filter
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
      </div>

      {Object.keys(selectedFilter).map(filterType =>
        selectedFilter[filterType].map(filterValue =>
          <Tag className='uppercase' key={filterType + filterValue} closable onClose={() => handleFilterReset(filterType, filterValue)}>
            {`${filterType}: ${filterValue}`}
          </Tag>
        )
      )}

    </Space>
  );
};

export default FilterForm;
