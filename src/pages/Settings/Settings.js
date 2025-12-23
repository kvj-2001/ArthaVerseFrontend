import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [companySettings, setCompanySettings] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    taxRate: 0,
    currency: 'INR',
    invoicePrefix: 'INV',
    invoiceStartNumber: 1000
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      // Load company settings
      const companyResponse = await axios.get('/settings/company');
      setCompanySettings(companyResponse.data);

      // Load email settings (admin only)
      if (user?.role === 'ADMIN') {
        const emailResponse = await axios.get('/settings/email');
        setEmailSettings(emailResponse.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email
      };

      await axios.put('/auth/profile', updateData);
      updateUser(updateData);
      toast.success('Profile updated successfully');

      // Update password if provided
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          toast.error('New passwords do not match');
          setLoading(false);
          return;
        }

        await axios.put('/auth/change-password', {
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        });
        
        setProfileData({
          ...profileData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        toast.success('Password updated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    }
    setLoading(false);
  };

  const handleCompanySettingsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put('/settings/company', companySettings);
      toast.success('Company settings updated successfully');
    } catch (error) {
      toast.error('Error updating company settings');
    }
    setLoading(false);
  };

  const handleEmailSettingsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put('/settings/email', emailSettings);
      toast.success('Email settings updated successfully');
    } catch (error) {
      toast.error('Error updating email settings');
    }
    setLoading(false);
  };

  const testEmailConnection = async () => {
    setLoading(true);
    try {
      await axios.post('/settings/email/test');
      toast.success('Email connection test successful');
    } catch (error) {
      toast.error('Email connection test failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Settings</h1>

      {/* Navigation Tabs */}
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex">
            <Button
              variant={activeTab === 'profile' ? 'primary' : 'outline-primary'}
              className="me-2"
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </Button>
            <Button
              variant={activeTab === 'company' ? 'primary' : 'outline-primary'}
              className="me-2"
              onClick={() => setActiveTab('company')}
            >
              Company
            </Button>
            {user?.role === 'ADMIN' && (
              <Button
                variant={activeTab === 'email' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('email')}
              >
                Email
              </Button>
            )}
          </div>
        </Card.Header>
      </Card>

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <Card>
          <Card.Header>
            <h5>Profile Settings</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleProfileUpdate}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  required
                />
              </Form.Group>

              <hr />
              <h6>Change Password</h6>

              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  value={profileData.currentPassword}
                  onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                  placeholder="Required only if changing password"
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
                      minLength={6}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                      minLength={6}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Company Settings */}
      {activeTab === 'company' && (
        <Card>
          <Card.Header>
            <h5>Company Settings</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleCompanySettingsUpdate}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={companySettings.companyName}
                      onChange={(e) => setCompanySettings({...companySettings, companyName: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Company Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={companySettings.companyPhone}
                      onChange={(e) => setCompanySettings({...companySettings, companyPhone: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Company Email</Form.Label>
                <Form.Control
                  type="email"
                  value={companySettings.companyEmail}
                  onChange={(e) => setCompanySettings({...companySettings, companyEmail: e.target.value})}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Company Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={companySettings.companyAddress}
                  onChange={(e) => setCompanySettings({...companySettings, companyAddress: e.target.value})}
                />
              </Form.Group>

              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tax Rate (%)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={companySettings.taxRate}
                      onChange={(e) => setCompanySettings({...companySettings, taxRate: parseFloat(e.target.value) || 0})}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Currency</Form.Label>
                    <Form.Select
                      value={companySettings.currency}
                      onChange={(e) => setCompanySettings({...companySettings, currency: e.target.value})}
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Invoice Prefix</Form.Label>
                    <Form.Control
                      type="text"
                      value={companySettings.invoicePrefix}
                      onChange={(e) => setCompanySettings({...companySettings, invoicePrefix: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Invoice Start Number</Form.Label>
                    <Form.Control
                      type="number"
                      value={companySettings.invoiceStartNumber}
                      onChange={(e) => setCompanySettings({...companySettings, invoiceStartNumber: parseInt(e.target.value) || 1000})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Company Settings'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Email Settings (Admin Only) */}
      {activeTab === 'email' && user?.role === 'ADMIN' && (
        <Card>
          <Card.Header>
            <h5>Email Settings</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleEmailSettingsUpdate}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>SMTP Host</Form.Label>
                    <Form.Control
                      type="text"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                      placeholder="smtp.gmail.com"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>SMTP Port</Form.Label>
                    <Form.Control
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPort: parseInt(e.target.value) || 587})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>SMTP Username</Form.Label>
                    <Form.Control
                      type="text"
                      value={emailSettings.smtpUsername}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>SMTP Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>From Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>From Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex gap-2">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Email Settings'}
                </Button>
                <Button type="button" variant="outline-info" onClick={testEmailConnection} disabled={loading}>
                  Test Connection
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Settings;
