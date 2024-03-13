import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout';
import { Space, Table, Button, Modal, Checkbox } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { server } from '../constant';

const { Column } = Table;

const renderProgressLevels = (text, record) => {
  const levels = ['level1', 'level2', 'level3', 'level4'];
  let selectedLevelIndex = levels.indexOf(record.ProgressLevel);

  if (selectedLevelIndex > 0) {
    selectedLevelIndex -= 1;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {levels.slice(0, levels.length - 1).map((level, index) => (
        <React.Fragment key={level}>
          {index > 0 && (
            <div
              style={{
                width: '20px',
                height: '1px',
                backgroundColor: 'black',
                margin: '0 5px',
              }}
            />
          )}
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: index <= selectedLevelIndex ? '#62bf62' : 'transparent',
              border: '1px solid black',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {level.replace('level', '')}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};


const InboxPage = () => {
  const [data, setData] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    setUserRole(getUserRoleFromAuth());
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${server}/getData`);
      const result = await response.json();
      setData(result.assets);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleApprove = (record) => {
    setSelectedAsset(record);
    setIsApproveModalVisible(true);
  };

  const handleReject = (record) => {
    setSelectedAsset(record);
    setIsRejectModalVisible(true);
  };

  const handleModify = (record) => {
    navigate("/ModifyPage", { state: { record } });
  };
  const handleApproveModalOk = async () => {
    try {
      setIsApproveModalVisible(false);

      const userRole = getUserRoleFromAuth();
      const status = userRole === 'role2' ? 'Pending' : 'Approved';
      let progressLevel = '';

      if (userRole === 'role2') {
        progressLevel = 'level2';
      } else if (userRole === 'role3') {
        progressLevel = 'level3';
      } else {
        progressLevel = 'level1';
      }

      const response = await fetch(`${server}/approveAsset/${selectedAsset._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      console.log(result.message);

      if (userRole === 'role2' || userRole === 'role3') {
        const updateProgressResponse = await fetch(`${server}/updateProgressLevel/${selectedAsset._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ progressLevel }),
        });

        const updateProgressResult = await updateProgressResponse.json();
        console.log(updateProgressResult.message);
      }

      fetchData();
      setSelectedAsset(null);
    } catch (error) {
      console.error('Error approving asset:', error);
    }
  };

  const handleRejectModalOk = async () => {
    try {
      setIsRejectModalVisible(false);

      const response = await fetch(`${server}/rejectAsset/${selectedAsset._id}`, {
        method: 'POST',
      });

      const result = await response.json();
      console.log(result.message);

      fetchData();
      setSelectedAsset(null);
    } catch (error) {
      console.error('Error rejecting asset:', error);
    }
  };

  const handlePaymentChange = async (record) => {
    try {
      const response = await fetch(`${server}/updatePayment/${record._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment: !record.Payment }),
      });

      const result = await response.json();
      console.log(result.message);

      fetchData();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const areLevelsOneTwoAndThreeGreen = (record) => {
    const levels = ['level1', 'level2', 'level3'];
    let selectedLevelIndex = levels.indexOf(record.ProgressLevel);

    // Check if the last completed level is 2
    return selectedLevelIndex >= 1;
  };

  const paginationConfig = {
    pageSize: 5,
    showSizeChanger: false,
    showQuickJumper: false,
    total: data.length,

  };

  return (
    <Layout>
      <h1>InboxPage</h1>

      <div style={{ flex: '1', width: '100%' }}>
        <Table dataSource={data} pagination={paginationConfig}>
          <Column title="Select_Asset" dataIndex="assetType" key="assetType" />
          <Column title="Quantity" dataIndex="Quantity" key="Quantity" />
          <Column title="Unit Price" dataIndex="unitPrice" key="unitPrice" />
          <Column title="Total Price" dataIndex="totalPrice" key="totalPrice" />
          <Column title="Total Price with GST" dataIndex="totalPriceWithGST" key="totalPriceWithGST" />
          {/* <Column title="Status" dataIndex="status" key="status" /> */}
          <Column
            title="Status"
            dataIndex="status"
            key="status"
            filters={[
              { text: 'Pending', value: 'Pending' },
              { text: 'Approved', value: 'Approved' },
              { text: 'Rejected', value: 'Rejected' },
            ]}
            onFilter={(value, record) => record.status === value}
            render={(text) => (
              <span style={{ textTransform: 'capitalize' }}>{text}</span>
            )}
          />
          <Column title="Progress Level" dataIndex="ProgressLevel" key="ProgressLevel" render={renderProgressLevels} />
          <Column
            title="Payment"
            key="payment"
            render={(_, record) => (
              <Checkbox
                checked={record.payment}
                onChange={() => handlePaymentChange(record)}
                disabled={true} // Always disabled
              />
            )}
          />
          <Column title="Created By" dataIndex="CreatedBy" key="CreatedBy" />
          <Column title="Created Date" dataIndex="CreatedDate" key="CreatedDate" />
          <Column
            title="Action"
            key="action"
            render={(_, record) => (
              <Space size="middle">
                {(userRole === 'role1') ? (
                  <Button
                    type="primary"
                    style={{ backgroundColor: 'blue', width: '50px', height: '40px' }}
                    onClick={() => handlePaymentChange(record)}
                    disabled={record.status === 'Delivered' || !areLevelsOneTwoAndThreeGreen(record)}
                  >
                    D
                  </Button>
                ) : ''}
                {(userRole === 'role2' || userRole === 'role3') ? (
                  <>
                    <Button
                      type="primary"
                      style={{ backgroundColor: 'green', width: '50px', height: '40px' }}
                      onClick={() => handleApprove(record)}
                      disabled={record.status === 'Rejected'}
                    >
                      A
                    </Button>
                    <Button
                      type="primary"
                      style={{ backgroundColor: 'red', width: '50px', height: '40px' }}
                      onClick={() => handleReject(record)}
                      disabled={record.status === 'Rejected'}
                    >
                      R
                    </Button>
                    <Button
                      type="primary"
                      style={{ backgroundColor: 'blue', width: '50px', height: '40px' }}
                      onClick={() => handleModify(record)}
                      disabled={record.status === 'Rejected'}
                    >
                      M
                    </Button>
                  </>
                ) : ''}
              </Space>
            )}
          />
        </Table>
      </div>

      <Modal title="Confirm Approval" visible={isApproveModalVisible} onOk={handleApproveModalOk} onCancel={() => setIsApproveModalVisible(false)}>
        <p>Are you sure you want to approve this asset?</p>
      </Modal>

      <Modal title="Confirm Rejection" visible={isRejectModalVisible} onOk={handleRejectModalOk} onCancel={() => setIsRejectModalVisible(false)}>
        <p>Are you sure you want to reject this asset?</p>
      </Modal>
    </Layout>
  );
};

function getUserRoleFromAuth() {
  const loggedInUserRole = JSON.parse(localStorage.getItem('role'));
  return loggedInUserRole

}

export default InboxPage;