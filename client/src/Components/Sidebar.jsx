import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Switch as AntSwitch, Button, Form } from 'antd';
import thinkAI from '../assets/ThinkAI.jpeg';
import na from '../assets/na.jpeg';
import {
  FileAddOutlined,
  LogoutOutlined,
  UserOutlined,
  BulbOutlined,
  BookOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem('sidebarCollapsed') === 'true' || false
  );

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLogin');
    navigate('/login');
  };

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
  }, [collapsed]);

  // Retrieve role and email from local storage
  const role = JSON.parse(localStorage?.getItem('role'));
  const email = JSON.parse(localStorage?.getItem('user')).email;

  return (
    <Sider
      width={200}
      style={{ background: darkMode ? '#001529' : '#8A2BE2', height: '100vh', color: darkMode ? 'white' : 'black' }}
      collapsible
      collapsed={collapsed}
      onCollapse={toggleCollapse}
    >
      <div
        className="logo"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <img
          src={collapsed ? thinkAI : na}
          alt="Logo"
          style={{
            width: collapsed ? '50px' : '130px',
            height: '40px',
            marginTop: '20px',
            borderRadius: '10px',
            alignContent: 'center'
          }}
        />
      </div>
      <Menu
        mode="vertical"
        theme={darkMode ? 'dark' : 'light'}
        defaultSelectedKeys={['1']}
        selectedKeys={[location.pathname]}
        style={{
          borderRight: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: darkMode ? '#001529' : '#8A2BE2',
        }}
      >
        <Menu.Item
          key="/"
          icon={<FileAddOutlined />}
          style={{ color: darkMode ? 'white' : 'black' }}
        >
          <Link to="/">Create Asset</Link>
        </Menu.Item>
        <Menu.Item
          key="/ast"
          icon={<BookOutlined />}
          style={{ color: darkMode ? 'white' : 'black' }}
        >
          <Link to="/ast">Asset</Link>
        </Menu.Item>
        <Menu.Item
          key="darkModeSwitch"
          icon={<BulbOutlined />}
          style={{ color: 'dark', marginTop: '10px' }}
        >
          <AntSwitch
            checked={darkMode}
            onChange={toggleDarkMode}
            checkedChildren="Dark"
            unCheckedChildren="Light"
          />
        </Menu.Item>
        <Form.Item
          key="/userprofile-logout"
          style={{ margin: '0px', marginTop: 'auto' }}
        >
          <Button.Group style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Menu.Item
              icon={<UserOutlined />}
              style={{ color: darkMode ? 'white' : 'black', flex: 9, borderRight: 'none' }}
            >
              {role && role !== 'role4' ? (
                
                <span>{email}</span>
              
              )
                : (
                  <Link to="/userprofile">User Profile</Link>
                )
              } 
            </Menu.Item>
            
            <Menu.Item
              icon={<LogoutOutlined />}
              style={{ color: darkMode ? 'white' : 'black', flex: 1 }}
              onClick={handleLogout}
            >
              Logout
            </Menu.Item>
            
          </Button.Group>
        </Form.Item>
      </Menu>
      <div
        onClick={toggleCollapse}
        className={`collapse-button ${collapsed ? 'collapsed' : ''}`}
      ></div>
    </Sider>
  );
};

export default Sidebar;
