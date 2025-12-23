import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Form, DatePicker, OverlayTrigger, Tooltip as BootstrapTooltip } from 'react-bootstrap';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import axios from 'axios';
import toast from 'react-hot-toast';
import { handleApiError } from '../../utils/errorHandler';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '',
    customer: ''
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.customer) params.append('customer', filters.customer);

      const response = await axios.get(`/reports/dashboard?${params.toString()}`);
      setReportData(response.data);
    } catch (error) {
      handleApiError(error, toast, 'Error loading reports');
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const exportToPdf = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.customer) params.append('customer', filters.customer);

      const response = await axios.get(`/reports/export/pdf?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${filters.startDate}-to-${filters.endDate}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported to PDF');
    } catch (error) {
      handleApiError(error, toast, 'Error exporting PDF');
    }
  };

  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.customer) params.append('customer', filters.customer);

      const response = await axios.get(`/reports/export/excel?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${filters.startDate}-to-${filters.endDate}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported to Excel');
    } catch (error) {
      handleApiError(error, toast, 'Error exporting Excel');
    }
  };

  const exportToCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.customer) params.append('customer', filters.customer);

      const response = await axios.get(`/reports/export/csv?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${filters.startDate}-to-${filters.endDate}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported to CSV');
    } catch (error) {
      handleApiError(error, toast, 'Error exporting CSV');
    }
  };

  // Chart configurations
  const salesTrendData = {
    labels: reportData?.salesTrend?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Sales Amount',
        data: reportData?.salesTrend?.map(item => item.amount) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  };

  const statusDistributionData = {
    labels: reportData?.statusDistribution?.map(item => item.status) || [],
    datasets: [
      {
        data: reportData?.statusDistribution?.map(item => item.count) || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ]
      }
    ]
  };

  const topProductsData = {
    labels: reportData?.topProducts?.map(item => item.productName) || [],
    datasets: [
      {
        label: 'Revenue',
        data: reportData?.topProducts?.map(item => item.revenue) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Chart Title'
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Reports & Analytics</h1>
        <div>
          <Button variant="outline-primary" className="me-2" onClick={exportToPdf}>
            <i className="fas fa-file-pdf me-2"></i>
            Export PDF
          </Button>
          <Button variant="outline-success" className="me-2" onClick={exportToExcel}>
            <i className="fas fa-file-excel me-2"></i>
            Export Excel
          </Button>
          <Button variant="outline-info" onClick={exportToCsv}>
            <i className="fas fa-file-csv me-2"></i>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>
          <h5>Filters</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Customer</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Customer name"
                  value={filters.customer}
                  onChange={(e) => setFilters({...filters, customer: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : reportData ? (
        <>
          {/* Summary Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h2 className="text-primary">{reportData.summary?.totalInvoices || 0}</h2>
                  <p className="mb-0">Total Invoices</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h2 className="text-success">₹{reportData.summary?.totalRevenue || 0}</h2>
                  <p className="mb-0">Total Revenue</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h2 className="text-info">₹{reportData.summary?.averageInvoiceValue || 0}</h2>
                  <p className="mb-0">Average Invoice Value</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h2 className="text-warning">{reportData.summary?.pendingInvoices || 0}</h2>
                  <p className="mb-0">Pending Invoices</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row className="mb-4">
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h5>Sales Trend</h5>
                </Card.Header>
                <Card.Body>
                  <Line 
                    data={salesTrendData} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          display: true,
                          text: 'Sales Trend Over Time'
                        }
                      }
                    }} 
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Header>
                  <h5>Invoice Status Distribution</h5>
                </Card.Header>
                <Card.Body>
                  <Pie 
                    data={statusDistributionData} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }} 
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h5>Top Products by Revenue</h5>
                </Card.Header>
                <Card.Body>
                  <Bar 
                    data={topProductsData} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          display: true,
                          text: 'Top Performing Products'
                        }
                      }
                    }} 
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Detailed Tables */}
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Top Customers</h5>
                </Card.Header>
                <Card.Body>
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Total Revenue</th>
                        <th>Invoice Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.topCustomers?.map((customer, index) => (
                        <tr key={index}>
                          <td>{customer.customerName}</td>
                          <td>₹{customer.totalRevenue}</td>
                          <td>{customer.invoiceCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Recent Activity</h5>
                </Card.Header>
                <Card.Body>
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.recentActivity?.map((activity, index) => (
                        <tr key={index}>
                          <td>{new Date(activity.date).toLocaleDateString()}</td>
                          <td>{activity.description}</td>
                          <td>₹{activity.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div className="text-center">
          <p>No data available for the selected filters.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
