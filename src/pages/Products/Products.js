import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Form, Modal, Alert, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { handleApiError } from '../../utils/errorHandler';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    quantity: '',
    minStockLevel: '',
    category: '',
    unit: 'PIECES',
    active: true
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadUnits();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/products');
      // Backend returns Page<ProductDto>, so we need the content property
      setProducts(response.data.content || []);
    } catch (error) {
      handleApiError(error, toast);
      // Set empty array on error to prevent filter errors
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get('/products/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadUnits = async () => {
    try {
      const response = await axios.get('/products/units');
      setUnits(response.data);
    } catch (error) {
      console.error('Error loading units:', error);
      // Fallback units if API fails
      setUnits([
        { name: 'PIECES', displayName: 'Pieces', code: 'pcs' },
        { name: 'KILOGRAMS', displayName: 'Kilograms', code: 'kg' },
        { name: 'GRAMS', displayName: 'Grams', code: 'g' },
        { name: 'LITERS', displayName: 'Liters', code: 'L' }
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`/products/${editingProduct.id}`, formData);
        toast.success('Product updated successfully');
      } else {
        await axios.post('/products', formData);
        toast.success('Product created successfully');
      }
      loadProducts();
      setShowModal(false);
      resetForm();
    } catch (error) {
      handleApiError(error, toast);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/products/${id}`);
        toast.success('Product deleted successfully');
        loadProducts();
      } catch (error) {
        handleApiError(error, toast);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      mrp: '',
      quantity: '',
      minStockLevel: '',
      category: '',
      unit: 'PIECES',
      active: true
    });
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', bulkFile);

    try {
      const response = await axios.post('/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.errors && response.data.errors.length > 0) {
        const errorMessages = response.data.errors.map(error => 
          `Row ${error.row}: ${error.field} - ${error.message}`
        ).join('\n');
        toast.error(`Upload completed with errors:\n${errorMessages}`);
      } else {
        toast.success('Products uploaded successfully');
      }
      
      loadProducts();
      setShowBulkUpload(false);
      setBulkFile(null);
    } catch (error) {
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => 
          `Row ${err.row}: ${err.field} - ${err.message}`
        ).join('\n');
        toast.error(`Upload failed:\n${errorMessages}`);
      } else {
        handleApiError(error, toast);
      }
    }
  };

  const downloadTemplate = () => {
    const csvContent = "name,description,price,mrp,quantity,minStockLevel,category,unit\nSample Product,Sample Description,10.00,15.00,100,10,Electronics,PIECES\nMilk,Fresh milk,2.50,3.00,50,10,Dairy,LITERS\nApples,Red apples,3.25,4.50,25,5,Fruits,KILOGRAMS";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container-fluid">
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Products Management</h4>
              <div>
                <Button 
                  variant="outline-success" 
                  className="me-2"
                  onClick={() => setShowBulkUpload(true)}
                >
                  Bulk Upload
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => setShowModal(true)}
                >
                  Add Product
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Control
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button variant="outline-secondary" onClick={loadProducts}>
                    Refresh
                  </Button>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Table responsive striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>MRP</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Min Stock</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.description}</td>
                        <td>₹{product.mrp}</td>
                        <td>₹{product.price}</td>
                        <td>
                          <span className={product.quantity <= product.minStockLevel ? 'text-danger fw-bold' : ''}>
                            {product.quantity}
                          </span>
                        </td>
                        <td>{product.unit}</td>
                        <td>{product.minStockLevel}</td>
                        <td>{product.category}</td>
                        <td>
                          <Badge bg={product.active ? 'success' : 'secondary'}>
                            {product.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <OverlayTrigger
                            overlay={<Tooltip>Edit Product</Tooltip>}
                          >
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="me-1"
                              onClick={() => handleEdit(product)}
                            >
                              Edit
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger
                            overlay={<Tooltip>Delete Product</Tooltip>}
                          >
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                            >
                              Delete
                            </Button>
                          </OverlayTrigger>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="10" className="text-center text-muted py-4">
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Product Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? 'Edit Product' : 'Add New Product'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>MRP (Maximum Retail Price) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.mrp}
                    onChange={(e) => setFormData({...formData, mrp: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Selling Price *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit *</Form.Label>
                  <Form.Select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    required
                  >
                    {units.map(unit => (
                      <option key={unit.name || unit} value={unit.name || unit}>
                        {unit.displayName || unit} ({unit.code || unit})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Stock Level *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  />
                </Form.Group>
              </Col>
            </Row>


          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingProduct ? 'Update' : 'Create'} Product
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal show={showBulkUpload} onHide={() => setShowBulkUpload(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Bulk Upload Products</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>CSV Format Required:</strong>
            <br />
            Columns: name, description, price, mrp, quantity, minStockLevel, category, unit
            <br />
            Units must be one of: PIECES, KILOGRAMS, GRAMS, LITERS
            <br />
            <small>Note: Products with PIECES unit allow only whole number quantities in invoices</small>
          </Alert>
          
          <Form.Group className="mb-3">
            <Form.Label>Select CSV File</Form.Label>
            <Form.Control
              type="file"
              accept=".csv"
              onChange={(e) => setBulkFile(e.target.files[0])}
            />
          </Form.Group>
          
          <div className="d-grid gap-2">
            <Button variant="outline-secondary" onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkUpload(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleBulkUpload}>
            Upload Products
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Products;
