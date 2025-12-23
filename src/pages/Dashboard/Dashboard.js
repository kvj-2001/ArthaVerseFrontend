import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get products count and all invoices for calculations
      const [productsRes, allInvoicesRes] = await Promise.all([
        axios.get('/products?size=1'), // Get just count
        axios.get('/invoices?page=0&size=10000&sort=createdAt,desc') // Get all invoices for calculations
      ]);

      const allInvoices = allInvoicesRes.data.content || [];
      
      // Calculate revenue from PAID invoices
      const totalRevenue = allInvoices
        .filter(invoice => invoice.status === 'PAID')
        .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

      // Count pending invoices (DRAFT and SENT status)
      const pendingInvoices = allInvoices
        .filter(invoice => invoice.status === 'DRAFT' || invoice.status === 'SENT')
        .length;

      // Get low stock products and overdue invoices
      try {
        const [lowStockRes, overdueRes] = await Promise.all([
          axios.get('/products/low-stock').catch(() => ({ data: [] })),
          axios.get('/invoices/overdue').catch(() => ({ data: [] }))
        ]);
        
        setLowStockProducts(lowStockRes.data || []);
        setOverdueInvoices(overdueRes.data || []);
      } catch (err) {
        // If these endpoints don't exist, calculate manually
        const lowStock = allInvoices.length > 0 ? [] : []; // Placeholder - would need products endpoint
        const overdue = allInvoices.filter(invoice => {
          const dueDate = new Date(invoice.dueDate);
          const today = new Date();
          return invoice.status !== 'PAID' && dueDate < today;
        });
        
        setLowStockProducts(lowStock);
        setOverdueInvoices(overdue);
      }

      setStats({
        totalProducts: productsRes.data.totalElements || 0,
        totalInvoices: allInvoices.length,
        totalRevenue: totalRevenue,
        pendingInvoices: pendingInvoices
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard</h1>
        <Button variant="primary" onClick={loadDashboardData}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="dashboard-stats mb-4">
        <Col md={3} className="mb-3">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Total Products</h6>
                  <h3 className="text-primary">{stats.totalProducts}</h3>
                </div>
                <div className="text-primary">
                  <i className="fas fa-box fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Total Invoices</h6>
                  <h3 className="text-primary">{stats.totalInvoices}</h3>
                </div>
                <div className="text-primary">
                  <i className="fas fa-file-invoice fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Total Revenue</h6>
                  <h3 className="text-primary">₹{stats.totalRevenue.toFixed(2)}</h3>
                </div>
                <div className="text-primary">
                  <i className="fas fa-rupee-sign fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Pending Invoices</h6>
                  <h3 className="text-primary">{stats.pendingInvoices}</h3>
                </div>
                <div className="text-primary">
                  <i className="fas fa-clock fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Low Stock Products */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Low Stock Products</h5>
            </Card.Header>
            <Card.Body>
              {lowStockProducts.length === 0 ? (
                <p className="text-muted">No low stock products</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Stock</th>
                        <th>Min Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.slice(0, 5).map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td className="low-stock">{product.quantity}</td>
                          <td>{product.minStockLevel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Overdue Invoices */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Overdue Invoices</h5>
            </Card.Header>
            <Card.Body>
              {overdueInvoices.length === 0 ? (
                <p className="text-muted">No overdue invoices</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueInvoices.slice(0, 5).map((invoice) => (
                        <tr key={invoice.id}>
                          <td>{invoice.invoiceNumber}</td>
                          <td>{invoice.customerName}</td>
                          <td>₹{invoice.totalAmount}</td>
                          <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
