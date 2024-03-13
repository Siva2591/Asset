import React, { useState, useEffect } from 'react';
import { Table,Checkbox } from 'antd';
import Layout from '../Components/Layout';
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

const Ast = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
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

  const paginationConfig = {
    pageSize: 7,
    showSizeChanger: false,
    showQuickJumper: false,
    total: data.length,
  };

  return (
    <Layout>
      <div style={{ flex: '1' }}>
        <h1>Asset Page</h1>
      </div>
      <div style={{ flex: '1', width: '100%' }}>
        <Table dataSource={data} pagination={paginationConfig}>
          <Column title="Asset Type" dataIndex="assetType" key="assetType" />
          <Column title="Quantity" dataIndex="Quantity" key="Quantity" />
          <Column title="Unit Price" dataIndex="unitPrice" key="unitPrice" />
          <Column title="Total Price" dataIndex="totalPrice" key="totalPrice" />
          <Column title="Total Price with GST" dataIndex="totalPriceWithGST" key="totalPriceWithGST" />
          
          <Column title="Created By" dataIndex="CreatedBy" key="CreatedBy" /> 
        
          <Column title="Created Date" dataIndex="CreatedDate" key="CreatedDate" /> 
          <Column title="Updated Date" dataIndex="UpdatedDate" key="UpdatedDate" /> 
          <Column title="Progress Level" dataIndex="ProgressLevel" key="ProgressLevel" render={renderProgressLevels} />
          <Column title="Status" dataIndex="status" key="status" />
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
        </Table>
      </div>
    </Layout>
  );
};
export default Ast;

























// import React, { useState, useEffect } from 'react';
// import { Table,Checkbox } from 'antd';
// import Layout from '../Components/Layout';

// const { Column } = Table;
// const renderProgressLevels = (text, record) => {
//   const levels = ['level1', 'level2', 'level3', 'level4'];
//   let selectedLevelIndex = levels.indexOf(record.ProgressLevel);

//   if (selectedLevelIndex > 0) {
//     selectedLevelIndex -= 1;
//   }

//   return (
//     <div style={{ display: 'flex', alignItems: 'center' }}>
//       {levels.slice(0, levels.length - 1).map((level, index) => (
//         <React.Fragment key={level}>
//           {index > 0 && (
//             <div
//               style={{
//                 width: '20px',
//                 height: '1px',
//                 backgroundColor: 'black',
//                 margin: '0 5px',
//               }}
//             />
//           )}
//           <div
//             style={{
//               width: '30px',
//               height: '30px',
//               borderRadius: '50%',
//               backgroundColor: index <= selectedLevelIndex ? '#62bf62' : 'transparent',
//               border: '1px solid black',
//               display: 'flex',
//               justifyContent: 'center',
//               alignItems: 'center',
//               position: 'relative',
//             }}
//           >
//             {level.replace('level', '')}
//           </div>
//         </React.Fragment>
//       ))}
//     </div>
//   );
// };

// const Ast = () => {
//   const [data, setData] = useState([]);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const response = await fetch('http://localhost:3001/getData');
//       const result = await response.json();

//       setData(result.assets);
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     }
//   };

//   const handlePaymentChange = async (record) => {
//     try {
//       const response = await fetch(`http://localhost:3001/updatePayment/${record._id}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ payment: !record.Payment }),
//       });

//       const result = await response.json();
//       console.log(result.message);

//       fetchData();
//     } catch (error) {
//       console.error('Error updating payment status:', error);
//     }
//   };

//   const paginationConfig = {
//     pageSize: 7,
//     showSizeChanger: false,
//     showQuickJumper: false,
//     total: data.length,
//   };

//   return (
//     <Layout>
//       <div style={{ flex: '1' }}>
//         <h1>Asset Page</h1>
//       </div>
//       <div style={{ flex: '1', width: '100%' }}>
//         <Table dataSource={data} pagination={paginationConfig}>
//           <Column title="Asset Type" dataIndex="assetType" key="assetType" />
//           <Column title="Quantity" dataIndex="Quantity" key="Quantity" />
//           <Column title="Unit Price" dataIndex="unitPrice" key="unitPrice" />
//           <Column title="Total Price" dataIndex="totalPrice" key="totalPrice" />
//           <Column title="Total Price with GST" dataIndex="totalPriceWithGST" key="totalPriceWithGST" />
          
//           <Column title="Created By" dataIndex="CreatedBy" key="CreatedBy" /> 
        
//           <Column title="Created Date" dataIndex="CreatedDate" key="CreatedDate" /> 
//           <Column title="Updated Date" dataIndex="UpdatedDate" key="UpdatedDate" /> 
//           <Column title="Progress Level" dataIndex="ProgressLevel" key="ProgressLevel" render={renderProgressLevels} />
//           <Column title="Status" dataIndex="status" key="status" />
//           <Column
//             title="Payment"
//             key="payment"
//             render={(_, record) => (
//               <Checkbox
//                 checked={record.payment}
//                 onChange={() => handlePaymentChange(record)}
//                 disabled={true} // Always disabled
//               />
//             )}
//           />         
//         </Table>
//       </div>
//     </Layout>
//   );
// };
// export default Ast;