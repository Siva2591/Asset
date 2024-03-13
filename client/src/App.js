import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Layout } from 'antd';
import Createast from './Pages/Createast';
import Ast from './Pages/Asset';
import InboxPage from './Pages/InboxPage';
import ModifyPage from './Pages/ModifyPage';
import LoginPage from './Pages/LoginPage';
import Protected from './Components/protected';

const { Content } = Layout;

const App = () => {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Layout>
          <Content>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <Protected>
                    <Createast />
                  </Protected>
                }
              />
              <Route
                path="/ast"
                element={
                  <Protected>
                    <Ast />
                  </Protected>
                }
              />
              <Route
                path="/inboxpage"
                element={
                  <Protected>
                    <InboxPage />
                  </Protected>
                }
              />
              <Route
                path="/ModifyPage"
                element={
                  <Protected>
                    <ModifyPage />
                  </Protected>
                }
              />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};
export default App;

