import React, { useState } from 'react';
import Layout from '../Components/Layout';
import { Row, Col, Form, Select, Input, Button, Upload, Empty, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { server } from '../constant';

const { Option } = Select;

const CreateAsset = () => {
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [form] = Form.useForm();
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalPriceWithGST, setTotalPriceWithGST] = useState(0);



  const handleQuantityChange = (value) => {
    const unitPrice = form.getFieldValue('unitPrice');
    const totalPrice = value && unitPrice ? parseFloat(value) * parseFloat(unitPrice) : 0;
    const totalPriceWithGST = totalPrice * 1.18; // Assuming GST is 18%
    setTotalPrice(totalPrice);
    setTotalPriceWithGST(totalPriceWithGST);
    form.setFieldsValue({ 'totalPrice': totalPrice, 'totalPriceWithGST': totalPriceWithGST });
  };

  const handleUnitPriceChange = (value) => {
    const quantity = form.getFieldValue('Quantity');
    const totalPrice = quantity && value ? parseFloat(quantity) * parseFloat(value) : 0;
    const totalPriceWithGST = totalPrice * 1.18; // Assuming GST is 18%
    setTotalPrice(totalPrice);
    setTotalPriceWithGST(totalPriceWithGST);
    form.setFieldsValue({ 'totalPrice': totalPrice, 'totalPriceWithGST': totalPriceWithGST });
  };

  const handleSubmit = async (values) => {
    try {

      if (!uploadedDocument) {
        message.error('Please upload the document');
        return;
      }
      const documentUrl = await uploadDocumentToS3();

      values.url = documentUrl;

      console.log(values);

      const response = await axios.post(`${server}/submitForm`, values);

      if (response.status === 200) {
        console.log('Form data sent to the API successfully.');
        form.resetFields();
        setTotalPrice(0);
        setTotalPriceWithGST(0);
        setUploadedDocument(null);
        message.success('Asset request created successfully.');
      } else {
        console.error('Error sending form data to the API.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const uploadDocumentToS3 = async () => {
    try {
      const formData = new FormData();
      formData.append('file', uploadedDocument);

      const response = await axios.post(`${server}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.url) {
        return response.data.url;
      } else {
        message.error('Invalid API response. URL not found.');
        return null;
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      return null;
    }
  };

  const uploadProps = {
    name: 'file',
    showUploadList: false,
    customRequest: ({ file, onSuccess }) => {
      setUploadedDocument(file);
      onSuccess();
    },
  };



  return (
    <Layout>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={12} style={{ marginTop: '40px' }}>
          <div style={{ width: '100%', height: '100%' }}>
            <Form
              style={{ backgroundColor: 'white', padding: '10px', minHeight: '80%' }}
              layout="vertical"
              onFinish={handleSubmit}
              form={form}
            >
              <h1 style={{ display: 'flex' }}>Create Asset Request Form</h1>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Asset Type"
                    name="assetType"
                    rules={[{ required: true, message: 'Please select the asset type' }]}
                  >
                    <Select style={{ width: '100%' }} placeholder="Select the asset">
                      <Option value="laptop">Laptop</Option>
                      <Option value="monitor">Monitor</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Quantity"
                    name="Quantity"
                    rules={[{ required: true, message: 'Please enter the quantity' }]}
                  >
                    <Input
                      style={{ width: '100%' }}
                      type='number'
                      onKeyDown={(e) => e.key === '.' && e.preventDefault()}
                      // onInput={(e) => e.target.value = e.target.value.replace(/[^\d]/g, '')}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Unit Price"
                    name="unitPrice"
                    rules={[{ required: true, message: 'Please enter the unit price' }]}
                  >
                    {/* <Input style={{ width: '100%' }} type='number' pattern="[0.9]*" step='0.01' onChange={(e) => handleUnitPriceChange(e.target.value)} /> */}
                    <Input
                      style={{ width: '100%' }}
                      type='number'
                      onKeyDown={(e) => e.key === '.' && e.preventDefault()}
                      onInput={(e) => e.target.value = e.target.value.replace(/[^\d]/g, '')}
                      onChange={(e) => handleUnitPriceChange(e.target.value)} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Total Price"
                    name="totalPrice"
                    rules={[{ required: true, message: 'Please enter the total price' }]}
                  >
                    <Input style={{ width: '100%' }} value={totalPrice} disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Total Price with GST"
                    name="totalPriceWithGST"
                    rules={[{ required: true, message: 'Please enter the total price with GST' }]}
                  >
                    <Input style={{ width: '100%' }} value={totalPriceWithGST} disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" style={{ width: '100px', height: '45px', marginTop: '20px' }}>
                      Submit
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        </Col>
        <Col xs={24} sm={12} md={12} style={{ border: '1px solid lightpink', marginTop: '40px', overflowY: 'auto' }}>
          <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'scroll' }}>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
            <div style={{ width: '100%', overflowY: 'auto', marginTop: '10px' }}>
              {uploadedDocument ? (
                <embed src={URL.createObjectURL(uploadedDocument)} type="application/pdf" style={{ width: '100%', height: '300px' }} />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
};

export default CreateAsset;



















































// import React, { useState } from 'react';
// import Layout from '../Components/Layout';
// import { Row, Col, Form, Select, Input, Button, Upload, Empty, message } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import axios from 'axios';

// const { Option } = Select;

// const CreateAsset = () => {
//   const [uploadedDocument, setUploadedDocument] = useState(null);
//   const [form] = Form.useForm();
//   const [totalPrice, setTotalPrice] = useState(0);
//   const [totalPriceWithGST, setTotalPriceWithGST] = useState(0);

//   const handleQuantityChange = (value) => {
//     const unitPrice = form.getFieldValue('unitPrice');
//     const totalPrice = value && unitPrice ? parseFloat(value) * parseFloat(unitPrice) : 0;
//     const totalPriceWithGST = totalPrice * 1.18; // Assuming GST is 18%
//     setTotalPrice(totalPrice);
//     setTotalPriceWithGST(totalPriceWithGST);
//     form.setFieldsValue({ 'totalPrice': totalPrice, 'totalPriceWithGST': totalPriceWithGST });
//   };

//   const handleUnitPriceChange = (value) => {
//     const quantity = form.getFieldValue('Quantity');
//     const totalPrice = quantity && value ? parseFloat(quantity) * parseFloat(value) : 0;
//     const totalPriceWithGST = totalPrice * 1.18; // Assuming GST is 18%
//     setTotalPrice(totalPrice);
//     setTotalPriceWithGST(totalPriceWithGST);
//     form.setFieldsValue({ 'totalPrice': totalPrice, 'totalPriceWithGST': totalPriceWithGST });
//   };

//   const handleSubmit = async (values) => {
//     try {

//       if (!uploadedDocument) {
//         message.error('Please upload the document');
//         return;
//       }
//       const documentUrl = await uploadDocumentToS3();

//       values.url = documentUrl;

//       console.log(values);

//       const response = await axios.post('http://localhost:3001/submitForm', values);

//       if (response.status === 200) {
//         console.log('Form data sent to the API successfully.');
//         form.resetFields();
//         setTotalPrice(0);
//         setTotalPriceWithGST(0);
//         setUploadedDocument(null);
//         message.success('Asset request created successfully.');
//       } else {
//         console.error('Error sending form data to the API.');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//     }
//   };

//   const uploadDocumentToS3 = async () => {
//     try {
//       const formData = new FormData();
//       formData.append('file', uploadedDocument);

//       const response = await axios.post('http://localhost:3001/upload', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       if (response.data && response.data.url) {
//         return response.data.url;
//       } else {
//         message.error('Invalid API response. URL not found.');
//         return null;
//       }
//     } catch (error) {
//       console.error('Failed to upload document:', error);
//       return null;
//     }
//   };

//   const uploadProps = {
//     name: 'file',
//     showUploadList: false,
//     customRequest: ({ file, onSuccess }) => {
//       setUploadedDocument(file);
//       onSuccess();
//     },
//   };

//   return (
//     <Layout>
//       <Row gutter={[16, 16]}>
//         <Col xs={24} sm={12} md={12} style={{ marginTop: '40px' }}>
//           <div style={{ width: '100%', height: '100%' }}>
//             <Form
//               style={{ backgroundColor: 'white', padding: '10px', minHeight: '80%' }}
//               layout="vertical"
//               onFinish={handleSubmit}
//               form={form}
//             >
//               <h1 style={{ display: 'flex' }}>Create Asset Request Form</h1>
//               <Row gutter={[16, 16]}>
//                 <Col xs={24} sm={12} md={8}>
//                   <Form.Item
//                     label="Asset Type"
//                     name="assetType"
//                     rules={[{ required: true, message: 'Please select the asset type' }]}
//                   >
//                     <Select style={{ width: '100%' }} placeholder="Select the asset">
//                       <Option value="laptop">Laptop</Option>
//                       <Option value="monitor">Monitor</Option>
//                     </Select>
//                   </Form.Item>
//                 </Col>
//                 <Col xs={24} sm={12} md={8}>
//                   <Form.Item
//                     label="Quantity"
//                     name="Quantity"
//                     rules={[{ required: true, message: 'Please enter the quantity' }]}
//                   >
//                     <input type="number" onkeydown="if(event.key==='.'){event.preventDefault();}"  oninput="event.target.value = event.target.value.replace(/[^0-9]*/g,'');"></input>
//                     {/* <Input style={{ width: '100%' }} type='number' min="1" step="1"   onkeypress="return event.charCode >= 48 && event.charCode <= 57" onChange={(e) => handleQuantityChange(e.target.value)} /> */}
//                   </Form.Item>
//                 </Col>
//                 <Col xs={24} sm={12} md={8}>
//                   <Form.Item
//                     label="Unit Price"
//                     name="unitPrice"
//                     rules={[{ required: true, message: 'Please enter the unit price' }]}
//                   >
//                     <Input style={{ width: '100%' }} type='number' pattern="[0.9]*" step='0.01' onChange={(e) => handleUnitPriceChange(e.target.value)} />
//                   </Form.Item>
//                 </Col>
//                 <Col xs={24} sm={12} md={8}>
//                   <Form.Item
//                     label="Total Price"
//                     name="totalPrice"
//                     rules={[{ required: true, message: 'Please enter the total price' }]}
//                   >
//                     <Input style={{ width: '100%' }} value={totalPrice} disabled />
//                   </Form.Item>
//                 </Col>
//                 <Col xs={24} sm={12} md={8}>
//                   <Form.Item
//                     label="Total Price with GST"
//                     name="totalPriceWithGST"
//                     rules={[{ required: true, message: 'Please enter the total price with GST' }]}
//                   >
//                     <Input style={{ width: '100%' }} value={totalPriceWithGST} disabled />
//                   </Form.Item>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col xs={24} sm={12} md={8}>
//                   <Form.Item>
//                     <Button type="primary" htmlType="submit" style={{ width: '100px', height: '45px', marginTop: '20px' }}>
//                       Submit
//                     </Button>
//                   </Form.Item>
//                 </Col>
//               </Row>
//             </Form>
//           </div>
//         </Col>
//         <Col xs={24} sm={12} md={12} style={{ border: '1px solid lightpink', marginTop: '40px', overflowY: 'auto' }}>
//           <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'scroll' }}>
//             <Upload {...uploadProps}>
//               <Button icon={<UploadOutlined />}>Click to Upload</Button>
//             </Upload>
//             <div style={{ width: '100%', overflowY: 'auto', marginTop: '10px' }}>
//               {uploadedDocument ? (
//                 <embed src={URL.createObjectURL(uploadedDocument)} type="application/pdf" style={{ width: '100%', height: '300px' }} />
//               ) : (
//                 <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
//               )}
//             </div>
//           </div>
//         </Col>
//       </Row>
//     </Layout>
//   );
// };

// export default CreateAsset;






























