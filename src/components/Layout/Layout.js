import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="sidebar">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-grow-1">
        <Header />
        <Container fluid className="content-area p-4">
          <Outlet />
        </Container>
      </div>
    </div>
  );
};

export default Layout;
