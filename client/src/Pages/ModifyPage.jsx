import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout';
import { Form, Input, Button, Row, Col } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { server } from '../constant';

const ModifyPage = () => {
  const { state } = useLocation();
  const [form] = Form.useForm();
  const [pdfUrl, setPdfUrl] = useState('');
  const navigate = useNavigate();
  const [totalPrice, setTotalPrice] = useState(state.record.totalPrice || 0);
  const [totalPriceWithGST, setTotalPriceWithGST] = useState(state.record.totalPriceWithGST || 0);

  const handleQuantityChange = (value) => {
    const unitPrice = form.getFieldValue('unitPrice');
    const totalPrice = value && unitPrice ? parseFloat(value) * parseFloat(unitPrice) : 0;
    const totalPriceWithGST = totalPrice * 1.18; // Assuming GST is 18%
    setTotalPrice(totalPrice);
    setTotalPriceWithGST(totalPriceWithGST);
    form.setFieldsValue({ 'totalPrice': totalPrice.toFixed(2), 'totalPriceWithGST': totalPriceWithGST.toFixed(2) });
  };

  const handleUnitPriceChange = (value) => {
    const quantity = form.getFieldValue('Quantity');
    const totalPrice = quantity && value ? parseFloat(quantity) * parseFloat(value) : 0;
    const totalPriceWithGST = totalPrice * 1.18; // Assuming GST is 18%
    setTotalPrice(totalPrice);
    setTotalPriceWithGST(totalPriceWithGST);
    form.setFieldsValue({ 'totalPrice': totalPrice.toFixed(2), 'totalPriceWithGST': totalPriceWithGST.toFixed(2) });
  };

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const response = await fetch(`${server}/getPdf/${state.record._id}`);
        if (response.ok) {
          const { url } = await response.json();
          setPdfUrl(url);
        } else {
          console.error('Failed to fetch PDF');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchPdf();
  }, [state.record._id]);

  const handleSubmit = async (values) => {
    try {
      const response = await fetch(`${server}/modifyAsset/${state.record._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        console.log('Asset modified successfully.');
        form.resetFields();
        navigate('/inboxpage');
      } else {
        console.error('Error modifying asset.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Layout>
      <Row gutter={24}>
        <Col xs={24} sm={24} md={12}>
          <div style={{ backgroundColor: 'white', padding: '10px', minHeight: '80%' }}>
            <h1>Modify Asset Page</h1>
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
              <Form.Item label="Asset Type" name="assetType" initialValue={state.record.assetType}>
                <Input disabled />
              </Form.Item>
              <Form.Item label="Quantity" name="Quantity" initialValue={state.record.Quantity} rules={[{ required: true, message: 'Please enter the quantity' }]}>
                <Input onChange={(e) => handleQuantityChange(e.target.value)} />
              </Form.Item>
              <Form.Item label="Unit Price" name="unitPrice" initialValue={state.record.unitPrice} rules={[{ required: true, message: 'Please enter the unit price' }]}>
                <Input onChange={(e) => handleUnitPriceChange(e.target.value)} />
              </Form.Item>
              <Form.Item label="Total Price" name="totalPrice" initialValue={totalPrice.toFixed(2)} rules={[{ required: true, message: 'Please enter the total price' }]}>
                <Input disabled />
              </Form.Item>
              <Form.Item label="Total Price with GST" name="totalPriceWithGST" initialValue={totalPriceWithGST.toFixed(2)} rules={[{ required: true, message: 'Please enter the total price with GST' }]}>
                <Input disabled />
              </Form.Item>
              <Form.Item>  
                <Button type="primary" htmlType="submit">Submit</Button>
              </Form.Item>
            </Form>
          </div>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <div style={{ border: '1px solid lightpink', minHeight: '80%', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2>Uploaded PDF</h2>
            <div style={{ width: '100%', overflowY: 'auto', marginTop: '10px' }}>
              {pdfUrl ? (
                <iframe src={pdfUrl}   type="application/pdf" width="100%" height="500px"  />
              ) : (
                <p>No PDF available</p>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
};

export default ModifyPage;

