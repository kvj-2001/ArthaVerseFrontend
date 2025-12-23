import React from 'react';
import { Navbar, Nav, Dropdown } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <Navbar bg="white" expand="lg" className="border-bottom px-4">
      <Navbar.Brand href="#" className="me-auto">
        Billing Dashboard
      </Navbar.Brand>
      
      <Nav className="ms-auto">
        <Dropdown align="end">
          <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic">
            {user?.firstName} {user?.lastName}
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item disabled>
              {user?.email}
            </Dropdown.Item>
            <Dropdown.Item disabled>
              Role: {user?.role}
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={logout}>
              Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Nav>
    </Navbar>
  );
};

export default Header;
