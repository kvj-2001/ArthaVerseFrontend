import React, { useState, useEffect } from 're  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/products/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadUnits = async () => {
    try {
      const response = await axios.get('/api/products/units');
      setUnits(response.data);
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };mport { Row, Col, Card, Button, Table, Form, Modal, Alert, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
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
      const response = await axios.get('/products?page=0&size=1000&sort=name,asc');
      setProducts(response.data.content || []);
    } catch (error) {
      handleApiError(error, toast, 'Error loading products');
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get('/products/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
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
      setShowModal(false);
      resetForm();
      loadProducts();
      loadCategories();
    } catch (error) {
      handleApiError(error, toast, 'Error saving product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/products/${id}`);
        toast.success('Product deleted successfully');
        loadProducts();
      } catch (error) {
        handleApiError(error, toast, 'Error deleting product');
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      minStockLevel: product.minStockLevel.toString(),
      category: product.category,
      unit: product.unit || '',
      active: product.active
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      minStockLevel: '',
      category: '',
      unit: '',
      active: true
    });
    setEditingProduct(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error('Please select a CSV file');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', bulkFile);

    try {
      await axios.post('/products/bulk-upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Products uploaded successfully');
      setShowBulkUpload(false);
      setBulkFile(null);
      loadProducts();
      loadCategories();
    } catch (error) {
      handleApiError(error, toast, 'Error uploading products');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Products</h1>
        <div>
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>Upload products from CSV file</Tooltip>}
          >
            <Button
              variant="outline-primary"
              className="me-2"
              onClick={() => setShowBulkUpload(true)}
            >
              <i className="fas fa-upload me-2"></i>
              Bulk Upload
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>Create a new product</Tooltip>}
          >
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <i className="fas fa-plus me-2"></i>
              Add Product
            </Button>
          </OverlayTrigger>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search Products</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Category</Form.Label>
                <Form.Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Products Table */}
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
                  <th>Code <small className="text-muted">(Auto)</small></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.code}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>₹{product.price}</td>
                    <td>
                      <span className={product.quantity <= product.minStockLevel ? 'low-stock' : ''}>
                        {product.quantity}
                      </span>
                      {product.quantity <= product.minStockLevel && (
                        <Badge bg="danger" className="ms-2">Low Stock</Badge>
                      )}
                    </td>
                    <td>
                      <Badge bg={product.active ? 'success' : 'secondary'}>
                        {product.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Edit Product</Tooltip>}
                      >
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(product)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                      </OverlayTrigger>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Delete Product</Tooltip>}
                      >
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </OverlayTrigger>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Product Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? 'Edit Product' : 'Add Product'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {!editingProduct && (
              <Alert variant="info" className="mb-3">
                <small><i className="fas fa-info-circle me-2"></i>
                Product code will be automatically generated upon creation.</small>
              </Alert>
            )}
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="e.g., pcs, kg, lbs"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Min Stock Level</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Check
              type="checkbox"
              label="Active"
              checked={formData.active}
              onChange={(e) => setFormData({...formData, active: e.target.checked})}
            />
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
            <strong>CSV Format:</strong> name, description, price, quantity, minStockLevel, category, unit
            <br />
            <small><em>Note: Product codes will be automatically generated.</em></small>
          </Alert>
          <Form.Group>
            <Form.Label>Select CSV File</Form.Label>
            <Form.Control
              type="file"
              accept=".csv"
              onChange={(e) => setBulkFile(e.target.files[0])}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkUpload(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleBulkUpload}>
            Upload
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Products;
