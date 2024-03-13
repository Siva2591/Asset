require("dotenv").config();
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const multer = require('multer');
const AWS = require('aws-sdk');
const app = express();
const moment = require("moment");
const path = require("path");
const port = process.env.PORT || 3001;

const buildpath = path.join(__dirname, "../client/build");
app.use(express.static(buildpath));

app.use(cors());
app.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const Imap = require("imap");
const { simpleParser } = require("mailparser");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const imapConfig = {
  user: "thinkailabs111@gmail.com",
  password: "zwvu hhtq cavs zkmr",
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
};
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const imap = new Imap(imapConfig);
imap.on('ready', () => {
  imap.openBox('INBOX', false, (err, box) => {
    if (err) {
      console.error(err);
      return;
    }
    imap.on('mail', (mail) => {
      console.log('New mail received', mail);
      // fetch last mail
      const f = imap.seq.fetch(box.messages.total + ':*', { bodies: [''] });
      f.on('message', (msg) => {
        msg.on('body', async (stream) => {
          const parsed = await simpleParser(stream);
          // log subject of mail and body
          console.log(parsed.subject);
          console.log(parsed.text);

          // Check if parsed.text is defined before using it
          if (parsed.text) {
            const assetIdMatch = parsed.text.match(/Asset_Id\s*([\s\S]*?)(?=\n|$)/i);
            let assetId = "";
            if (assetIdMatch && assetIdMatch[1]) {
              assetId = assetIdMatch[1].trim();
            } else {
              console.log("Asset Id not found in the text.");
            }

            if (
              parsed.text.toLowerCase().includes("approved") ||
              parsed.text.toLowerCase().includes("accepted") ||
              parsed.text.toLowerCase().includes("ok done")
            ) {
              console.log(parsed.text);
              connectDb();
              AssetDetails.findById(assetId).then(async (res) => {
                console.log(res);
                if (res.ProgressLevel === "level1") {
                  res.ProgressLevel = "level2";
                  await res.save();
                  User.find({ role: "role3" }).then((users) => {
                    users.forEach((user) => {
                      sendEmail(res, user.email);
                    });
                  });
                } else if (res.ProgressLevel === "level2") {
                  res.ProgressLevel = "level3";
                  res.payment = false;
                  res.status = "Approved";
                  await res.save();
                  sendEmail(res, "meenakumarimaligeli@gmail.com");
                }
              });
            } else if (
              parsed.text.toLowerCase().includes("rejected") ||
              parsed.text.toLowerCase().includes("Rejected")        
            ) {
              console.log(parsed.text);
              connectDb();
              AssetDetails.findById(assetId).then(async (res) => {
                console.log(res);
                res.ProgressLevel = "level1"; // Mark as level1 for rejection
                res.status = "Rejected";
                await res.save();
                User.find({ role: "role1" }).then((users) => {
                  users.forEach((user) => {
                    sendEmail(res, user.email);
                  });
                });
              });
            }
          }
        });
        msg.once('attributes', (attrs) => {
          const uid = attrs.uid;
          imap.seq.addFlags(uid, '\\Seen', (err) => {
            if (err) {
              console.error(err);
            }
          });
        });
      });
    });
  });
});

imap.connect();


// AWS SDK Configuration
AWS.config.update({
  accessKeyId: 'AKIA47CRYM5DWZUE6HQX', // Replace with your AWS access key ID
  secretAccessKey: 'RQhphmk6HXUF12Ns2+6LiaNpB433GDQNDWV/g+4h',
  region: 'ap-south-2'
});

// S3 Configuration
const s3 = new AWS.S3();

// Handle file upload directly to S3

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Specify S3 upload parameters
  const folderName = 'filestorage';
  const date = new Date();

  const formattedDate = moment(date).format('MM-DD-YYYY');

  console.log(formattedDate);
  const params = {
    Bucket: 's3storagedetailss',
    Key: `${folderName}/${formattedDate}_${req.file.originalname}`,
    Body: req.file.buffer,
    ContentType: 'application/pdf',
    ContentDisposition: 'inline',
    ACL: 'private'
  };

  // Upload to S3
  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Failed to upload file to S3' });
    }
    res.json({ url: data.Location });
  });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));


// Connect to the MongoDB database
const connectDb = async () => {
  try {
    await mongoose.connect('mongodb+srv://rajeshdumpala1432:Tail%401234@cluster0.wyobtyc.mongodb.net/Assetdata', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Db connected');
  } catch (error) {
    console.log('Failed to connect!', error);
  }
};

// Call the connectDb function
connectDb();


// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  CreatedBy: { type: String },
  name: { type: String },
});

// Create User model
const user = mongoose.model('User', userSchema);

// Function to format date to MM-DD-YYYY
function formatDate(date) {
  const options = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

  return formattedDate;
}

// Asset Schema
const assetDetailsSchema = new mongoose.Schema({
  assetType: { type: String, required: true },
  Quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  totalPriceWithGST: { type: Number, required: true },
  status: { type: String, default: 'Pending' },
  CreatedBy: { type: String, ref: 'User' },
  CreatedDate: { type: String, default: formatDate(new Date()) },
  UpdatedDate: { type: String, default: formatDate(new Date()) },

  ProgressLevel: { type: String, default: 'level1' },
  payment: { type: Boolean, default: 'false' },
  url: { type: String },
  hiddenField: { type: String, select: false },

});


// API endpoint to register a new user
app.post('/registerUser', async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || !name || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Save the 'name' field when creating a new user
    const newUser = await User.create({ email, name, password, role });

    res.status(200).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Failed to register user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Pre-save hook to format dates
assetDetailsSchema.pre('save', function (next) {
  // Format CreatedDate
  this.CreatedDate = formatDate(new Date());

  // Format UpdatedDate
  this.UpdatedDate = formatDate(new Date());

  next();
});


// Create models from schemas
const User = mongoose.model('User', userSchema);
const AssetDetails = mongoose.model('AssetDetails', assetDetailsSchema);



// Connect to the database
connectDb();


/// apis
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid user' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.json({ message: 'Authentication successful', user, role: user.role, CreatedBy: user.CreatedBy });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Form submission endpoint
app.post('/submitForm', async (req, res) => {
  try {

    const formData = req.body;
    const assetId = formData._id;

    if (assetId) {
      // If assetId is provided, update the existing asset
      const existingAsset = await AssetDetails.findById(assetId);

      if (!existingAsset) {
        return res.status(404).json({ error: 'Asset not found for modification' });
      }

      existingAsset.assetType = formData.assetType;
      existingAsset.Quantity = formData.Quantity;
      existingAsset.unitPrice = formData.unitPrice;
      existingAsset.totalPrice = formData.totalPrice;

      // Add CreatedBy field when updating the asset
      existingAsset.CreatedBy = formData.CreatedBy;

      await existingAsset.save();

      res.status(200).json({ message: 'Asset updated successfully', asset: existingAsset });
    } else {
      // If assetId is not provided, create a new asset
      // Fetch user details based on the submitted email
      const user = await User.findOne({ email: 'shaikdadavali092@gmail.com' });



      if (!user) {
        return res.status(404).json({ error: 'User not found for the submitted email' });
      }

      const asset = await AssetDetails.create({
        ...formData,
        // Add CreatedBy field with the user's name when creating a new asset
        CreatedBy: user.CreatedBy,
        //  url:urlToStore,
      });

      const role2User = await User.find({ role: "role2" })

      role2User.forEach(async (user) => {
        await sendEmail(asset, user.email);
      })

      res.status(200).json({ message: 'Form submitted successfully', asset });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Approval endpoint backend code
app.post('/approveAsset/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    let asset = await AssetDetails.findById(assetId);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Check if status is provided in the request body
    const status = req.body.status;
    console.log(status)

    if (!status) {
      return res.status(400).json({ error: 'Status is required in the request body' });
    }

    asset.status = status;

    asset = await asset.save();



    if (status === 'Approved') {
      const role4User = await User.find({ role: "role4" })

      role4User.forEach(async (user) => {
        await sendEmail(asset, user.email);
      })
    } else {
      const role3User = await User.find({ role: "role3" })
      console.log(role3User)

      role3User.forEach(async (user) => {
        await sendEmail(asset, user.email);
      })
    }

    res.status(200).json({ message: 'Asset approved successfully', asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Endpoint to fetch user data by email
app.get('/getUser/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Exclude password before sending the user data to the frontend
    const { name, email, role } = user.toObject();
    res.status(200).json({ name, email, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Modify asset endpoint
app.post('/modifyAsset/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const updatedData = req.body;
    const asset = await AssetDetails.findById(assetId);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Update the asset data
    asset.assetType = updatedData.assetType;
    asset.Quantity = updatedData.Quantity;
    asset.unitPrice = updatedData.unitPrice;
    asset.totalPrice = updatedData.totalPrice;

    // Save the updated asset
    await asset.save();

    res.status(200).json({ message: 'Asset updated successfully', asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// progresslevel
app.post('/updateProgressLevel/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const { progressLevel } = req.body;

    const asset = await AssetDetails.findById(assetId);


    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    asset.ProgressLevel = progressLevel;

    await asset.save();

    res.status(200).json({ message: 'ProgressLevel updated successfully', asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Reject asset endpoint
app.post('/rejectAsset/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const asset = await AssetDetails.findById(assetId);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    asset.status = 'Rejected';
    await asset.save();

    res.status(200).json({ message: 'Asset rejected successfully', asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Form submission endpoint
app.post('/submitForm', async (req, res) => {
  try {

    const formData = req.body;
    const assetId = formData._id; // Assume _id is sent from the frontend when modifying

    if (assetId) {
      // If assetId is provided, update the existing asset
      const existingAsset = await AssetDetails.findById(assetId);

      if (!existingAsset) {
        return res.status(404).json({ error: 'Asset not found for modification' });
      }

      existingAsset.assetType = formData.assetType;
      existingAsset.Quantity = formData.Quantity;
      existingAsset.unitPrice = formData.unitPrice;
      existingAsset.totalPrice = formData.totalPrice;

      // Add CreatedBy field when updating the asset
      existingAsset.CreatedBy = formData.CreatedBy;

      await existingAsset.save();

      res.status(200).json({ message: 'Asset updated successfully', asset: existingAsset });
    } else {
      // If assetId is not provided, create a new asset
      // Fetch user details based on the submitted email
      const user = await User.findOne({ email: 'shaikdadavali092@gmail.com' });



      if (!user) {
        return res.status(404).json({ error: 'User not found for the submitted email' });
      }

      const asset = await AssetDetails.create({
        ...formData,
        // Add CreatedBy field with the user's name when creating a new asset
        CreatedBy: user.CreatedBy,
        //  url:urlToStore,
      });

      await sendEmail(asset, 'vemanasrikanth73829@gmail.com');
      res.status(200).json({ message: 'Form submitted successfully', asset });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all assets endpoint
app.get('/getData', async (req, res) => {
  try {
    const assets = await AssetDetails.find();
    res.status(200).json({ message: 'Assets fetched successfully', assets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to send email
const sendEmail = async (formData, toEmail) => {
  try {
    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "thinkailabs111@gmail.com",
        pass: "zwvu hhtq cavs zkmr"
      },
    });


    // Email content
    const emailContent = `
       <h2>Form Data</h2>
       <table border="1">
       <tr>
           <td>Asset_Id</td>
           <td>${formData._id}</td>
         </tr>
         <tr>
           <td>Select_Asset</td>
           <td>${formData.assetType}</td>
         </tr>
         <td>Quantity</td>
           <td>${formData.Quantity}</td>
         </tr>
         <tr>
           <td>Unit Price</td>
           <td>${formData.unitPrice}</td>
         </tr>
         <tr>
           <td>Total price</td>
           <td>${formData.totalPrice}</td>
         </tr>
       </table>
       <p>Click <a href="http://3.108.194.47:3001">here</a> to view the details in the application.</p>
        
     `;

    // Mail options
    const mailOptions = {
      from: 'your@.com',
      to: toEmail,
      subject: 'Form Submission',
      html: emailContent,
      attachments: [
        {
          filename: 'laptop.pdf',
          path: formData.url,
          encoding: 'base64',
        },
      ],
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Serve PDF file
app.get('/getPdf/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const asset = await AssetDetails.findById(assetId);
    if (!asset || !asset.url) {
      return res.status(404).json({ error: 'PDF not found for this asset' });
    }

    const url = asset.url;
    console.log(url)
    // Redirect to the PDF URL
    res.status(200).json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Update Payment Status endpoint
app.post('/updatePayment/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const { payment } = req.body;

    const asset = await AssetDetails.findById(assetId);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    asset.payment = payment;
    asset.ProgressLevel = "level4";


    await asset.save();

    res.status(200).json({ message: 'Payment status updated successfully', asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});
// Start the server
app.listen(port, () => {
  console.log(`API Server is running on port ${port}`);
});
