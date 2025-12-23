import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Form, Modal, Badge, OverlayTrigger, Tooltip, Collapse } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { handleApiError } from '../../utils/errorHandler';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [productSearchTerms, setProductSearchTerms] = useState({}); // Store search terms for each item
  // eslint-disable-next-line no-unused-vars
  const [showProductDropdown, setShowProductDropdown] = useState({}); // Track dropdown visibility

  const [formData, setFormData] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    taxAmount: 0,
    discountAmount: 0,
    notes: '',
    status: 'DRAFT',
    items: []
  });

  useEffect(() => {
    loadInvoices();
    loadProducts();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.position-relative')) {
        setShowProductDropdown({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/invoices?page=0&size=1000&sort=createdAt,desc');
      setInvoices(response.data.content || []);
    } catch (error) {
      handleApiError(error, toast, 'Error loading invoices');
    }
    setLoading(false);
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get('/products?page=0&size=1000&sort=name,asc');
      setProducts(response.data.content || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        await axios.put(`/invoices/${editingInvoice.id}`, formData);
        toast.success('Invoice updated successfully');
      } else {
        await axios.post('/invoices', formData);
        toast.success('Invoice created successfully');
      }
      setShowModal(false);
      resetForm();
      loadInvoices();
    } catch (error) {
      handleApiError(error, toast, 'Error saving invoice');
    }
  };

  const handleSubmitAndMarkPaid = async (e) => {
    e.preventDefault();
    try {
      const invoiceData = { ...formData, status: 'PAID' };
      if (editingInvoice) {
        await axios.put(`/invoices/${editingInvoice.id}`, invoiceData);
        toast.success('Invoice updated and marked as paid successfully');
      } else {
        await axios.post('/invoices', invoiceData);
        toast.success('Invoice created and marked as paid successfully');
      }
      setShowModal(false);
      resetForm();
      loadInvoices();
    } catch (error) {
      handleApiError(error, toast, 'Error saving invoice');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axios.delete(`/invoices/${id}`);
        toast.success('Invoice deleted successfully');
        loadInvoices();
      } catch (error) {
        handleApiError(error, toast, 'Error deleting invoice');
      }
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate || '',
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail || '',
      customerPhone: invoice.customerPhone || '',
      customerAddress: invoice.customerAddress || '',
      taxAmount: invoice.taxAmount,
      discountAmount: invoice.discountAmount,
      notes: invoice.notes || '',
      status: invoice.status,
      items: invoice.items || []
    });
    // Show customer details if any customer information exists
    setShowCustomerDetails(
      !!(invoice.customerName || invoice.customerEmail || invoice.customerPhone || invoice.customerAddress)
    );
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      taxAmount: 0,
      discountAmount: 0,
      notes: '',
      status: 'DRAFT',
      items: []
    });
    setEditingInvoice(null);
    setShowCustomerDetails(false);
    setProductSearchTerms({});
    setShowProductDropdown({});
  };

  const addItem = () => {
    const newIndex = formData.items.length;
    setFormData({
      ...formData,
        items: [...formData.items, {
        productId: '',
        quantity: '',
        unitPrice: 0,
        description: '',
        productUnit: 'PIECES'
      }]
    });
    // Initialize search state for new item
    setProductSearchTerms({ ...productSearchTerms, [newIndex]: '' });
    setShowProductDropdown({ ...showProductDropdown, [newIndex]: false });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    
    // Clean up search state for removed item and reindex remaining items
    const newSearchTerms = {};
    const newDropdownStates = {};
    
    Object.keys(productSearchTerms).forEach(key => {
      const idx = parseInt(key);
      if (idx < index) {
        newSearchTerms[idx] = productSearchTerms[idx];
        newDropdownStates[idx] = showProductDropdown[idx];
      } else if (idx > index) {
        newSearchTerms[idx - 1] = productSearchTerms[idx];
        newDropdownStates[idx - 1] = showProductDropdown[idx];
      }
    });
    
    setProductSearchTerms(newSearchTerms);
    setShowProductDropdown(newDropdownStates);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill product details when product is selected
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].unitPrice = product.price;
        newItems[index].description = product.name;
        newItems[index].productUnit = product.unit;
      }
      // Clear search term when product is selected
      setProductSearchTerms({ ...productSearchTerms, [index]: '' });
      setShowProductDropdown({ ...showProductDropdown, [index]: false });
    }
    
    // Validate quantity based on unit type
    if (field === 'quantity') {
      const item = newItems[index];
      const product = products.find(p => p.id === parseInt(item.productId));
      
      // Allow empty values (user is still typing)
      if (value === '' || value === 0) {
        // No validation error, just update
      } else if (product && product.unit === 'PIECES') {
        // For pieces, only allow whole numbers >= 1
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 1 || numValue !== Math.floor(numValue)) {
          toast.error('Quantity for pieces must be a whole number (minimum 1)');
          return; // Don't update if invalid
        }
      } else if (product) {
        // For other units, allow decimals >= 0.001
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0.001) {
          toast.error('Quantity must be at least 0.001');
          return; // Don't update if invalid
        }
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  // Filter products based on search term for a specific item
  const getFilteredProducts = (index) => {
    const searchTerm = productSearchTerms[index] || '';
    if (!searchTerm) return products;
    
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Handle product search input
  const handleProductSearch = (index, value) => {
    setProductSearchTerms({ ...productSearchTerms, [index]: value });
    setShowProductDropdown({ ...showProductDropdown, [index]: value.length > 0 });
  };

  // Select a product from search results
  const selectProduct = (index, product) => {
    updateItem(index, 'productId', product.id);
    
    // Show warning if product is out of stock
    if (product.quantity === 0) {
      toast.warning(`⚠️ ${product.name} is out of stock! You can still create the invoice, but consider updating stock levels.`, {
        duration: 4000
      });
    } else if (product.quantity <= product.minStockLevel) {
      toast.info(`📊 ${product.name} is running low on stock (${product.quantity} remaining)`, {
        duration: 3000
      });
    }
  };

  // Calculate invoice totals
  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + ((parseFloat(item.quantity) || 0) * (item.unitPrice || 0));
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = formData.taxAmount || 0;
    const discount = formData.discountAmount || 0;
    return subtotal + tax - discount;
  };

  // Get selected product name for display
  const getSelectedProductName = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    return product ? `${product.name} (${product.code})` : '';
  };

  const downloadPdf = async (invoiceId) => {
    try {
      const response = await axios.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      handleApiError(error, toast, 'Error downloading PDF');
    }
  };

  const updateStatus = async (invoiceId, status) => {
    try {
      await axios.patch(`/invoices/${invoiceId}/status?status=${status}`);
      toast.success('Invoice status updated');
      loadInvoices();
    } catch (error) {
      handleApiError(error, toast, 'Error updating status');
    }
  };

  const printInvoice = (invoice) => {
    const printContent = generatePrintContent(invoice);
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          @media print {
            @page {
              size: 3in auto;
              margin: 0.1in;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            line-height: 1.2;
            width: 3in;
            margin: 0;
            padding: 4px;
            color: #000;
          }
          
          .receipt-header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
          }
          
          .company-name {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .invoice-info {
            margin: 4px 0;
            font-size: 9px;
          }
          
          .customer-info {
            margin: 6px 0;
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
          }
          
          .items-table {
            width: 100%;
            margin: 4px 0;
          }
          
          .items-table th,
          .items-table td {
            text-align: left;
            font-size: 9px;
            padding: 1px;
          }
          
          .items-table th {
            border-bottom: 1px solid #000;
            font-weight: bold;
          }
          
          .item-row {
            border-bottom: 1px dotted #ccc;
          }
          
          .item-name {
            font-weight: bold;
          }
          
          .text-right {
            text-align: right;
          }
          
          .totals {
            margin-top: 6px;
            border-top: 1px dashed #000;
            padding-top: 4px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          
          .grand-total {
            font-weight: bold;
            font-size: 11px;
            border-top: 1px solid #000;
            padding-top: 2px;
            margin-top: 4px;
          }
          
          .footer {
            text-align: center;
            margin-top: 8px;
            border-top: 1px dashed #000;
            padding-top: 4px;
            font-size: 8px;
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Auto print after content loads
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const generatePrintContent = (invoice) => {
    const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString();
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A';
    
    let itemsHTML = '';
    let totalSavings = 0;
    invoice.items?.forEach((item, index) => {
      const total = (item.quantity * item.unitPrice).toFixed(2);
      
      // Look up current product data to get the latest MRP
      const currentProduct = products.find(p => p.id === item.product?.id || p.id === item.productId);
      const mrp = currentProduct?.mrp || item.product?.mrp || 0;
      const itemSavings = mrp > item.unitPrice ? ((mrp - item.unitPrice) * item.quantity) : 0;
      totalSavings += itemSavings;
      
      itemsHTML += `
        <tr class="item-row">
          <td class="item-name" colspan="3">${item.description || item.product?.name || 'Item'}</td>
        </tr>
        <tr class="item-row">
          <td>${item.quantity} x ₹${item.unitPrice}</td>
          <td></td>
          <td class="text-right">₹${total}</td>
        </tr>
        <tr>
          <td colspan="2"><small>MRP: ₹${mrp.toFixed(2)} | Save: <span style="color: #28a745; font-weight: bold;">₹${itemSavings.toFixed(2)}</span></small></td>
          <td></td>
        </tr>
      `;
    });
    
    const subtotal = (invoice.totalAmount - (invoice.taxAmount || 0) + (invoice.discountAmount || 0)).toFixed(2);
    
    return `
      <div class="receipt-header">
        <div class="company-name">BEST FOOD AT LOW PRICES</div>
        <div>Phone: +91-9440262688</div>
        <div>Email: business@email.com</div>
      </div>
      
      <div class="invoice-info">
        <div><strong>Invoice #:</strong> ${invoice.invoiceNumber}</div>
        <div><strong>Date:</strong> ${invoiceDate}</div>
        <div><strong>Due Date:</strong> ${dueDate}</div>
        <div><strong>Status:</strong> ${invoice.status}</div>
      </div>
      
      <div class="customer-info">
        <div><strong>Bill To:</strong></div>
        <div>${invoice.customerName || 'Cash Sale'}</div>
        ${invoice.customerEmail ? `<div>${invoice.customerEmail}</div>` : ''}
        ${invoice.customerPhone ? `<div>${invoice.customerPhone}</div>` : ''}
        ${invoice.customerAddress ? `<div>${invoice.customerAddress}</div>` : ''}
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th></th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>₹${subtotal}</span>
        </div>
        <div class="total-row" style="color: ${totalSavings > 0 ? '#28a745' : '#666'}; font-weight: bold; background-color: ${totalSavings > 0 ? '#d4edda' : '#f8f9fa'}; padding: 2px;">
          <span>You Saved:</span>
          <span>₹${totalSavings.toFixed(2)}</span>
        </div>
        ${invoice.taxAmount > 0 ? `
          <div class="total-row">
            <span>Tax:</span>
            <span>₹${invoice.taxAmount.toFixed(2)}</span>
          </div>
        ` : ''}
        ${invoice.discountAmount > 0 ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>-₹${invoice.discountAmount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>₹${invoice.totalAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="footer">
        <div>Thank you for your business!</div>
        <div>Powered by ArthaVerse</div>
      </div>
    `;
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'SENT': return 'info';
      case 'PAID': return 'success';
      case 'OVERDUE': return 'danger';
      case 'CANCELLED': return 'dark';
      default: return 'secondary';
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Invoices</h1>
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip>Create a new invoice</Tooltip>}
        >
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <i className="fas fa-plus me-2"></i>
            Create Invoice
          </Button>
        </OverlayTrigger>
      </div>

      {/* Search */}
      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Search Invoices</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by customer name or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Invoices Table */}
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
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>
                      <div>
                        <div>{invoice.customerName || 'Cash Sale'}</div>
                        {invoice.customerEmail && invoice.customerEmail.trim() && (
                          <small className="text-muted">
                            <i className="fas fa-envelope"></i> {invoice.customerEmail}
                          </small>
                        )}
                        {(!invoice.customerEmail || !invoice.customerEmail.trim()) && (
                          <small className="text-muted">
                            <i className="fas fa-envelope-slash"></i> No email
                          </small>
                        )}
                      </div>
                    </td>
                    <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                    <td>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</td>
                    <td>₹{invoice.totalAmount}</td>
                    <td>
                      <div className="d-flex flex-column align-items-start">
                        <Badge bg={getStatusVariant(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        {invoice.status === 'DRAFT' && (!invoice.customerEmail || !invoice.customerEmail.trim()) && (
                          <small className="text-muted mt-1">
                            <i className="fas fa-envelope-slash"></i> No email - Send unavailable
                          </small>
                        )}
                        {invoice.status === 'DRAFT' && invoice.customerEmail && invoice.customerEmail.trim() && (
                          <small className="text-success mt-1">
                            <i className="fas fa-envelope"></i> Can send to customer
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <OverlayTrigger placement="top" overlay={<Tooltip>Edit Invoice</Tooltip>}>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(invoice)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </OverlayTrigger>
                        
                        <OverlayTrigger placement="top" overlay={<Tooltip>Download PDF</Tooltip>}>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => downloadPdf(invoice.id)}
                          >
                            <i className="fas fa-download"></i>
                          </Button>
                        </OverlayTrigger>
                        
                        <OverlayTrigger placement="top" overlay={<Tooltip>Print Invoice (3-inch format)</Tooltip>}>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => printInvoice(invoice)}
                          >
                            <i className="fas fa-print"></i>
                          </Button>
                        </OverlayTrigger>
                        
                        {/* Status Action Buttons */}
                        {/* Send button - only show if status is DRAFT and customer email is provided */}
                        {invoice.status === 'DRAFT' && invoice.customerEmail && invoice.customerEmail.trim() && (
                          <OverlayTrigger placement="top" overlay={<Tooltip>Send Invoice to Customer</Tooltip>}>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => updateStatus(invoice.id, 'SENT')}
                            >
                              <i className="fas fa-paper-plane"></i>
                            </Button>
                          </OverlayTrigger>
                        )}
                        
                        {/* Mark as Paid button - show for DRAFT, SENT, and OVERDUE */}
                        {(invoice.status === 'DRAFT' || invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                          <OverlayTrigger placement="top" overlay={<Tooltip>Mark as Paid</Tooltip>}>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => updateStatus(invoice.id, 'PAID')}
                            >
                              <i className="fas fa-check"></i>
                            </Button>
                          </OverlayTrigger>
                        )}
                        
                        {/* Cancel button - show for DRAFT and SENT only */}
                        {(invoice.status === 'DRAFT' || invoice.status === 'SENT') && (
                          <OverlayTrigger placement="top" overlay={<Tooltip>Cancel Invoice</Tooltip>}>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => updateStatus(invoice.id, 'CANCELLED')}
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          </OverlayTrigger>
                        )}
                        
                        <OverlayTrigger placement="top" overlay={<Tooltip>Delete Invoice</Tooltip>}>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(invoice.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </OverlayTrigger>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Invoice Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Invoice Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Customer Details Section - Collapsible */}
            <Card className="mb-3">
              <Card.Header 
                className="d-flex justify-content-between align-items-center bg-light"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowCustomerDetails(!showCustomerDetails)}
              >
                <h6 className="mb-0">
                  <i className="fas fa-user me-2"></i>
                  Customer Details (Optional - Click to {showCustomerDetails ? 'collapse' : 'expand'})
                </h6>
                <i className={`fas ${showCustomerDetails ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </Card.Header>
              <Collapse in={showCustomerDetails}>
                <Card.Body>
                  <div className="text-muted mb-3">
                    <small>
                      <i className="fas fa-info-circle me-1"></i>
                      Leave blank for cash sales. Email is required to send invoices electronically.
                    </small>
                  </div>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Customer Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.customerName}
                          onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                          placeholder="Enter customer name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Customer Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={formData.customerEmail}
                          onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                          placeholder="customer@example.com"
                        />
                        <Form.Text className="text-muted">
                          <i className="fas fa-envelope me-1"></i> Required to send invoice electronically
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Customer Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          value={formData.customerPhone}
                          onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                          placeholder="+1 (555) 123-4567"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-0">
                    <Form.Label>Customer Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.customerAddress}
                      onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                      placeholder="Enter customer's billing address..."
                    />
                  </Form.Group>
                </Card.Body>
              </Collapse>
            </Card>

            {/* Invoice Items */}
            <h5>Invoice Items</h5>
            <div className="border p-3 mb-3">
              {/* Column Headers */}
              <Row className="mb-2">
                <Col md={3}>
                  <strong>Product <span className="text-danger">*</span></strong>
                  <br />
                  <small className="text-muted">Search by name, code, or category</small>
                </Col>
                <Col md={1}>
                  <strong>Qty <span className="text-danger">*</span></strong>
                </Col>
                <Col md={1}>
                  <strong>MRP</strong>
                </Col>
                <Col md={1}>
                  <strong>Price <span className="text-danger">*</span></strong>
                </Col>
                <Col md={1}>
                  <strong>Savings</strong>
                </Col>
                <Col md={2}>
                  <strong>Total</strong>
                </Col>
                <Col md={2}>
                  <strong>Description</strong>
                </Col>
                <Col md={1}>
                  <strong>Action</strong>
                </Col>
              </Row>
              
              {formData.items.map((item, index) => (
                <Row key={index} className="mb-3">
                  <Col md={3}>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        placeholder="Search products by name, code, or category..."
                        value={item.productId ? getSelectedProductName(item.productId) : (productSearchTerms[index] || '')}
                        onChange={(e) => {
                          if (item.productId) {
                            // If a product is selected, clear it when user starts typing
                            updateItem(index, 'productId', '');
                            updateItem(index, 'unitPrice', 0);
                            updateItem(index, 'description', '');
                          }
                          handleProductSearch(index, e.target.value);
                        }}
                        onFocus={() => {
                          if (!item.productId) {
                            setShowProductDropdown({ ...showProductDropdown, [index]: true });
                          }
                        }}
                        onClick={() => {
                          if (item.productId) {
                            // Clear selection when clicking on selected product
                            updateItem(index, 'productId', '');
                            updateItem(index, 'unitPrice', 0);
                            updateItem(index, 'description', '');
                            setProductSearchTerms({ ...productSearchTerms, [index]: '' });
                            setShowProductDropdown({ ...showProductDropdown, [index]: false });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowProductDropdown({ ...showProductDropdown, [index]: false });
                          } else if (e.key === 'Enter' && showProductDropdown[index]) {
                            const filtered = getFilteredProducts(index);
                            if (filtered.length === 1) {
                              selectProduct(index, filtered[0]);
                            }
                          }
                        }}
                        className={item.productId ? 'product-selected' : ''}
                        style={{ cursor: item.productId ? 'pointer' : 'text' }}
                        title={item.productId ? 'Click to clear selection' : 'Search for products'}
                        readOnly={!!item.productId}
                        required
                      />
                      {showProductDropdown[index] && !item.productId && (
                        <div 
                          className="position-absolute w-100 bg-white border product-dropdown shadow-sm"
                          style={{ 
                            zIndex: 1000, 
                            maxHeight: '250px', 
                            overflowY: 'auto',
                            top: '100%'
                          }}
                        >
                          {getFilteredProducts(index).length === 0 ? (
                            <div className="p-3 text-muted text-center">
                              <i className="fas fa-search me-2"></i>
                              No products found. Try different keywords.
                            </div>
                          ) : (
                            <>
                              {getFilteredProducts(index).slice(0, 10).map((product) => (
                                <div
                                  key={product.id}
                                  className="p-2 border-bottom product-dropdown-item"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => selectProduct(index, product)}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <strong>{product.name}</strong>
                                      <div>
                                        <small className="text-muted">
                                          {product.code} • MRP: ₹{product.mrp} • Price: ₹{product.price}
                                        </small>
                                      </div>
                                      {product.mrp && product.price && product.mrp > product.price && (
                                        <small className="text-success">
                                          <i className="fas fa-tag"></i> Save: ₹{(product.mrp - product.price).toFixed(2)}
                                        </small>
                                      )}
                                    </div>
                                    <div className="text-end">
                                      <small className={`badge ${product.quantity === 0 ? 'bg-danger text-white' : product.quantity <= product.minStockLevel ? 'bg-warning text-dark' : 'bg-success'}`}>
                                        {product.quantity === 0 ? 'OUT OF STOCK' : product.quantity}
                                      </small>
                                      {product.quantity === 0 && (
                                        <div>
                                          <small className="text-danger">
                                            <i className="fas fa-exclamation-triangle"></i> Zero Stock
                                          </small>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {getFilteredProducts(index).length > 10 && (
                                <div className="p-2 text-center text-muted">
                                  <small>Showing 10 of {getFilteredProducts(index).length} products. Continue typing to refine search.</small>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {item.productId && (
                        <div 
                          className="position-absolute d-flex align-items-center justify-content-center"
                          style={{ 
                            right: '10px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            width: '24px',
                            height: '24px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            border: '2px solid #28a745'
                          }}
                        >
                          <i className="fas fa-check text-success" style={{ fontSize: '12px' }}></i>
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col md={1}>
                    <Form.Control
                      type="number"
                      min={(() => {
                        const product = products.find(p => p.id === parseInt(item.productId));
                        return product && product.unit === 'PIECES' ? '1' : '0.001';
                      })()}
                      step={(() => {
                        const product = products.find(p => p.id === parseInt(item.productId));
                        return product && product.unit === 'PIECES' ? '1' : '0.001';
                      })()}
                      value={item.quantity === '' ? '' : item.quantity}
                      onChange={(e) => {
                        const product = products.find(p => p.id === parseInt(item.productId));
                        const inputValue = e.target.value;
                        
                        if (inputValue === '') {
                          updateItem(index, 'quantity', '');
                          return;
                        }
                        
                        if (product && product.unit === 'PIECES') {
                          const value = parseInt(inputValue);
                          if (!isNaN(value) && value >= 1) {
                            updateItem(index, 'quantity', value);
                          }
                        } else {
                          const value = parseFloat(inputValue);
                          if (!isNaN(value) && value >= 0.001) {
                            updateItem(index, 'quantity', value);
                          }
                        }
                      }}
                      onFocus={(e) => {
                        // Auto-select the content when focused for easy replacement
                        e.target.select();
                      }}
                      placeholder="Enter quantity"
                      required
                    />
                    {(() => {
                      const product = products.find(p => p.id === parseInt(item.productId));
                      return product && (
                        <div>
                          <Form.Text className="text-muted small">
                            {product.unit} {product.unit === 'PIECES' ? '(whole)' : '(decimal)'}
                          </Form.Text>
                          {product.quantity === 0 && (
                            <Form.Text className="text-danger small">
                              <i className="fas fa-exclamation-triangle"></i> OUT OF STOCK
                            </Form.Text>
                          )}
                          {product.quantity > 0 && product.quantity <= product.minStockLevel && (
                            <Form.Text className="text-warning small">
                              <i className="fas fa-low-vision"></i> Low Stock: {product.quantity} left
                            </Form.Text>
                          )}
                        </div>
                      );
                    })()}
                  </Col>
                  <Col md={1}>
                    <div className="form-control" style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da', padding: '0.375rem 0.75rem', fontSize: '0.85rem' }}>
                      {(() => {
                        const product = products.find(p => p.id === parseInt(item.productId));
                        return product?.mrp ? `₹${product.mrp}` : '-';
                      })()}
                    </div>
                  </Col>
                  <Col md={1}>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                      placeholder="Price"
                      required
                    />
                  </Col>
                  <Col md={1}>
                    <div className="form-control" style={{ backgroundColor: '#e7f5e7', border: '1px solid #28a745', padding: '0.375rem 0.75rem', fontSize: '0.85rem' }}>
                      {(() => {
                        const product = products.find(p => p.id === parseInt(item.productId));
                        const qty = parseFloat(item.quantity) || 0;
                        if (product?.mrp && item.unitPrice && product.mrp > item.unitPrice && qty > 0) {
                          const savings = ((product.mrp - item.unitPrice) * qty).toFixed(2);
                          return <span className="text-success"><strong>₹{savings}</strong></span>;
                        }
                        return '-';
                      })()}
                    </div>
                  </Col>
                  <Col md={2}>
                    <div className="form-control" style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da', padding: '0.375rem 0.75rem' }}>
                      <strong>₹{((parseFloat(item.quantity) || 0) * (item.unitPrice || 0)).toFixed(2)}</strong>
                    </div>
                  </Col>
                  <Col md={2}>
                    <Form.Control
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </Col>
                  <Col md={1}>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeItem(index)}
                      title="Remove item"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button variant="outline-primary" onClick={addItem}>
                <i className="fas fa-plus me-2"></i>
                Add Item
              </Button>
            </div>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Amount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData({...formData, taxAmount: parseFloat(e.target.value) || 0})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Amount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData({...formData, discountAmount: parseFloat(e.target.value) || 0})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                {/* Invoice Total Preview */}
                <div className="border rounded p-3 bg-light">
                  <h6 className="mb-3 text-primary">
                    <i className="fas fa-calculator me-2"></i>
                    Invoice Summary
                  </h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <strong>₹{calculateSubtotal().toFixed(2)}</strong>
                  </div>
                  {(() => {
                    const totalSavings = formData.items.reduce((sum, item) => {
                      const product = products.find(p => p.id === parseInt(item.productId));
                      const qty = parseFloat(item.quantity) || 0;
                      if (product?.mrp && item.unitPrice && product.mrp > item.unitPrice && qty > 0) {
                        return sum + ((product.mrp - item.unitPrice) * qty);
                      }
                      return sum;
                    }, 0);
                    return totalSavings > 0 && (
                      <div className="d-flex justify-content-between mb-2" style={{ backgroundColor: '#d4edda', padding: '5px', borderRadius: '3px' }}>
                        <span className="text-success"><i className="fas fa-tag me-1"></i>You Saved:</span>
                        <strong className="text-success">₹{totalSavings.toFixed(2)}</strong>
                      </div>
                    );
                  })()}
                  {formData.taxAmount > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>+ Tax:</span>
                      <strong>₹{(formData.taxAmount || 0).toFixed(2)}</strong>
                    </div>
                  )}
                  {formData.discountAmount > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-danger">
                      <span>- Discount:</span>
                      <strong>₹{(formData.discountAmount || 0).toFixed(2)}</strong>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold">Total Amount:</span>
                    <strong className="text-primary h5">₹{calculateTotal().toFixed(2)}</strong>
                  </div>
                </div>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes or terms..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <div className="d-flex gap-2">
              <Button variant="primary" type="submit">
                {editingInvoice ? 'Update' : 'Create'} Invoice
              </Button>
              {formData.status !== 'PAID' && (
                <Button 
                  variant="success" 
                  onClick={handleSubmitAndMarkPaid}
                  className="d-flex align-items-center"
                >
                  <i className="fas fa-check-circle me-2"></i>
                  {editingInvoice ? 'Update & Mark Paid' : 'Create & Mark Paid'}
                </Button>
              )}
            </div>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Invoices;
