import React from 'react';
import { Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <div className="sidebar p-3" style={{ width: '250px', minHeight: '100vh' }}>
      <div className="text-white mb-4">
        <h5>Billing App</h5>
      </div>
      
      <Nav className="flex-column">
        <LinkContainer to="/dashboard">
          <Nav.Link className="text-light mb-2">
            <i className="fas fa-tachometer-alt me-2"></i>
            Dashboard
          </Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/products">
          <Nav.Link className="text-light mb-2">
            <i className="fas fa-box me-2"></i>
            Products
          </Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/invoices">
          <Nav.Link className="text-light mb-2">
            <i className="fas fa-file-invoice me-2"></i>
            Invoices
          </Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/reports">
          <Nav.Link className="text-light mb-2">
            <i className="fas fa-chart-bar me-2"></i>
            Reports
          </Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/settings">
          <Nav.Link className="text-light mb-2">
            <i className="fas fa-cog me-2"></i>
            Settings
          </Nav.Link>
        </LinkContainer>
        
        {user?.role === 'ADMIN' && (
          <>
            <hr className="text-light" />
            <div className="text-light mb-2 small">ADMIN</div>
            <LinkContainer to="/users">
              <Nav.Link className="text-light mb-2">
                <i className="fas fa-users me-2"></i>
                User Management
              </Nav.Link>
            </LinkContainer>
          </>
        )}
      </Nav>
    </div>
  );
};

export default Sidebar;
