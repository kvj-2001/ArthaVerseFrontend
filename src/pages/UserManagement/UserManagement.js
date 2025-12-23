import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Form, Modal, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { handleApiError } from '../../utils/errorHandler';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'USER',
    enabled: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/auth/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      handleApiError(error, toast, 'Error loading users');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Don't include password in update if it's empty
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await axios.put(`/auth/users/${editingUser.id}`, updateData);
        toast.success('User updated successfully');
      } else {
        await axios.post('/auth/users', formData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      resetForm();
      loadUsers();
    } catch (error) {
      handleApiError(error, toast, 'Error saving user');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/auth/users/${id}`);
        toast.success('User deleted successfully');
        loadUsers();
      } catch (error) {
        handleApiError(error, toast, 'Error deleting user');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't pre-fill password
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      enabled: user.enabled
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'USER',
      enabled: true
    });
    setEditingUser(null);
  };

  const toggleUserStatus = async (userId, enabled) => {
    try {
      await axios.patch(`/auth/users/${userId}/status?enabled=${!enabled}`);
      toast.success(`User ${!enabled ? 'enabled' : 'disabled'} successfully`);
      loadUsers();
    } catch (error) {
      handleApiError(error, toast, 'Error updating user status');
    }
  };

  const resetPassword = async (userId) => {
    if (window.confirm('Are you sure you want to reset this user\'s password? A new temporary password will be generated.')) {
      try {
        const response = await axios.post(`/auth/users/${userId}/reset-password`);
        toast.success(`Password reset successfully. New password: ${response.data.newPassword}`);
      } catch (error) {
        handleApiError(error, toast, 'Error resetting password');
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Check if current user is admin
  const isAdmin = user?.role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="text-center">
        <h3>Access Denied</h3>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>User Management</h1>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <i className="fas fa-plus me-2"></i>
          Create User
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Search Users</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by username, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}</td>
                    <td>
                      <Badge bg={user.role === 'ADMIN' ? 'danger' : 'primary'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={user.enabled ? 'success' : 'secondary'}>
                        {user.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(user)}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        variant={user.enabled ? "outline-warning" : "outline-success"}
                        size="sm"
                        className="me-2"
                        onClick={() => toggleUserStatus(user.id, user.enabled)}
                      >
                        <i className={`fas fa-${user.enabled ? 'ban' : 'check'}`}></i>
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => resetPassword(user.id)}
                      >
                        <i className="fas fa-key"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === user.id} // Prevent self-deletion
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* User Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Edit User' : 'Create User'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                    disabled={editingUser} // Disable username editing
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password {editingUser && '(leave blank to keep current)'}</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                    minLength={6}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="enabled"
                label="User Enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingUser ? 'Update' : 'Create'} User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
