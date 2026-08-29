import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
  Linking,
  ActivityIndicator,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const BACKEND_URL = 'http://172.20.10.2:5000/api/v1';

// Predefined Demo Accounts
const DEMO_USERS = [
  {
    email: 'admin@signage.com',
    password: 'admin123',
    name: 'Rajesh Singhania',
    role: 'Super Admin',
    badgeColor: '#0B2240',
    dotColor: '#0B2240',
    avatar: '👑',
  },
  {
    email: 'fieldboy@signage.com',
    password: 'field123',
    name: 'Amit Verma',
    role: 'Field Boy',
    badgeColor: '#0284C7',
    dotColor: '#0284C7',
    avatar: '📸',
  },
  {
    email: 'designer@signage.com',
    password: 'design123',
    name: 'Priya Sharma',
    role: 'Designer/Op',
    badgeColor: '#4F46E5',
    dotColor: '#4F46E5',
    avatar: '🎨',
  },
  {
    email: 'installer@signage.com',
    password: 'install123',
    name: 'Vikram Shinde',
    role: 'Installer Lead',
    badgeColor: '#0D9488',
    dotColor: '#0D9488',
    avatar: '🛠️',
  },
];

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(DEMO_USERS[0]);
  const [inputEmail, setInputEmail] = useState('admin@signage.com');
  const [inputPassword, setInputPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab State for Admin & Field Boy
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'inventory', 'invoices', 'rate_calc', 'salary' (Admin)
  const [fieldBoyTab, setFieldBoyTab] = useState('tasks'); // 'tasks', 'attendance', 'expenses', 'points' (Field Boy)

  // FIELD BOY WORKSPACE STATE & SUB-SCREENS
  const [activeSiteTask, setActiveSiteTask] = useState(null);
  const [activeSubScreen, setActiveSubScreen] = useState(null);
  const [capturePhotoModalVisible, setCapturePhotoModalVisible] = useState(false);

  // Real Hardware Camera Permissions & State
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState('back');
  const photoCameraRef = useRef(null);
  const videoCameraRef = useRef(null);

  // Captured Photo for Touch Annotation
  const [selectedPhotoUri, setSelectedPhotoUri] = useState(
    'https://images.unsplash.com/photo-1541888946425-d0fbb18015f6?w=1200'
  );
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [annotationColor, setAnnotationColor] = useState('#FACC15');
  const [annotations, setAnnotations] = useState([
    { id: '1', text: '15.0 ft Width', x: 80, y: 110, color: '#FACC15' },
    { id: '2', text: '4.0 ft Height', x: 20, y: 170, color: '#FACC15' },
    { id: '3', text: '⚡ 220V Power Point', x: 190, y: 240, color: '#38BDF8' },
  ]);

  // Video Recording State
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoTimer, setVideoTimer] = useState(10);
  const [hasRecordedVideo, setHasRecordedVideo] = useState(false);

  // Video recording timer effect
  useEffect(() => {
    let interval = null;
    if (isVideoRecording && videoTimer > 0) {
      interval = setInterval(() => {
        setVideoTimer((prev) => prev - 1);
      }, 1000);
    } else if (videoTimer === 0 && isVideoRecording) {
      setIsVideoRecording(false);
      setHasRecordedVideo(true);
      if (activeSiteTask) {
        activeSiteTask.hasVideo = true;
      }
    }
    return () => clearInterval(interval);
  }, [isVideoRecording, videoTimer]);

  // Take live photo with in-app CameraView
  const handleSnapLivePhoto = async () => {
    if (!photoCameraRef.current) {
      setActiveSubScreen('photo_annotation');
      return;
    }
    try {
      setIsCapturingPhoto(true);
      const photo = await photoCameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      setIsCapturingPhoto(false);
      if (photo?.uri) {
        setSelectedPhotoUri(photo.uri);
      }
      setActiveSubScreen('photo_annotation');
    } catch (e) {
      setIsCapturingPhoto(false);
      setSelectedPhotoUri('https://images.unsplash.com/photo-1541888946425-d0fbb18015f6?w=1200');
      setActiveSubScreen('photo_annotation');
    }
  };

  const handleStartRealVideoRecording = async () => {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to record site videos.');
        return;
      }
    }

    if (!microphonePermission?.granted) {
      await requestMicrophonePermission();
    }

    setVideoTimer(10);
    setHasRecordedVideo(false);
    setIsVideoRecording(true);

    if (videoCameraRef.current) {
      try {
        videoCameraRef.current
          .recordAsync({ maxDuration: 10 })
          .catch(() => {});
      } catch (_) {}
    }
  };

  // Launch iOS Photo Gallery
  const handleLaunchGallery = async () => {
    setCapturePhotoModalVisible(false);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Photo Library Permission Required',
          'Please allow photo library access in iOS Settings to select site facade photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhotoUri(result.assets[0].uri);
        setActiveSubScreen('photo_annotation');
      }
    } catch (e) {
      setSelectedPhotoUri('https://images.unsplash.com/photo-1541888946425-d0fbb18015f6?w=1200');
      setActiveSubScreen('photo_annotation');
    }
  };

  // Field Boy Assigned Tasks
  const [fieldTasks, setFieldTasks] = useState([
    {
      id: 'sv-101',
      title: 'Apex Retail Fashion Store',
      clientName: 'Sunil Mehta',
      clientPhone: '+919820011223',
      address: 'Shop 14, Grand Galleria Mall, Link Road, Andheri West',
      status: 'ASSIGNED',
      measurementsCount: 0,
      boardSections: [
        {
          id: 'b-1',
          name: 'Board 1: Main Entrance LED Board',
          length: '15.0',
          height: '4.0',
          material: 'ACP Sheet',
          gauge: '1" x 1" (18 Gauge)',
        },
      ],
      checklist: {
        mountingHeight: 'Ground Floor Facade (12 ft)',
        powerDistance: '10.0',
        ladderRequired: true,
        scaffoldingRequired: false,
        craneRequired: false,
        obstacles: 'Overhanging power cables and shop awning near entrance',
        notes: '220V power point accessible from ground meter room.',
      },
      hasPhoto: true,
      hasVideo: false,
    },
    {
      id: 'sv-102',
      title: 'CarePlus Multispeciality Hospital',
      clientName: 'Dr. Priya Nair',
      clientPhone: '+919830022334',
      address: 'Plot 7, Sector 15, Vashi, Navi Mumbai',
      status: 'SUBMITTED',
      measurementsCount: 1,
      boardSections: [
        {
          id: 'b-1',
          name: 'Main Emergency Glow Sign',
          length: '20.0',
          height: '5.0',
          material: 'Acrylic 3D Letter',
          gauge: '1.5" x 1.5" (16 Gauge)',
        },
      ],
      checklist: {
        mountingHeight: '1st Floor Cantilever (18 ft)',
        powerDistance: '5.0',
        ladderRequired: true,
        scaffoldingRequired: true,
        craneRequired: false,
        obstacles: 'Hospital ambulance entry clearance required',
        notes: 'Installation work permitted during night hours only (10 PM to 6 AM).',
      },
      hasPhoto: true,
      hasVideo: true,
    },
  ]);

  const handleSubmitSiteVisit = (task) => {
    setFieldTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'SUBMITTED', measurementsCount: t.boardSections.length } : t))
    );

    const syncMsg = `📋 *APEX SIGNAGE - SITE SURVEY SUBMITTED*\n━━━━━━━━━━━━━━━━━━━━\nTask: *${task.title}*\nClient: *${task.clientName}* (${task.clientPhone})\n📍 Location: *${task.address}*\n\n📐 *Measurements:* ${task.boardSections.length} Board(s) Configured (Total: 60.0 Sq.Ft)\n🏗️ *Mounting:* ${task.checklist.mountingHeight}\n🔌 *Power Distance:* ${task.checklist.powerDistance} ft\n🪜 *Equipment:* Ladder: ${task.checklist.ladderRequired ? 'Yes' : 'No'} • Crane: ${task.checklist.craneRequired ? 'Yes' : 'No'}\n⚠️ *Obstacles:* ${task.checklist.obstacles || 'None'}\n📷 *Photo Annotation:* Saved with Width & Height Markers\n🎥 *10s Video:* Saved with Clearance Assessment\n\n*Synced live to Production & Designers!*`;

    Linking.openURL(`whatsapp://send?phone=919423800532&text=${encodeURIComponent(syncMsg)}`).catch(() => {});

    Alert.alert('✅ Site Visit Submitted!', 'Measurements, Real Camera Photos & Technical Checklist synced to Office & Designers live!');
    setActiveSiteTask(null);
  };

  // Schedule Site Visit Modal State (Admin)
  const [siteVisitModalVisible, setSiteVisitModalVisible] = useState(false);
  const [siteVisitsCount, setSiteVisitsCount] = useState(4);
  const [clientName, setClientName] = useState('Apex Retail Store');
  const [clientPhone, setClientPhone] = useState('+91 98200 11223');
  const [siteAddress, setSiteAddress] = useState('Shop 14, Grand Galleria Mall, Link Road, Andheri West');
  const [assignedFieldBoy, setAssignedFieldBoy] = useState('Rahul Sharma (Field Boy)');
  const [visitInstructions, setVisitInstructions] = useState('Measure main facade LED board & take 10-sec site video');
  const [fieldBoyDropdownOpen, setFieldBoyDropdownOpen] = useState(false);

  const fieldBoysList = [
    'Rahul Sharma (Field Boy)',
    'Amit Verma (Field Boy)',
    'Suresh Patil (Senior Surveyor)',
    'Deepak Yadav (Field Associate)',
  ];

  const handleDispatchSiteVisit = () => {
    if (!clientName.trim() || !clientPhone.trim() || !siteAddress.trim()) {
      Alert.alert('Validation Error', 'Please fill in client name, phone and address.');
      return;
    }

    setSiteVisitsCount((prev) => prev + 1);
    setSiteVisitModalVisible(false);

    const newTask = {
      id: `sv-${Date.now()}`,
      title: clientName,
      clientName: clientName,
      clientPhone: clientPhone,
      address: siteAddress,
      status: 'ASSIGNED',
      measurementsCount: 0,
      boardSections: [
        {
          id: 'b-1',
          name: 'Board 1: Main Facade Board',
          length: '12.0',
          height: '4.0',
          material: 'ACP Sheet',
          gauge: '1" x 1" (18 Gauge)',
        },
      ],
      checklist: {
        mountingHeight: 'Ground Floor Facade (12 ft)',
        powerDistance: '10.0',
        ladderRequired: true,
        scaffoldingRequired: false,
        craneRequired: false,
        obstacles: '',
        notes: '',
      },
      hasPhoto: false,
      hasVideo: false,
    };
    setFieldTasks([newTask, ...fieldTasks]);

    const dispatchMessage = `📋 *NEW SITE VISIT TASK ASSIGNED*\n━━━━━━━━━━━━━━━━━━━━\nAssigned To: *${assignedFieldBoy}*\nClient: *${clientName}*\nPhone: *${clientPhone}*\n📍 Address: *${siteAddress}*\n📝 Notes: ${visitInstructions}\n\n*Apex Signage Operations System*`;
    Linking.openURL(`whatsapp://send?phone=919423800532&text=${encodeURIComponent(dispatchMessage)}`).catch(() => {});

    Alert.alert(
      '✅ Task Dispatched!',
      `Site visit task assigned to ${assignedFieldBoy} with instant WhatsApp notification and GPS map routing!`
    );
  };

  // Inventory State
  const [inventoryList, setInventoryList] = useState([
    {
      id: 'inv-1',
      name: 'Star Flex 440 GSM (10ft x 150ft Roll)',
      stock: 14.0,
      min: 5.0,
      unit: 'ROLL',
      isLow: false,
    },
    {
      id: 'inv-2',
      name: 'Avery Dennison Gloss Vinyl (4ft x 150ft)',
      stock: 3.0,
      min: 6.0,
      unit: 'ROLL',
      isLow: true,
    },
    {
      id: 'inv-3',
      name: 'Aludecor ACP Sheet 3mm (8ft x 4ft Deep Blue)',
      stock: 22.0,
      min: 8.0,
      unit: 'PIECE',
      isLow: false,
    },
    {
      id: 'inv-4',
      name: 'Samsung 3-LED Module 1.2W Cool White',
      stock: 120.0,
      min: 300.0,
      unit: 'PIECE',
      isLow: true,
    },
    {
      id: 'inv-5',
      name: 'MeanWell 12V 33A 400W Rainproof SMPS',
      stock: 18.0,
      min: 5.0,
      unit: 'PIECE',
      isLow: false,
    },
    {
      id: 'inv-6',
      name: 'Apollo MS Square Pipe 1" x 1" 18-Gauge (20ft)',
      stock: 45.0,
      min: 15.0,
      unit: 'PIECE',
      isLow: false,
    },
  ]);

  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [stockMovementModalVisible, setStockMovementModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState('STOCK_IN');
  const [transactionDropdownOpen, setTransactionDropdownOpen] = useState(false);
  const [stockQty, setStockQty] = useState('5');
  const [stockReason, setStockReason] = useState('Restock shipment received from supplier');

  const openStockMovementModal = (item) => {
    setSelectedMaterial(item);
    setTransactionType('STOCK_IN');
    setStockQty('5');
    setStockReason('Restock shipment received from supplier');
    setTransactionDropdownOpen(false);
    setStockMovementModalVisible(true);
  };

  const handleStockMovementConfirm = () => {
    if (!selectedMaterial) return;
    const qty = parseFloat(stockQty) || 0;

    setInventoryList((prev) =>
      prev.map((item) => {
        if (item.id === selectedMaterial.id) {
          let newStock = item.stock;
          if (transactionType === 'STOCK_IN') {
            newStock = item.stock + qty;
          } else if (transactionType === 'STOCK_OUT') {
            newStock = Math.max(0, item.stock - qty);
          } else if (transactionType === 'ADJUSTMENT') {
            newStock = qty;
          }
          return {
            ...item,
            stock: newStock,
            isLow: newStock < item.min,
          };
        }
        return item;
      })
    );

    setStockMovementModalVisible(false);
    const actionLabel =
      transactionType === 'STOCK_IN'
        ? `Added +${qty}`
        : transactionType === 'STOCK_OUT'
        ? `Deducted -${qty}`
        : `Adjusted to ${qty}`;

    Alert.alert(
      '✅ Stock Movement Recorded',
      `Successfully ${actionLabel} ${selectedMaterial.unit} for ${selectedMaterial.name}.`
    );
  };

  const getTransactionLabel = () => {
    if (transactionType === 'STOCK_IN') return 'Stock In (Purchase/Restock)';
    if (transactionType === 'STOCK_OUT') return 'Stock Out (Job Usage)';
    return 'Manual Count Adjustment';
  };

  // Invoices State
  const [invoices, setInvoices] = useState([
    {
      id: 'inv-101',
      invoiceNumber: 'INV-2026-0001',
      customerName: 'Sunil Mehta',
      companyName: 'Apex Retail Store',
      phone: '9423800532',
      totalAmount: 38500,
      paidAmount: 20000,
      balanceDue: 18500,
      status: 'PARTIALLY PAID',
      date: '28 Aug 2026',
    },
    {
      id: 'inv-102',
      invoiceNumber: 'INV-2026-0002',
      customerName: 'Rajesh Sharma',
      companyName: 'Grand Hotel Suites',
      phone: '9423800532',
      totalAmount: 85000,
      paidAmount: 40000,
      balanceDue: 45000,
      status: 'PARTIALLY PAID',
      date: '27 Aug 2026',
    },
    {
      id: 'inv-103',
      invoiceNumber: 'INV-2026-0003',
      customerName: 'Anil Kapoor',
      companyName: 'Zudio Brand Store',
      phone: '9423800532',
      totalAmount: 142000,
      paidAmount: 142000,
      balanceDue: 0,
      status: 'PAID FULL',
      date: '25 Aug 2026',
    },
  ]);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [recordPaymentModalVisible, setRecordPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('18500.0');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentMethodDropdownOpen, setPaymentMethodDropdownOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState('UPI/HDFC/998822');

  const openRecordPaymentModal = (inv) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balanceDue > 0 ? `${inv.balanceDue.toFixed(1)}` : '0.0');
    setPaymentMethod('UPI');
    setPaymentRef('UPI/HDFC/998822');
    setPaymentMethodDropdownOpen(false);
    setRecordPaymentModalVisible(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoice) return;
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid received payment amount.');
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === selectedInvoice.id) {
          const newPaid = inv.paidAmount + amount;
          const newBalance = Math.max(0, inv.totalAmount - newPaid);
          const newStatus = newBalance === 0 ? 'PAID FULL' : 'PARTIALLY PAID';
          return {
            ...inv,
            paidAmount: newPaid,
            balanceDue: newBalance,
            status: newStatus,
          };
        }
        return inv;
      })
    );

    setRecordPaymentModalVisible(false);

    const receiptMessage = `🧾 *APEX SIGNAGE - PAYMENT RECEIPT*\n━━━━━━━━━━━━━━━━━━━━\nDear *${selectedInvoice.companyName}*,\n\nWe have successfully received your payment:\n\n📄 *Invoice #:* ${selectedInvoice.invoiceNumber}\n💰 *Amount Received:* ₹${amount.toLocaleString()}\n💳 *Method:* ${getPaymentMethodLabel()}\n🔢 *Ref / UTR:* ${paymentRef}\n\n*Apex Signage Accounts Team* (+91 9423800532)`;

    Alert.alert(
      '✅ Payment Recorded!',
      `Received ₹${amount.toLocaleString()} for ${selectedInvoice.invoiceNumber}. Would you like to share the receipt via WhatsApp?`,
      [
        { text: 'Done', style: 'cancel' },
        {
          text: 'Send WhatsApp Receipt',
          onPress: () => {
            Linking.openURL(`whatsapp://send?phone=919423800532&text=${encodeURIComponent(receiptMessage)}`).catch(() => {});
          },
        },
      ]
    );
  };

  const getPaymentMethodLabel = () => {
    if (paymentMethod === 'UPI') return 'UPI (GPay / PhonePe / Paytm)';
    if (paymentMethod === 'BANK_TRANSFER') return 'Bank Transfer (NEFT/RTGS)';
    if (paymentMethod === 'CASH') return 'Cash Payment';
    return 'Cheque / Demand Draft';
  };

  // Rate & Quotation Builder State
  const customerOptions = [
    'Sunil Mehta (Apex Retail Store)',
    'Rajesh Sharma (Grand Hotel Suites)',
    'Anil Kapoor (Zudio Brand Store)',
    'Dr. Priya Nair (CarePlus Hospital)',
  ];

  const [selectedQuotationCustomer, setSelectedQuotationCustomer] = useState(
    'Sunil Mehta (Apex Retail Store)'
  );
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [includeGst, setIncludeGst] = useState(true);

  const [lineItems, setLineItems] = useState([
    {
      id: 'item-1',
      description: 'Main Entrance 3D Acrylic LED Letter ACP Board (15ft x 4ft)',
      length: '15.0',
      height: '4.0',
      rate: '400.0',
    },
    {
      id: 'item-2',
      description: 'Side Wall Backlit Glow Sign Box (6ft x 3ft)',
      length: '6.0',
      height: '3.0',
      rate: '333.33',
    },
  ]);

  const [framingCharge, setFramingCharge] = useState('2500.0');
  const [installationCharge, setInstallationCharge] = useState('2000.0');

  const calculateItemValues = (item) => {
    const l = parseFloat(item.length) || 0;
    const h = parseFloat(item.height) || 0;
    const r = parseFloat(item.rate) || 0;
    const sqft = l * h;
    const amount = sqft * r;
    return { sqft, amount };
  };

  const subtotalItems = lineItems.reduce((acc, item) => {
    return acc + calculateItemValues(item).amount;
  }, 0);

  const framingVal = parseFloat(framingCharge) || 0;
  const installVal = parseFloat(installationCharge) || 0;
  const taxableTotal = subtotalItems + framingVal + installVal;
  const gstVal = includeGst ? taxableTotal * 0.18 : 0;
  const grandTotalQuotation = taxableTotal + gstVal;

  const handleAddLineItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      description: 'Front Façade Signboard',
      length: '10.0',
      height: '3.0',
      rate: '350.0',
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleDeleteLineItem = (id) => {
    if (lineItems.length <= 1) {
      Alert.alert('Notice', 'At least one line item is required.');
      return;
    }
    setLineItems(lineItems.filter((i) => i.id !== id));
  };

  const handleUpdateLineItem = (id, field, value) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleGeneratePdfQuotation = () => {
    const quoteMessage = `📋 *APEX SIGNAGE - OFFICIAL QUOTATION*\n━━━━━━━━━━━━━━━━━━━━\nDear *${selectedQuotationCustomer}*,\n\nThank you for choosing Apex Signage! Below is your custom quotation:\n\n${lineItems
      .map(
        (i, idx) =>
          `🔹 *Item ${idx + 1}:* ${i.description}\n   Size: ${i.length}ft × ${i.height}ft (${calculateItemValues(i).sqft.toFixed(1)} Sq.Ft) @ ₹${i.rate}/Sq.Ft = *₹${calculateItemValues(i).amount.toFixed(2)}*`
      )
      .join('\n\n')}\n\n━━━━━━━━━━━━━━━━━━━━\n📦 *Subtotal Items:* ₹${subtotalItems.toFixed(2)}\n🏗️ *Framing & Structure:* ₹${framingVal.toFixed(2)}\n🚚 *Installation Charge:* ₹${installVal.toFixed(2)}\n📑 *GST (18%):* ₹${gstVal.toFixed(2)}\n\n💰 *GRAND TOTAL:* *₹${grandTotalQuotation.toFixed(2)}*\n\n📥 *Download PDF:* http://172.20.10.2:5000/uploads/QT-2026-0001.pdf\n\nPlease reply to confirm and begin fabrication!`;

    Linking.openURL(`whatsapp://send?phone=919423800532&text=${encodeURIComponent(quoteMessage)}`).catch(() => {});

    Alert.alert(
      '📄 Quotation Generated!',
      `Quotation for ₹${grandTotalQuotation.toFixed(2)} generated with official branded PDF and dispatched to client WhatsApp!`
    );
  };

  // Salary Slip State
  const [payslipDownloadedToast, setPayslipDownloadedToast] = useState(false);

  const staffSalaryData = {
    companyName: 'APEX SIGNAGE SOLUTIONS',
    companyAddress: 'Plot 42, Industrial Area Phase 2, Mumbai',
    employeeName: 'Amit Verma',
    employeeRole: 'Designer & Operator',
    monthYear: 'August 2026',
    presentDays: 29,
    totalDays: 30,
    lateMarks: 2,
    overtimeHours: 8.0,
    basicPay: 28000,
    overtimePay: 800,
    bonus: 3000,
    deductions: 0,
    netPayable: 31800,
  };

  const handleDownloadPayslip = () => {
    setPayslipDownloadedToast(true);

    const salaryMsg = `📄 *APEX SIGNAGE SOLUTIONS - SALARY SLIP*\n━━━━━━━━━━━━━━━━━━━━\n*Employee:* ${staffSalaryData.employeeName} (${staffSalaryData.employeeRole})\n*Month:* ${staffSalaryData.monthYear}\n\n📅 *Attendance:* ${staffSalaryData.presentDays}/${staffSalaryData.totalDays} Days | ${staffSalaryData.overtimeHours} hrs OT\n\n💵 *Basic Pay:* ₹${staffSalaryData.basicPay.toLocaleString()}\n⏱️ *Overtime Pay:* +₹${staffSalaryData.overtimePay.toLocaleString()}\n🏆 *Bonus:* +₹${staffSalaryData.bonus.toLocaleString()}\n\n💰 *NET SALARY PAID:* *₹${staffSalaryData.netPayable.toLocaleString()}*\n\n📥 *Download PDF Slip:* http://172.20.10.2:5000/uploads/SAL-2026-08-AMIT.pdf\n━━━━━━━━━━━━━━━━━━━━\n*Apex Signage HR & Accounts*`;

    Linking.openURL(`whatsapp://send?phone=919423800532&text=${encodeURIComponent(salaryMsg)}`).catch(() => {});

    setTimeout(() => {
      setPayslipDownloadedToast(false);
    }, 4000);
  };

  // WhatsApp Dispatch Engine
  const sendInvoiceWhatsApp = async (inv) => {
    const formattedPhone = '919423800532';
    const message = `🧾 *APEX SIGNAGE & PRINTING - INVOICE*\n━━━━━━━━━━━━━━━━━━━━\nDear *${inv.companyName}*,\n\nPlease find your official tax invoice details below:\n\n📄 *Invoice #:* ${inv.invoiceNumber}\n📅 *Date:* ${inv.date}\n💰 *Total Billed:* ₹${inv.totalAmount.toLocaleString()}\n✅ *Paid Amount:* ₹${inv.paidAmount.toLocaleString()}\n⚠️ *Balance Due:* ₹${inv.balanceDue.toLocaleString()}\n\n📥 *Download PDF Invoice:* http://172.20.10.2:5000/uploads/${inv.invoiceNumber}.pdf\n💳 *UPI Payment:* paytmqr.apexsignage@icici\n\nThank you for choosing Apex Signage!\n━━━━━━━━━━━━━━━━━━━━\n*Apex Signage & Printing Solutions*\nPhone: +91 9423800532`;

    const nativeUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

    try {
      fetch(`${BACKEND_URL}/notifications/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: formattedPhone,
          title: 'WhatsApp Invoice Dispatch',
          message: message,
          channels: ['WHATSAPP'],
        }),
      }).catch(() => {});
    } catch (_) {}

    try {
      const supported = await Linking.canOpenURL(nativeUrl);
      if (supported) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (e) {
      await Linking.openURL(webUrl);
    }
  };

  // Handle Login Execution
  const handleSignIn = (emailParam, passParam) => {
    const email = (emailParam || inputEmail).trim().toLowerCase();
    const password = passParam || inputPassword;

    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter your email address and password.');
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      const user = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email && u.password === password
      );

      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        if (user.role === 'Field Boy') {
          setFieldBoyTab('tasks');
        } else {
          setCurrentTab('dashboard');
        }
      } else {
        const customUser = {
          email: email,
          password: password,
          name: email.split('@')[0].toUpperCase(),
          role: 'Custom User',
          badgeColor: '#0B2240',
          dotColor: '#0B2240',
          avatar: '👤',
        };
        setCurrentUser(customUser);
        setIsAuthenticated(true);
        setCurrentTab('dashboard');
      }
    }, 300);
  };

  // Handle Logout Execution
  const handleLogout = () => {
    Alert.alert('Logout Confirmation', 'Are you sure you want to log out of Apex Signage?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          setIsAuthenticated(false);
          setInputPassword('');
          setActiveSiteTask(null);
          setActiveSubScreen(null);
        },
      },
    ]);
  };

  // Quick Role Chip Selector
  const onQuickRoleSelect = (user) => {
    setInputEmail(user.email);
    setInputPassword(user.password);
  };

  // Low stock count calculation
  const lowStockCount = inventoryList.filter((item) => item.isLow).length;
  const displayedInventory = filterLowStockOnly
    ? inventoryList.filter((item) => item.isLow)
    : inventoryList;

  // =========================================================================
  // SCREEN 1: LOGIN / AUTHENTICATION
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.loginScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.loginHeaderBox}>
              <Ionicons name="print-outline" size={42} color="#FFFFFF" />
            </View>

            <Text style={styles.loginMainTitle}>Apex Signage & Print</Text>
            <Text style={styles.loginSubtitle}>Production & Field Operations System</Text>

            <View style={styles.loginInputCard}>
              <Text style={styles.loginInputLabel}>Email Address or Phone</Text>
              <View style={styles.loginInputRow}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.loginTextInput}
                  value={inputEmail}
                  onChangeText={setInputEmail}
                  placeholder="Enter email or phone"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={[styles.loginInputCard, { marginTop: 14 }]}>
              <Text style={styles.loginInputLabel}>Password</Text>
              <View style={styles.loginInputRow}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.loginTextInput}
                  value={inputPassword}
                  onChangeText={setInputPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.signInPrimaryBtn}
              onPress={() => handleSignIn()}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="arrow-forward-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.signInPrimaryBtnText}>Sign In to Workspace</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.loginDivider} />

            <Text style={styles.quickSwitchHeading}>Quick Switch Role (Demo Credentials):</Text>

            <View style={styles.roleChipsWrap}>
              {DEMO_USERS.map((user) => (
                <TouchableOpacity
                  key={user.email}
                  style={[
                    styles.roleChip,
                    inputEmail === user.email && styles.roleChipActive,
                  ]}
                  onPress={() => onQuickRoleSelect(user)}
                >
                  <View style={[styles.chipDot, { backgroundColor: user.dotColor }]} />
                  <Text style={styles.chipText}>{user.role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // SUB-SCREEN 2A: LIVE HARDWARE CAMERA FOR SITE FACADE PHOTO CAPTURE
  // =========================================================================
  if (currentUser.role === 'Field Boy' && activeSubScreen === 'live_camera_photo') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Top Camera Header */}
        <View style={styles.videoTopBar}>
          <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={{ padding: 6 }}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.videoHeaderTitle}>Capture Site Facade Photo</Text>
          <TouchableOpacity
            style={{ padding: 6 }}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Live Hardware Camera Viewfinder */}
        <View style={styles.videoViewport}>
          {cameraPermission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing={facing}
              mode="picture"
              ref={photoCameraRef}
            />
          ) : (
            <View style={styles.permissionBox}>
              <Ionicons name="camera-outline" size={54} color="#38BDF8" style={{ marginBottom: 12 }} />
              <Text style={styles.permissionTitle}>iOS Camera Permission Required</Text>
              <Text style={styles.permissionSub}>
                Allow camera access to capture site facade photos directly on your iPhone.
              </Text>
              <TouchableOpacity
                style={styles.grantPermBtn}
                onPress={async () => {
                  await requestCameraPermission();
                }}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.grantPermBtnText}>Allow iOS Camera Access</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Grid Overlay Guide */}
          <View style={styles.photoGridGuide}>
            <View style={styles.photoGridBox} />
          </View>

          <View style={styles.videoGuidancePill}>
            <Text style={styles.videoGuidanceText}>
              Align store entrance & main facade signboard
            </Text>
          </View>
        </View>

        {/* Bottom Shutter Controls */}
        <View style={styles.cameraShutterBar}>
          <TouchableOpacity
            style={styles.shutterOuterCircle}
            onPress={handleSnapLivePhoto}
            disabled={isCapturingPhoto}
          >
            {isCapturingPhoto ? (
              <ActivityIndicator color="#0F2744" />
            ) : (
              <View style={styles.shutterInnerCircle} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // SUB-SCREEN 2B: INTERACTIVE SITE PHOTO ANNOTATION SCREEN
  // =========================================================================
  if (currentUser.role === 'Field Boy' && activeSubScreen === 'photo_annotation' && activeSiteTask) {
    const colorsList = ['#FACC15', '#EF4444', '#38BDF8', '#FFFFFF', '#10B981'];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

        {/* Top Header Bar */}
        <View style={styles.annotationHeader}>
          <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.annotationHeaderTitle}>Site Photo Annotation</Text>
          <TouchableOpacity
            style={styles.annotationSaveBtn}
            onPress={() => {
              activeSiteTask.hasPhoto = true;
              Alert.alert('✅ Photo Annotation Saved', 'Annotated site facade photo attached to survey!');
              setActiveSubScreen(null);
            }}
          >
            <Text style={styles.annotationSaveText}>SAVE</Text>
          </TouchableOpacity>
        </View>

        {/* Annotation Toolbar */}
        <View style={styles.annotationToolbar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={styles.annotToolBtnActive}>
              <Ionicons name="pencil" size={18} color="#0284C7" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.annotToolBtn}
              onPress={() => {
                const newId = `${Date.now()}`;
                setAnnotations([...annotations, { id: newId, text: '12.0 ft', x: 120, y: 180, color: annotationColor }]);
              }}
            >
              <Ionicons name="text" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.annotToolBtn}
              onPress={() => {
                if (annotations.length > 0) {
                  setAnnotations(annotations.slice(0, -1));
                }
              }}
            >
              <Ionicons name="arrow-undo" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Palette */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {colorsList.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  annotationColor === c && styles.colorDotSelected,
                ]}
                onPress={() => setAnnotationColor(c)}
              />
            ))}
          </View>
        </View>

        {/* Photo Viewport Canvas */}
        <View style={styles.photoCanvasContainer}>
          <Image
            source={{ uri: selectedPhotoUri }}
            style={styles.canvasFacadeImage}
            resizeMode="cover"
          />

          {/* Width Dimension Line Marker */}
          <View style={styles.widthDimensionMarker}>
            <Ionicons name="arrow-back" size={16} color={annotationColor} />
            <View style={[styles.dimensionDashedLine, { backgroundColor: annotationColor }]} />
            <View style={[styles.dimensionLabelPill, { borderColor: annotationColor }]}>
              <Text style={[styles.dimensionLabelText, { color: annotationColor }]}>15.0 ft (Width)</Text>
            </View>
            <View style={[styles.dimensionDashedLine, { backgroundColor: annotationColor }]} />
            <Ionicons name="arrow-forward" size={16} color={annotationColor} />
          </View>

          {/* Height Dimension Line Marker */}
          <View style={styles.heightDimensionMarker}>
            <Ionicons name="arrow-up" size={14} color={annotationColor} />
            <View style={[styles.dimensionDashedLineV, { backgroundColor: annotationColor }]} />
            <View style={[styles.dimensionLabelPill, { borderColor: annotationColor, marginVertical: 4 }]}>
              <Text style={[styles.dimensionLabelText, { color: annotationColor }]}>4.0 ft (H)</Text>
            </View>
            <View style={[styles.dimensionDashedLineV, { backgroundColor: annotationColor }]} />
            <Ionicons name="arrow-down" size={14} color={annotationColor} />
          </View>

          {/* Power Point Callout Badge */}
          <View style={styles.powerPointBadge}>
            <Ionicons name="flash" size={14} color="#38BDF8" style={{ marginRight: 4 }} />
            <Text style={styles.powerPointText}>⚡ 220V Power Point (10ft)</Text>
          </View>
        </View>

        {/* Bottom Quick Callout Adder */}
        <View style={styles.calloutBottomBar}>
          <Text style={styles.calloutInstructionText}>
            💡 Tap & save annotated dimensions directly to sync with designer CAD layout.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // SUB-SCREEN 2C: 10-SECOND REALTIME SITE VIDEO SCREEN
  // =========================================================================
  if (currentUser.role === 'Field Boy' && activeSubScreen === 'video_recording' && activeSiteTask) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Top Header */}
        <View style={styles.videoTopBar}>
          <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={{ padding: 6 }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.videoHeaderTitle}>10-Second Realtime Site Video</Text>
          <TouchableOpacity
            style={{ padding: 6 }}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Viewfinder Viewport with REAL HARDWARE CAMERA ACCESS */}
        <View style={styles.videoViewport}>
          {cameraPermission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing={facing}
              mode="video"
              ref={videoCameraRef}
            />
          ) : (
            <View style={styles.permissionBox}>
              <Ionicons name="videocam-outline" size={54} color="#38BDF8" style={{ marginBottom: 12 }} />
              <Text style={styles.permissionTitle}>iOS Camera Access Required</Text>
              <Text style={styles.permissionSub}>
                Allow camera & microphone access to record 10-second site clearance videos.
              </Text>
              <TouchableOpacity
                style={styles.grantPermBtn}
                onPress={async () => {
                  await requestCameraPermission();
                  await requestMicrophonePermission();
                }}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.grantPermBtnText}>Allow iOS Camera Access</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Live Recording Progress & Timer Badge */}
          {isVideoRecording && (
            <View style={styles.recordingTimerBadge}>
              <View style={styles.redRecordingDot} />
              <Text style={styles.recordingTimerText}>
                00:{videoTimer < 10 ? `0${videoTimer}` : videoTimer} / 00:10
              </Text>
            </View>
          )}

          {hasRecordedVideo && !isVideoRecording && (
            <View style={[styles.recordingTimerBadge, { backgroundColor: 'rgba(16, 185, 129, 0.9)' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.recordingTimerText}>10s Realtime Video Recorded!</Text>
            </View>
          )}

          <View style={styles.videoGuidancePill}>
            <Text style={styles.videoGuidanceText}>
              Pan across facade, electrical & road clearance
            </Text>
          </View>
        </View>

        {/* Bottom Action Controls */}
        <View style={styles.videoBottomBar}>
          {!hasRecordedVideo ? (
            <TouchableOpacity
              style={[styles.recordVideoPrimaryBtn, isVideoRecording && { backgroundColor: '#B91C1C' }]}
              onPress={handleStartRealVideoRecording}
              disabled={isVideoRecording}
            >
              <View style={styles.recordVideoInnerCircle} />
              <Text style={styles.recordVideoBtnText}>
                {isVideoRecording ? `Recording Site Panorama (${videoTimer}s)...` : 'Start 10s Realtime Video'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: '100%', gap: 10 }}>
              <TouchableOpacity
                style={[styles.recordVideoPrimaryBtn, { backgroundColor: '#10B981' }]}
                onPress={() => {
                  activeSiteTask.hasVideo = true;
                  Alert.alert('✅ Video Attached', '10-Second Realtime Clearance video saved to task!');
                  setActiveSubScreen(null);
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.recordVideoBtnText}>Save 10s Site Video Clip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignItems: 'center', paddingVertical: 8 }}
                onPress={handleStartRealVideoRecording}
              >
                <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Re-record 10s Video</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // SUB-SCREEN 2D: TECHNICAL SITE CHECKLIST
  // =========================================================================
  if (currentUser.role === 'Field Boy' && activeSubScreen === 'checklist' && activeSiteTask) {
    const checklist = activeSiteTask.checklist;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F2744' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F2744" />
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={{ marginRight: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.appBarTitle}>Technical Site Checklist</Text>
          </View>
        </View>

        <View style={styles.appBodyWrapper}>
          <ScrollView style={styles.mainScroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <Text style={styles.checklistSectionHeading}>Installation & Safety Assessment</Text>
            <Text style={styles.checklistSectionSub}>
              Verify structural access, power supply distance, and crane/scaffold requirements.
            </Text>

            <View style={[styles.checklistInputCard, { marginTop: 14 }]}>
              <Text style={styles.checklistInputLabel}>Board Floor / Mounting Height</Text>
              <View style={styles.checklistInputRow}>
                <Ionicons name="swap-vertical" size={20} color="#64748B" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.checklistTextInput}
                  value={checklist.mountingHeight}
                  onChangeText={(val) => {
                    checklist.mountingHeight = val;
                    setActiveSiteTask({ ...activeSiteTask });
                  }}
                  placeholder="e.g. Ground Floor Facade (12 ft)"
                />
              </View>
            </View>

            <View style={[styles.checklistInputCard, { marginTop: 14 }]}>
              <Text style={styles.checklistInputLabel}>Power Supply Distance (Feet)</Text>
              <View style={styles.checklistInputRow}>
                <Ionicons name="flash-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.checklistTextInput, { flex: 1 }]}
                  keyboardType="numeric"
                  value={checklist.powerDistance}
                  onChangeText={(val) => {
                    checklist.powerDistance = val;
                    setActiveSiteTask({ ...activeSiteTask });
                  }}
                  placeholder="10.0"
                />
                <Text style={styles.unitSuffix}>ft</Text>
              </View>
            </View>

            <Text style={[styles.checklistSectionHeading, { marginTop: 22, marginBottom: 8 }]}>
              Equipment & Machinery Requirements
            </Text>

            <View style={styles.switchesContainerCard}>
              <View style={styles.switchRowItem}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.switchTitle}>Ladder Required</Text>
                  <Text style={styles.switchSub}>Standard aluminium folding ladder (up to 12ft)</Text>
                </View>
                <Switch
                  value={checklist.ladderRequired}
                  onValueChange={(val) => {
                    checklist.ladderRequired = val;
                    setActiveSiteTask({ ...activeSiteTask });
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#0F2744' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.switchDivider} />

              <View style={styles.switchRowItem}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.switchTitle}>Scaffolding Required</Text>
                  <Text style={styles.switchSub}>Required for heights above 15ft or multi-day installation</Text>
                </View>
                <Switch
                  value={checklist.scaffoldingRequired}
                  onValueChange={(val) => {
                    checklist.scaffoldingRequired = val;
                    setActiveSiteTask({ ...activeSiteTask });
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#0F2744' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.switchDivider} />

              <View style={styles.switchRowItem}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.switchTitle}>Hydraulic Crane Required</Text>
                  <Text style={styles.switchSub}>Required for rooftop or high-rise facade hoists</Text>
                </View>
                <Switch
                  value={checklist.craneRequired}
                  onValueChange={(val) => {
                    checklist.craneRequired = val;
                    setActiveSiteTask({ ...activeSiteTask });
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#0F2744' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.obstaclesCardActive}>
              <Text style={styles.obstaclesLabel}>Site Obstacles & Physical Hazards</Text>
              <View style={styles.obstaclesInputRow}>
                <Ionicons name="warning-outline" size={22} color="#0F2744" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.obstaclesTextInput}
                  value={checklist.obstacles}
                  onChangeText={(val) => {
                    checklist.obstacles = val;
                    setActiveSiteTask({ ...activeSiteTask });
                  }}
                  placeholder="e.g. Overhanging power cables, tree branches, uneven pavement"
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>
            </View>

            <View style={styles.additionalNotesCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="reorder-three-outline" size={22} color="#64748B" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.additionalNotesInput}
                  value={checklist.notes}
                  onChangeText={(val) => {
                    checklist.notes = val;
                    setActiveSiteTask({ ...activeSiteTask });
                  }}
                  placeholder="Additional Technical Notes"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveChecklistBtn}
              onPress={() => {
                Alert.alert('✅ Saved', 'Technical site checklist updated successfully!');
                setActiveSubScreen(null);
              }}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveChecklistBtnText}>Save Technical Checklist</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // SUB-SCREEN 2E: SMART MEASUREMENT CALCULATOR
  // =========================================================================
  if (currentUser.role === 'Field Boy' && activeSubScreen === 'measurements' && activeSiteTask) {
    const currentSection = activeSiteTask.boardSections[0] || {
      name: 'Board 1: Main Entrance LED Board',
      length: '15.0',
      height: '4.0',
      material: 'ACP Sheet',
      gauge: '1" x 1" (18 Gauge)',
    };
    const l = parseFloat(currentSection.length) || 0;
    const h = parseFloat(currentSection.height) || 0;
    const sqft = l * h;
    const sqm = sqft * 0.092903;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F2744' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F2744" />
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <TouchableOpacity onPress={() => setActiveSubScreen(null)} style={{ marginRight: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.appBarTitle}>Smart Measurement Calculator</Text>
          </View>
        </View>

        <View style={styles.appBodyWrapper}>
          <ScrollView style={styles.mainScroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <View style={styles.calcFormulaBox}>
              <Ionicons name="sparkles" size={18} color="#0284C7" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.calcFormulaText}>Auto-Calculates: Sq.Ft = Length × Height</Text>
                <Text style={styles.calcFormulaSub}>Sq.Meter = Sq.Ft × 0.092903</Text>
              </View>
            </View>

            <View style={styles.measureCard}>
              <View style={styles.measureInputGroup}>
                <Text style={styles.measureInputLabel}>Board / Section Name</Text>
                <TextInput
                  style={styles.measureTextInput}
                  value={currentSection.name}
                  onChangeText={(text) => {
                    currentSection.name = text;
                    setActiveSiteTask({ ...activeSiteTask });
                  }}
                />
              </View>

              <View style={styles.measureDimensionsRow}>
                <View style={styles.measureDimCol}>
                  <Text style={styles.measureInputLabel}>Length (ft)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={[styles.measureTextInput, { flex: 1 }]}
                      keyboardType="numeric"
                      value={currentSection.length}
                      onChangeText={(text) => {
                        currentSection.length = text;
                        setActiveSiteTask({ ...activeSiteTask });
                      }}
                    />
                    <Text style={styles.unitSuffix}>ft</Text>
                  </View>
                </View>

                <Text style={styles.multiplySign}>×</Text>

                <View style={styles.measureDimCol}>
                  <Text style={styles.measureInputLabel}>Height (ft)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={[styles.measureTextInput, { flex: 1 }]}
                      keyboardType="numeric"
                      value={currentSection.height}
                      onChangeText={(text) => {
                        currentSection.height = text;
                        setActiveSiteTask({ ...activeSiteTask });
                      }}
                    />
                    <Text style={styles.unitSuffix}>ft</Text>
                  </View>
                </View>
              </View>

              <View style={styles.areaResultBox}>
                <Text style={styles.areaResultLabel}>Area Result:</Text>
                <Text style={styles.areaResultVal}>
                  {sqft.toFixed(2)} Sq.Ft | {sqm.toFixed(3)} Sq.M
                </Text>
              </View>

              <View style={[styles.measureInputGroup, { marginTop: 12 }]}>
                <Text style={styles.measureInputLabel}>Material Specification</Text>
                <TouchableOpacity style={styles.measureDropdownRow}>
                  <Text style={styles.measureDropdownVal}>{currentSection.material}</Text>
                  <Ionicons name="chevron-down" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={[styles.measureInputGroup, { marginTop: 12 }]}>
                <Text style={styles.measureInputLabel}>MS Pipe Structure Gauge</Text>
                <TouchableOpacity style={styles.measureDropdownRow}>
                  <Text style={styles.measureDropdownVal}>{currentSection.gauge}</Text>
                  <Ionicons name="chevron-down" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addBoardOutlineBtn}
              onPress={() => Alert.alert('Add Section', 'Added Section 2 for Front Facade')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#0F2744" style={{ marginRight: 6 }} />
              <Text style={styles.addBoardOutlineText}>Add Another Board / Section</Text>
            </TouchableOpacity>

            <View style={styles.measureTotalAreaRow}>
              <Text style={styles.measureTotalAreaLabel}>TOTAL AREA:</Text>
              <Text style={styles.measureTotalAreaVal}>
                {sqft.toFixed(2)} Sq.Ft <Text style={{ fontSize: 12, color: '#64748B' }}>({sqm.toFixed(3)} Sq.Meters)</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.saveMeasurementsBtn}
              onPress={() => {
                activeSiteTask.measurementsCount = 1;
                Alert.alert('✅ Saved', 'Measurements saved successfully!');
                setActiveSubScreen(null);
              }}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveMeasurementsBtnText}>Save 1 Board Measurements</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // SCREEN 2F: FIELD BOY SITE VISIT DETAIL SCREEN
  // =========================================================================
  if (currentUser.role === 'Field Boy' && activeSiteTask) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F2744' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F2744" />
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <TouchableOpacity onPress={() => setActiveSiteTask(null)} style={{ marginRight: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.appBarTitle}>{activeSiteTask.title}</Text>
          </View>
          <View style={styles.syncedBadge}>
            <Ionicons name="cloud-done" size={14} color="#10B981" style={{ marginRight: 4 }} />
            <Text style={styles.syncedBadgeText}>Synced</Text>
          </View>
        </View>

        <View style={styles.appBodyWrapper}>
          <ScrollView style={styles.mainScroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <View style={styles.taskDetailClientCard}>
              <View style={styles.taskDetailClientHeader}>
                <Text style={styles.taskDetailClientName}>{activeSiteTask.clientName}</Text>
                <View style={styles.taskAssignedPill}>
                  <Text style={styles.taskAssignedPillText}>{activeSiteTask.status}</Text>
                </View>
              </View>
              <Text style={styles.taskDetailAddress}>{activeSiteTask.address}</Text>

              <View style={styles.taskActionBtnsRow}>
                <TouchableOpacity
                  style={styles.callClientBtn}
                  onPress={() => Linking.openURL(`tel:${activeSiteTask.clientPhone}`)}
                >
                  <Ionicons name="call-outline" size={18} color="#0F2744" style={{ marginRight: 6 }} />
                  <Text style={styles.callClientBtnText}>Call Client</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navigateMapBtn}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeSiteTask.address)}`
                    )
                  }
                >
                  <Ionicons name="navigate" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.navigateMapBtnText}>Navigate Map</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.moduleSectionHeading}>📏 1. Digital Smart Measurements</Text>
            <TouchableOpacity style={styles.moduleCard} onPress={() => setActiveSubScreen('measurements')}>
              <View style={{ flex: 1 }}>
                <Text style={styles.moduleCardTitle}>1 Board Section(s) Configured</Text>
                <Text style={styles.moduleCardSub}>Total: 60.0 Sq.Ft (5.57 Sq.Meters)</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <Text style={styles.moduleSectionHeading}>✏️ 2. Site Photograph & Touch Annotation</Text>
            <TouchableOpacity style={styles.moduleCard} onPress={() => setCapturePhotoModalVisible(true)}>
              <View style={styles.moduleIconBoxCyan}>
                <Ionicons name="camera-outline" size={22} color="#0284C7" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.moduleCardTitle}>Capture & Annotate Site Photo</Text>
                <Text style={styles.moduleCardSub}>
                  {activeSiteTask.hasPhoto ? '✅ 1 Annotated Facade Photo attached' : 'Draw width/height directly on site photo'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <Text style={styles.moduleSectionHeading}>🎥 3. Site Video Clip (10 Seconds)</Text>
            <TouchableOpacity style={styles.moduleCard} onPress={() => setActiveSubScreen('video_recording')}>
              <View style={styles.moduleIconBoxPurple}>
                <Ionicons name="videocam-outline" size={22} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.moduleCardTitle}>Record 10-Second Site Video</Text>
                <Text style={styles.moduleCardSub}>
                  {activeSiteTask.hasVideo ? '✅ 10s Clearance Video saved' : 'Required to assess surrounding trees & road clearance'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <Text style={styles.moduleSectionHeading}>📋 4. Technical Checklist</Text>
            <TouchableOpacity style={styles.moduleCard} onPress={() => setActiveSubScreen('checklist')}>
              <View style={{ flex: 1 }}>
                <Text style={styles.moduleCardTitle}>{activeSiteTask.checklist.mountingHeight}</Text>
                <Text style={styles.moduleCardSub}>
                  Power: {activeSiteTask.checklist.powerDistance}ft • Ladder: {activeSiteTask.checklist.ladderRequired ? 'Yes' : 'No'} • Crane:{' '}
                  {activeSiteTask.checklist.craneRequired ? 'Yes' : 'No'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitSiteVisitPrimaryBtn, { marginTop: 14 }]}
              onPress={() => handleSubmitSiteVisit(activeSiteTask)}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitSiteVisitPrimaryText}>Submit & Sync to Designer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Photo Capture Modal */}
        <Modal
          visible={capturePhotoModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCapturePhotoModalVisible(false)}
        >
          <View style={styles.sheetOverlay}>
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.sheetTitle}>Capture Site Facade Photo</Text>
                  <Text style={styles.sheetSub}>Choose camera or select existing photo</Text>
                </View>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setCapturePhotoModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.photoOptionItem}
                onPress={() => {
                  setCapturePhotoModalVisible(false);
                  setActiveSubScreen('live_camera_photo');
                }}
              >
                <View style={styles.photoOptionIconBox}>
                  <Ionicons name="camera" size={22} color="#0284C7" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.photoOptionText}>Take Live Photo with Camera</Text>
                  <Text style={styles.photoOptionSub}>Capture facade using live iPhone camera</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoOptionItem} onPress={handleLaunchGallery}>
                <View style={[styles.photoOptionIconBox, { backgroundColor: '#E2E8F0' }]}>
                  <Ionicons name="images" size={22} color="#475569" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.photoOptionText}>Choose from Gallery</Text>
                  <Text style={styles.photoOptionSub}>Select existing photo from phone</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoOptionItem}
                onPress={() => {
                  setCapturePhotoModalVisible(false);
                  setSelectedPhotoUri('https://images.unsplash.com/photo-1541888946425-d0fbb18015f6?w=1200');
                  setActiveSubScreen('photo_annotation');
                }}
              >
                <View style={[styles.photoOptionIconBox, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="business" size={22} color="#64748B" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.photoOptionText}>Use Sample Retail Facade Photo</Text>
                  <Text style={styles.photoOptionSub}>Pre-loaded building sample for quick demo</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // SCREEN 2G: FIELD BOY MAIN WORKSPACE
  // =========================================================================
  if (currentUser.role === 'Field Boy') {
    const pendingCount = fieldTasks.filter((t) => t.status === 'ASSIGNED').length;
    const inProgressCount = fieldTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const submittedCount = fieldTasks.filter((t) => t.status === 'SUBMITTED').length;

    return (
      <View style={styles.rootFullContainer}>
        <SafeAreaView style={{ flex: 0, backgroundColor: '#0F2744' }}>
          <StatusBar barStyle="light-content" backgroundColor="#0F2744" />
        </SafeAreaView>

        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <Ionicons name="print" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.appBarTitle}>Field Boy Workspace</Text>
          </View>

          <View style={styles.appBarRight}>
            <TouchableOpacity
              style={styles.appBarIconBtn}
              onPress={() => {
                const nextIndex = (DEMO_USERS.findIndex((u) => u.role === currentUser.role) + 1) % DEMO_USERS.length;
                setCurrentUser(DEMO_USERS[nextIndex]);
                Alert.alert('Role Switched', `Active Profile: ${DEMO_USERS[nextIndex].name} (${DEMO_USERS[nextIndex].role})`);
              }}
            >
              <Ionicons name="person-circle-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.appBarIconBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.appBodyWrapper}>
          <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContentInset}>
            <View style={styles.fieldBoyStatusRow}>
              <View style={styles.fieldBoyStatusCard}>
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                <Text style={[styles.fieldBoyStatusBigVal, { color: '#F59E0B' }]}>{pendingCount}</Text>
                <Text style={styles.fieldBoyStatusSub}>Pending</Text>
              </View>

              <View style={styles.fieldBoyStatusCard}>
                <Ionicons name="resize-outline" size={20} color="#0F2744" />
                <Text style={[styles.fieldBoyStatusBigVal, { color: '#0F2744' }]}>{inProgressCount}</Text>
                <Text style={styles.fieldBoyStatusSub}>In-Progress</Text>
              </View>

              <View style={styles.fieldBoyStatusCard}>
                <Ionicons name="cloud-done-outline" size={20} color="#10B981" />
                <Text style={[styles.fieldBoyStatusBigVal, { color: '#10B981' }]}>{submittedCount}</Text>
                <Text style={styles.fieldBoyStatusSub}>Submitted</Text>
              </View>
            </View>

            <View style={styles.fieldBoyTipBanner}>
              <Ionicons name="hand-left-outline" size={22} color="#0F2744" style={{ marginRight: 10 }} />
              <Text style={styles.fieldBoyTipText}>
                Ready for site visit? Tap a task to start measurements & photo annotations.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>My Assigned Site Tasks</Text>

            {fieldTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.fieldTaskCard}
                onPress={() => setActiveSiteTask(task)}
              >
                <View style={styles.fieldTaskHeader}>
                  <Text style={styles.fieldTaskTitle}>{task.title}</Text>
                  <View
                    style={[
                      styles.fieldTaskStatusBadge,
                      task.status === 'SUBMITTED' ? styles.statusBadgeGreen : styles.statusBadgeAmber,
                    ]}
                  >
                    <Text
                      style={[
                        styles.fieldTaskStatusText,
                        task.status === 'SUBMITTED' ? { color: '#10B981' } : { color: '#D97706' },
                      ]}
                    >
                      {task.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.fieldTaskMetaRow}>
                  <Ionicons name="person-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.fieldTaskMetaText}>{task.clientName}</Text>
                  <Ionicons name="call-outline" size={14} color="#64748B" style={{ marginLeft: 12, marginRight: 4 }} />
                  <Text style={styles.fieldTaskMetaText}>{task.clientPhone}</Text>
                </View>

                <View style={[styles.fieldTaskMetaRow, { marginTop: 6 }]}>
                  <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={[styles.fieldTaskMetaText, { flex: 1 }]}>{task.address}</Text>
                </View>

                <View style={styles.fieldTaskFooter}>
                  <Text
                    style={[
                      styles.fieldTaskMeasurementStatus,
                      task.measurementsCount > 0 && { color: '#10B981' },
                    ]}
                  >
                    {task.measurementsCount > 0 ? `${task.measurementsCount} Board(s) measured` : 'No measurements recorded'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.openFormText}>Open Form</Text>
                    <Ionicons name="chevron-forward" size={14} color="#0F2744" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Clean Integrated Bottom Navigation */}
          <View style={styles.bottomNavContainer}>
            <TouchableOpacity style={styles.navItem} onPress={() => setFieldBoyTab('tasks')}>
              <Ionicons name="grid" size={20} color={fieldBoyTab === 'tasks' ? '#0F2744' : '#64748B'} />
              <Text style={[styles.navLabel, fieldBoyTab === 'tasks' && styles.navLabelActive]}>Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                setFieldBoyTab('attendance');
                Alert.alert('📍 Field Attendance', 'Geofence Verified: Punched in at Andheri West site (09:15 AM)');
              }}
            >
              <Ionicons name="location-outline" size={20} color={fieldBoyTab === 'attendance' ? '#0F2744' : '#64748B'} />
              <Text style={[styles.navLabel, fieldBoyTab === 'attendance' && styles.navLabelActive]}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                setFieldBoyTab('expenses');
                Alert.alert('💳 Petty Cash', 'Fuel claim ₹150 approved.');
              }}
            >
              <Ionicons name="wallet-outline" size={20} color={fieldBoyTab === 'expenses' ? '#0F2744' : '#64748B'} />
              <Text style={[styles.navLabel, fieldBoyTab === 'expenses' && styles.navLabelActive]}>Expenses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                setFieldBoyTab('points');
                Alert.alert('🏆 Performance Points', 'Total 450 Points (Rank #1 Field Boy this month)');
              }}
            >
              <Ionicons name="trophy-outline" size={20} color={fieldBoyTab === 'points' ? '#0F2744' : '#64748B'} />
              <Text style={[styles.navLabel, fieldBoyTab === 'points' && styles.navLabelActive]}>Points</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // =========================================================================
  // SCREEN 2H: ADMIN DASHBOARD
  // =========================================================================
  return (
    <View style={styles.rootFullContainer}>
      <SafeAreaView style={{ flex: 0, backgroundColor: '#0F2744' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F2744" />
      </SafeAreaView>

      {/* Top Header Bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <Ionicons name="print" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.appBarTitle}>Apex Signage Admin</Text>
        </View>

        <View style={styles.appBarRight}>
          <TouchableOpacity
            style={styles.appBarIconBtn}
            onPress={() => {
              const nextIndex = (DEMO_USERS.findIndex((u) => u.role === currentUser.role) + 1) % DEMO_USERS.length;
              setCurrentUser(DEMO_USERS[nextIndex]);
              Alert.alert('Role Switched', `Active Profile: ${DEMO_USERS[nextIndex].name} (${DEMO_USERS[nextIndex].role})`);
            }}
          >
            <Ionicons name="person-circle-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.appBarIconBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.appBodyWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContentInset}>
          
          {/* TAB 1: ADMIN DASHBOARD */}
          {currentTab === 'dashboard' && (
            <View style={styles.tabContent}>
              <View style={styles.revenueCard}>
                <View style={styles.revenueCardHeader}>
                  <Text style={styles.revenueLabel}>Total Billed Revenue</Text>
                  <View style={styles.profitBadge}>
                    <Text style={styles.profitBadgeText}>Est. Profit: ₹148550</Text>
                  </View>
                </View>

                <Text style={styles.revenueAmount}>₹285000</Text>

                <View style={styles.revenueBreakdownRow}>
                  <View style={styles.revBreakdownCol}>
                    <Text style={styles.breakdownLabel}>Collected</Text>
                    <Text style={[styles.breakdownVal, { color: '#10B981' }]}>₹195000</Text>
                  </View>
                  <View style={styles.revBreakdownCol}>
                    <Text style={styles.breakdownLabel}>Pending Due</Text>
                    <Text style={[styles.breakdownVal, { color: '#F59E0B' }]}>₹90000</Text>
                  </View>
                  <View style={styles.revBreakdownCol}>
                    <Text style={styles.breakdownLabel}>Petty Expenses</Text>
                    <Text style={[styles.breakdownVal, { color: '#93C5FD' }]}>₹3450</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.stockAlertBanner} onPress={() => setCurrentTab('inventory')}>
                <Ionicons name="warning-outline" size={24} color="#D97706" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.stockAlertTitle}>2 Materials Below Minimum Stock!</Text>
                  <Text style={styles.stockAlertSub}>
                    Avery Gloss Vinyl Roll (3/6 ROLL), Samsung 3-LED Module (120/300 PIECE)
                  </Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Today's Production & Field Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle}>Active Jobs</Text>
                    <Ionicons name="clipboard-outline" size={18} color="#0F2744" />
                  </View>
                  <Text style={styles.summaryCardBigVal}>12</Text>
                  <Text style={styles.summaryCardSub}>1480.0 Total Sq.Ft</Text>
                </View>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle}>Printing Output</Text>
                    <Ionicons name="print-outline" size={18} color="#0F2744" />
                  </View>
                  <Text style={[styles.summaryCardBigVal, { color: '#0F2744' }]}>665.0 Sq.Ft</Text>
                  <Text style={styles.summaryCardSub}>Waste: 19.0 Sq.Ft</Text>
                </View>

                <TouchableOpacity
                  style={[styles.summaryCard, styles.summaryCardClickable]}
                  onPress={() => setSiteVisitModalVisible(true)}
                >
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle}>Site Visits Today</Text>
                    <Ionicons name="location-outline" size={18} color="#4338CA" />
                  </View>
                  <Text style={[styles.summaryCardBigVal, { color: '#4338CA' }]}>{siteVisitsCount}</Text>
                  <Text style={[styles.summaryCardSub, { color: '#4338CA', fontWeight: '600' }]}>
                    Tap to Schedule & Assign ➔
                  </Text>
                </TouchableOpacity>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle}>Attendance & Team</Text>
                    <Ionicons name="checkmark-done-circle-outline" size={18} color="#10B981" />
                  </View>
                  <Text style={[styles.summaryCardBigVal, { color: '#10B981' }]}>8 / 9</Text>
                  <Text style={styles.summaryCardSub}>★ 4.9 Rating</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Job Production Pipeline (Live Stages)</Text>
              <View style={styles.pipelineCard}>
                <View style={styles.pipelineRow}>
                  <View style={styles.pipelineLeft}>
                    <Ionicons name="resize-outline" size={18} color="#1E293B" style={{ marginRight: 10 }} />
                    <Text style={styles.pipelineStageName}>1. Site Visit</Text>
                  </View>
                  <View style={styles.pipelineBadge}>
                    <Text style={styles.pipelineBadgeText}>2 active</Text>
                  </View>
                </View>

                <View style={styles.pipelineRow}>
                  <View style={styles.pipelineLeft}>
                    <Ionicons name="create-outline" size={18} color="#1E293B" style={{ marginRight: 10 }} />
                    <Text style={styles.pipelineStageName}>2. Design Final</Text>
                  </View>
                  <View style={styles.pipelineBadge}>
                    <Text style={styles.pipelineBadgeText}>3 active</Text>
                  </View>
                </View>

                <View style={styles.pipelineRow}>
                  <View style={styles.pipelineLeft}>
                    <Ionicons name="print-outline" size={18} color="#1E293B" style={{ marginRight: 10 }} />
                    <Text style={styles.pipelineStageName}>3. Printing</Text>
                  </View>
                  <View style={styles.pipelineBadge}>
                    <Text style={styles.pipelineBadgeText}>2 active</Text>
                  </View>
                </View>

                <View style={styles.pipelineRow}>
                  <View style={styles.pipelineLeft}>
                    <Ionicons name="construct-outline" size={18} color="#1E293B" style={{ marginRight: 10 }} />
                    <Text style={styles.pipelineStageName}>4. Fabrication</Text>
                  </View>
                  <View style={styles.pipelineBadge}>
                    <Text style={styles.pipelineBadgeText}>3 active</Text>
                  </View>
                </View>

                <View style={styles.pipelineRow}>
                  <View style={styles.pipelineLeft}>
                    <Ionicons name="car-outline" size={18} color="#1E293B" style={{ marginRight: 10 }} />
                    <Text style={styles.pipelineStageName}>5. Installation</Text>
                  </View>
                  <View style={styles.pipelineBadge}>
                    <Text style={styles.pipelineBadgeText}>1 active</Text>
                  </View>
                </View>

                <View style={[styles.pipelineRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.pipelineLeft}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 10 }} />
                    <Text style={[styles.pipelineStageName, { color: '#10B981' }]}>6. Delivered</Text>
                  </View>
                  <View style={[styles.pipelineBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.pipelineBadgeText, { color: '#10B981' }]}>1 active</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: REAL-TIME MATERIAL INVENTORY */}
          {currentTab === 'inventory' && (
            <View style={styles.tabContent}>
              <View style={styles.inventorySubHeader}>
                <Text style={styles.invSubHeaderTitle}>Real-Time Material Inventory</Text>
                <TouchableOpacity
                  style={[styles.filterFunnelBtn, filterLowStockOnly && styles.filterFunnelBtnActive]}
                  onPress={() => setFilterLowStockOnly(!filterLowStockOnly)}
                >
                  <Ionicons
                    name={filterLowStockOnly ? 'funnel' : 'funnel-outline'}
                    size={20}
                    color={filterLowStockOnly ? '#0F2744' : '#64748B'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inventoryTopBar}>
                <Text style={styles.invTrackedText}>
                  {displayedInventory.length} Materials Tracked {filterLowStockOnly && '(Low Stock Only)'}
                </Text>
                {lowStockCount > 0 && (
                  <TouchableOpacity
                    style={styles.invAlertBadge}
                    onPress={() => setFilterLowStockOnly(!filterLowStockOnly)}
                  >
                    <Text style={styles.invAlertBadgeText}>⚠️ {lowStockCount} Low Stock Alerts</Text>
                  </TouchableOpacity>
                )}
              </View>

              {displayedInventory.map((item) => (
                <View key={item.id} style={styles.invItemCard}>
                  <View style={styles.invItemMain}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.invItemName}>{item.name}</Text>
                      <Text
                        style={[
                          styles.invStockText,
                          { color: item.isLow ? '#EF4444' : '#10B981', marginTop: 8 },
                        ]}
                      >
                        Stock: {item.stock.toFixed(1)} {item.unit} (Min: {item.min.toFixed(1)})
                      </Text>
                    </View>

                    <View style={styles.invItemRightCol}>
                      {item.isLow && (
                        <View style={styles.lowStockTag}>
                          <Text style={styles.lowStockTagText}>LOW STOCK</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.stockBtn}
                        onPress={() => openStockMovementModal(item)}
                      >
                        <Text style={styles.stockBtnText}>Stock In / Out</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 3: INVOICES & PAYMENT LEDGER */}
          {currentTab === 'invoices' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Invoices & Payment Ledger</Text>

              {invoices.map((inv) => (
                <View key={inv.id} style={styles.invoiceItemCard}>
                  <View style={styles.invHeaderRow}>
                    <Text style={styles.invoiceNumberBig}>{inv.invoiceNumber}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        inv.status === 'PAID FULL' ? styles.statusPaid : styles.statusPartial,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          inv.status === 'PAID FULL' ? { color: '#10B981' } : { color: '#0F2744' },
                        ]}
                      >
                        {inv.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.invCompanyName}>{inv.companyName}</Text>

                  <View style={styles.invAmountRow}>
                    <View>
                      <Text style={styles.amtLabel}>Total Billed</Text>
                      <Text style={styles.amtVal}>₹{inv.totalAmount.toLocaleString()}</Text>
                    </View>
                    <View>
                      <Text style={styles.amtLabel}>Paid So Far</Text>
                      <Text style={[styles.amtVal, { color: '#10B981' }]}>₹{inv.paidAmount.toLocaleString()}</Text>
                    </View>
                    <View>
                      <Text style={styles.amtLabel}>Balance Due</Text>
                      <Text style={[styles.amtVal, { color: '#EF4444' }]}>₹{inv.balanceDue.toLocaleString()}</Text>
                    </View>
                  </View>

                  <View style={styles.invActionsRow}>
                    <TouchableOpacity
                      style={styles.recordPaymentBtn}
                      onPress={() => openRecordPaymentModal(inv)}
                    >
                      <Text style={styles.recordPaymentText}>Record Payment</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.shareWhatsAppBtn}
                      onPress={() => sendInvoiceWhatsApp(inv)}
                    >
                      <FontAwesome5 name="whatsapp" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                      <Text style={styles.shareWhatsAppText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 4: AUTOMATIC RATE & QUOTATION BUILDER */}
          {currentTab === 'rate_calc' && (
            <View style={styles.tabContent}>
              <Text style={styles.calcScreenMainHeading}>
                Automatic Rate & Quotation Builder
              </Text>

              <View style={styles.customerSelectCard}>
                <Text style={styles.customerSelectLabel}>Select Customer / Client</Text>
                <TouchableOpacity
                  style={styles.customerSelectRow}
                  onPress={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                >
                  <Ionicons name="business-outline" size={20} color="#0F2744" style={{ marginRight: 10 }} />
                  <Text style={styles.customerSelectValue}>{selectedQuotationCustomer}</Text>
                  <Ionicons
                    name={customerDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {customerDropdownOpen && (
                  <View style={styles.customerDropdownList}>
                    {customerOptions.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={styles.customerDropdownItem}
                        onPress={() => {
                          setSelectedQuotationCustomer(c);
                          setCustomerDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.customerDropdownText,
                            selectedQuotationCustomer === c && styles.customerDropdownTextActive,
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.gstToggleCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gstToggleTitle}>Include GST (18% Tax Invoice)</Text>
                  <Text style={styles.gstToggleSubtitle}>
                    Toggles GST vs Non-GST estimate format
                  </Text>
                </View>
                <Switch
                  value={includeGst}
                  onValueChange={setIncludeGst}
                  trackColor={{ false: '#CBD5E1', true: '#0F2744' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.lineItemsHeaderRow}>
                <Text style={styles.lineItemsSectionTitle}>Signage Boards / Line Items</Text>
                <TouchableOpacity style={styles.addItemBtn} onPress={handleAddLineItem}>
                  <Ionicons name="add" size={18} color="#0F2744" style={{ marginRight: 4 }} />
                  <Text style={styles.addItemBtnText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {lineItems.map((item) => {
                const { sqft, amount } = calculateItemValues(item);
                return (
                  <View key={item.id} style={styles.lineItemCard}>
                    <View style={styles.lineItemDescGroup}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputInnerLabel}>Item Description</Text>
                        <TextInput
                          style={styles.lineItemDescInput}
                          value={item.description}
                          onChangeText={(val) => handleUpdateLineItem(item.id, 'description', val)}
                          placeholder="Item Description"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.lineItemDeleteBtn}
                        onPress={() => handleDeleteLineItem(item.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dimensionsRow}>
                      <View style={styles.dimCol}>
                        <Text style={styles.dimLabel}>Length (ft)</Text>
                        <TextInput
                          style={styles.dimInput}
                          keyboardType="numeric"
                          value={item.length}
                          onChangeText={(val) => handleUpdateLineItem(item.id, 'length', val)}
                        />
                      </View>

                      <View style={styles.dimCol}>
                        <Text style={styles.dimLabel}>Height (ft)</Text>
                        <TextInput
                          style={styles.dimInput}
                          keyboardType="numeric"
                          value={item.height}
                          onChangeText={(val) => handleUpdateLineItem(item.id, 'height', val)}
                        />
                      </View>

                      <View style={styles.dimCol}>
                        <Text style={styles.dimLabel}>Rate (₹/SqFt)</Text>
                        <TextInput
                          style={styles.dimInput}
                          keyboardType="numeric"
                          value={item.rate}
                          onChangeText={(val) => handleUpdateLineItem(item.id, 'rate', val)}
                        />
                      </View>
                    </View>

                    <View style={styles.lineItemFooterRow}>
                      <Text style={styles.lineItemSqFtText}>{sqft.toFixed(1)} Sq.Ft</Text>
                      <Text style={styles.lineItemTotalAmount}>₹{amount.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })}

              <View style={styles.extraChargesRow}>
                <View style={styles.extraChargeCol}>
                  <Text style={styles.extraChargeLabel}>Framing / MS (₹)</Text>
                  <TextInput
                    style={styles.extraChargeInput}
                    keyboardType="numeric"
                    value={framingCharge}
                    onChangeText={setFramingCharge}
                  />
                </View>

                <View style={styles.extraChargeCol}>
                  <Text style={styles.extraChargeLabel}>Installation (₹)</Text>
                  <TextInput
                    style={styles.extraChargeInput}
                    keyboardType="numeric"
                    value={installationCharge}
                    onChangeText={setInstallationCharge}
                  />
                </View>
              </View>

              <View style={styles.breakdownCard}>
                <View style={styles.breakdownLine}>
                  <Text style={styles.breakdownLineLabel}>Subtotal Items</Text>
                  <Text style={styles.breakdownLineVal}>₹{subtotalItems.toFixed(2)}</Text>
                </View>

                <View style={styles.breakdownLine}>
                  <Text style={styles.breakdownLineLabel}>Framing & Structure</Text>
                  <Text style={styles.breakdownLineVal}>+ ₹{framingVal.toFixed(0)}</Text>
                </View>

                <View style={styles.breakdownLine}>
                  <Text style={styles.breakdownLineLabel}>Installation Charge</Text>
                  <Text style={styles.breakdownLineVal}>+ ₹{installVal.toFixed(0)}</Text>
                </View>

                <View style={styles.breakdownLine}>
                  <Text style={styles.breakdownLineLabel}>GST (18%)</Text>
                  <Text style={styles.breakdownLineVal}>+ ₹{gstVal.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.grandTotalBar}>
                <Text style={styles.grandTotalBarLabel}>GRAND TOTAL:</Text>
                <Text style={styles.grandTotalBarVal}>₹{grandTotalQuotation.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                style={styles.generatePdfQuotationBtn}
                onPress={handleGeneratePdfQuotation}
              >
                <Ionicons name="document-text-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.generatePdfQuotationBtnText}>
                  Generate Branded PDF Quotation
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 5: MONTHLY SALARY SLIP */}
          {currentTab === 'salary' && (
            <View style={styles.tabContent}>
              <Text style={styles.calcScreenMainHeading}>Monthly Salary Slip</Text>

              <View style={styles.payslipCard}>
                <View style={styles.payslipCompanyHeader}>
                  <Text style={styles.payslipCompanyName}>
                    {staffSalaryData.companyName}
                  </Text>
                  <Text style={styles.payslipCompanyAddress}>
                    {staffSalaryData.companyAddress}
                  </Text>
                </View>

                <View style={styles.payslipDivider} />

                <View style={styles.payslipEmployeeRow}>
                  <View>
                    <Text style={styles.payslipEmpName}>
                      {staffSalaryData.employeeName}
                    </Text>
                    <Text style={styles.payslipEmpRole}>
                      {staffSalaryData.employeeRole}
                    </Text>
                  </View>

                  <View style={styles.payslipMonthBadge}>
                    <Text style={styles.payslipMonthBadgeText}>
                      {staffSalaryData.monthYear}
                    </Text>
                  </View>
                </View>

                <View style={styles.attendanceBox}>
                  <View style={styles.attendanceCol}>
                    <Text style={styles.attendanceLabel}>Present Days</Text>
                    <Text style={styles.attendanceVal}>
                      {staffSalaryData.presentDays} / {staffSalaryData.totalDays}
                    </Text>
                  </View>

                  <View style={styles.attendanceCol}>
                    <Text style={styles.attendanceLabel}>Late Marks</Text>
                    <Text style={styles.attendanceVal}>
                      {staffSalaryData.lateMarks}
                    </Text>
                  </View>

                  <View style={styles.attendanceCol}>
                    <Text style={styles.attendanceLabel}>Overtime</Text>
                    <Text style={styles.attendanceVal}>
                      {staffSalaryData.overtimeHours.toFixed(1)} hrs
                    </Text>
                  </View>
                </View>

                <Text style={styles.earningsHeading}>Earnings & Incentives</Text>

                <View style={styles.salaryBreakdownTable}>
                  <View style={styles.salaryRow}>
                    <Text style={styles.salaryRowLabel}>Basic Monthly Pay</Text>
                    <Text style={styles.salaryRowVal}>
                      ₹{staffSalaryData.basicPay}
                    </Text>
                  </View>

                  <View style={styles.salaryRow}>
                    <Text style={styles.salaryRowLabel}>Overtime Pay</Text>
                    <Text style={styles.salaryRowVal}>
                      + ₹{staffSalaryData.overtimePay}
                    </Text>
                  </View>

                  <View style={styles.salaryRow}>
                    <Text style={styles.salaryRowLabel}>
                      Employee of Month Bonus 🏆
                    </Text>
                    <Text style={[styles.salaryRowVal, { color: '#10B981' }]}>
                      + ₹{staffSalaryData.bonus}
                    </Text>
                  </View>

                  <View style={styles.salaryRow}>
                    <Text style={styles.salaryRowLabel}>Late Mark Deductions</Text>
                    <Text style={[styles.salaryRowVal, { color: '#EF4444' }]}>
                      - ₹{staffSalaryData.deductions}
                    </Text>
                  </View>

                  <View style={styles.payslipDivider} />

                  <View style={styles.netSalaryRow}>
                    <Text style={styles.netSalaryLabel}>NET SALARY PAYABLE:</Text>
                    <Text style={styles.netSalaryVal}>
                      ₹{staffSalaryData.netPayable}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.downloadPayslipBtn}
                onPress={handleDownloadPayslip}
              >
                <Ionicons name="document-text-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.downloadPayslipBtnText}>
                  Download Payslip PDF
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        {/* Floating SnackBar Toast */}
        {payslipDownloadedToast && (
          <View style={styles.floatingToast}>
            <Ionicons name="document-text" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.floatingToastText}>
              Payslip PDF downloaded successfully!
            </Text>
          </View>
        )}

        {/* Integrated Clean Bottom Navigation (No Cutoff, No Extra Space) */}
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentTab('dashboard')}
          >
            <Ionicons name="bar-chart" size={20} color={currentTab === 'dashboard' ? '#0F2744' : '#64748B'} />
            <Text style={[styles.navLabel, currentTab === 'dashboard' && styles.navLabelActive]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentTab('inventory')}
          >
            <Ionicons name="cube-outline" size={20} color={currentTab === 'inventory' ? '#0F2744' : '#64748B'} />
            <Text style={[styles.navLabel, currentTab === 'inventory' && styles.navLabelActive]}>Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentTab('invoices')}
          >
            <Ionicons name="receipt-outline" size={20} color={currentTab === 'invoices' ? '#0F2744' : '#64748B'} />
            <Text style={[styles.navLabel, currentTab === 'invoices' && styles.navLabelActive]}>Invoices</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentTab('rate_calc')}
          >
            <Ionicons name="calculator-outline" size={20} color={currentTab === 'rate_calc' ? '#0F2744' : '#64748B'} />
            <Text style={[styles.navLabel, currentTab === 'rate_calc' && styles.navLabelActive]}>Rate Calc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentTab('salary')}
          >
            <Ionicons name="document-text-outline" size={20} color={currentTab === 'salary' ? '#0F2744' : '#64748B'} />
            <Text style={[styles.navLabel, currentTab === 'salary' && styles.navLabelActive]}>Salary Slips</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Schedule Site Visit Modal (Admin) */}
      <Modal
        visible={siteVisitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSiteVisitModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1, paddingRight: 14 }}>
                  <Text style={styles.sheetTitle}>Schedule New Site Visit</Text>
                  <Text style={styles.sheetSub}>
                    Assign task to Field Boy with client phone & Google Maps link.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setSiteVisitModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color="#475569" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.sheetInputGroup}>
                  <Text style={styles.sheetInputLabel}>Client / Business Name</Text>
                  <View style={styles.sheetInputRow}>
                    <Ionicons name="business-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.sheetTextInput}
                      value={clientName}
                      onChangeText={setClientName}
                      placeholder="e.g. Apex Retail Store"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View style={[styles.sheetInputGroup, { marginTop: 12 }]}>
                  <Text style={styles.sheetInputLabel}>Client Phone Number</Text>
                  <View style={styles.sheetInputRow}>
                    <Ionicons name="call-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.sheetTextInput}
                      value={clientPhone}
                      onChangeText={setClientPhone}
                      placeholder="+91 98200 11223"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={[styles.sheetInputGroup, { marginTop: 12 }]}>
                  <Text style={styles.sheetInputLabel}>Site Address (Google Maps)</Text>
                  <View style={styles.sheetInputRow}>
                    <Ionicons name="location-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.sheetTextInput}
                      value={siteAddress}
                      onChangeText={setSiteAddress}
                      placeholder="Enter site location"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View style={[styles.sheetInputGroup, { marginTop: 12 }]}>
                  <Text style={styles.sheetInputLabel}>Assign Field Boy</Text>
                  <TouchableOpacity
                    style={styles.sheetInputRow}
                    onPress={() => setFieldBoyDropdownOpen(!fieldBoyDropdownOpen)}
                  >
                    <Ionicons name="person-circle-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                    <Text style={[styles.sheetTextInput, { paddingTop: 8 }]}>{assignedFieldBoy}</Text>
                    <Ionicons
                      name={fieldBoyDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>

                  {fieldBoyDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {fieldBoysList.map((fb) => (
                        <TouchableOpacity
                          key={fb}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setAssignedFieldBoy(fb);
                            setFieldBoyDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              assignedFieldBoy === fb && { color: '#0F2744', fontWeight: 'bold' },
                            ]}
                          >
                            {fb}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={[styles.sheetInputGroup, { marginTop: 12, marginBottom: 18 }]}>
                  <Text style={styles.sheetInputLabel}>Instructions / Notes</Text>
                  <View style={styles.sheetInputRow}>
                    <Ionicons name="create-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.sheetTextInput}
                      value={visitInstructions}
                      onChangeText={setVisitInstructions}
                      placeholder="e.g. Measure main facade LED board"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.dispatchPrimaryBtn}
                onPress={handleDispatchSiteVisit}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.dispatchPrimaryBtnText}>Assign & Dispatch Task to Field Boy</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Stock Movement Modal (Admin) */}
      <Modal
        visible={stockMovementModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStockMovementModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <View style={styles.stockModalCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <Text style={[styles.stockModalTitle, { flex: 1, paddingRight: 10 }]}>
                  Stock Movement: {selectedMaterial?.name}
                </Text>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setStockMovementModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={[styles.modalInputGroup, { marginTop: 10 }]}>
                <Text style={styles.modalInputLabel}>Transaction Type</Text>
                <TouchableOpacity
                  style={styles.modalSelectRow}
                  onPress={() => setTransactionDropdownOpen(!transactionDropdownOpen)}
                >
                  <Text style={styles.modalSelectText}>{getTransactionLabel()}</Text>
                  <Ionicons
                    name={transactionDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#475569"
                  />
                </TouchableOpacity>

                {transactionDropdownOpen && (
                  <View style={styles.modalDropdownOptions}>
                    <TouchableOpacity
                      style={styles.modalDropdownOptionItem}
                      onPress={() => {
                        setTransactionType('STOCK_IN');
                        setStockReason('Restock shipment received from supplier');
                        setTransactionDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.modalOptionText, transactionType === 'STOCK_IN' && styles.modalOptionActive]}>
                        Stock In (Purchase/Restock)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalDropdownOptionItem}
                      onPress={() => {
                        setTransactionType('STOCK_OUT');
                        setStockReason('Job JB-2026-0001 usage');
                        setTransactionDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.modalOptionText, transactionType === 'STOCK_OUT' && styles.modalOptionActive]}>
                        Stock Out (Job Usage)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalDropdownOptionItem, { borderBottomWidth: 0 }]}
                      onPress={() => {
                        setTransactionType('ADJUSTMENT');
                        setStockReason('Physical inventory audit count');
                        setTransactionDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.modalOptionText, transactionType === 'ADJUSTMENT' && styles.modalOptionActive]}>
                        Manual Count Adjustment
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={[styles.modalInputGroup, { marginTop: 12 }]}>
                <Text style={styles.modalInputLabel}>Quantity ({selectedMaterial?.unit})</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={stockQty}
                  onChangeText={setStockQty}
                  keyboardType="numeric"
                  placeholder="Enter quantity"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={[styles.modalInputGroup, { marginTop: 12, marginBottom: 18 }]}>
                <Text style={styles.modalInputLabel}>Reason / Bill No</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={stockReason}
                  onChangeText={setStockReason}
                  placeholder="e.g. Restock shipment from supplier"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[styles.stockModalCancelBtn, { flex: 1 }]}
                  onPress={() => setStockMovementModalVisible(false)}
                >
                  <Text style={styles.stockModalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.stockModalConfirmBtn, { flex: 2 }]}
                  onPress={handleStockMovementConfirm}
                >
                  <Text style={styles.stockModalConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Record Payment Modal (Admin) */}
      <Modal
        visible={recordPaymentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRecordPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <View style={styles.stockModalCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <Text style={[styles.stockModalTitle, { flex: 1, paddingRight: 10 }]}>
                  Record Payment: {selectedInvoice?.invoiceNumber}
                </Text>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setRecordPaymentModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={[styles.modalInputGroup, { marginTop: 10 }]}>
                <Text style={styles.modalInputLabel}>Amount Received (₹)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount received"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={[styles.modalInputGroup, { marginTop: 12 }]}>
                <Text style={styles.modalInputLabel}>Payment Method</Text>
                <TouchableOpacity
                  style={styles.modalSelectRow}
                  onPress={() => setPaymentMethodDropdownOpen(!paymentMethodDropdownOpen)}
                >
                  <Text style={styles.modalSelectText}>{getPaymentMethodLabel()}</Text>
                  <Ionicons
                    name={paymentMethodDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#475569"
                  />
                </TouchableOpacity>

                {paymentMethodDropdownOpen && (
                  <View style={styles.modalDropdownOptions}>
                    <TouchableOpacity
                      style={styles.modalDropdownOptionItem}
                      onPress={() => {
                        setPaymentMethod('UPI');
                        setPaymentRef('UPI/HDFC/998822');
                        setPaymentMethodDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.modalOptionText, paymentMethod === 'UPI' && styles.modalOptionActive]}>
                        UPI (GPay / PhonePe / Paytm)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalDropdownOptionItem}
                      onPress={() => {
                        setPaymentMethod('BANK_TRANSFER');
                        setPaymentRef('NEFT/AXIS/774411');
                        setPaymentMethodDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.modalOptionText, paymentMethod === 'BANK_TRANSFER' && styles.modalOptionActive]}>
                        Bank Transfer (NEFT/RTGS)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalDropdownOptionItem}
                      onPress={() => {
                        setPaymentMethod('CASH');
                        setPaymentRef('CASH/RECEIPT-01');
                        setPaymentMethodDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.modalOptionText, paymentMethod === 'CASH' && styles.modalOptionActive]}>
                        Cash Payment
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalDropdownOptionItem, { borderBottomWidth: 0 }]}
                      onPress={() => {
                        setPaymentMethod('CHEQUE');
                        setPaymentRef('CHQ/SBI/123456');
                        setPaymentMethodDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.modalOptionText, paymentMethod === 'CHEQUE' && styles.modalOptionActive]}>
                        Cheque / Demand Draft
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={[styles.modalInputGroup, { marginTop: 12, marginBottom: 18 }]}>
                <Text style={styles.modalInputLabel}>Transaction Ref / UTR No</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={paymentRef}
                  onChangeText={setPaymentRef}
                  placeholder="e.g. UPI/HDFC/998822"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[styles.stockModalCancelBtn, { flex: 1 }]}
                  onPress={() => setRecordPaymentModalVisible(false)}
                >
                  <Text style={styles.stockModalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.stockModalConfirmBtn, { flex: 2 }]}
                  onPress={handleConfirmPayment}
                >
                  <Text style={styles.stockModalConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootFullContainer: {
    flex: 1,
    backgroundColor: '#0F2744',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loginScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  loginHeaderBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#0F2744',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0F2744',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  loginMainTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0F2744',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 28,
    textAlign: 'center',
  },
  loginInputCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loginInputLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  loginInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
  },
  loginTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  signInPrimaryBtn: {
    width: '100%',
    backgroundColor: '#0F2744',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    shadowColor: '#0F2744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  signInPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  loginDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 32,
    marginBottom: 16,
  },
  quickSwitchHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 12,
  },
  roleChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleChipActive: {
    borderColor: '#0F2744',
    backgroundColor: '#F0F9FF',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  // Main App Styles
  appBodyWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F2744',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 14,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBarTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  appBarIconBtn: {
    padding: 4,
  },
  mainScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContentInset: {
    paddingBottom: 16,
  },
  tabContent: {
    padding: 16,
  },
  revenueCard: {
    backgroundColor: '#0F2744',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  revenueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  profitBadge: {
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  profitBadgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  revenueBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1E3A5F',
    paddingTop: 12,
  },
  revBreakdownCol: {
    alignItems: 'flex-start',
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  breakdownVal: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  stockAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  stockAlertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
  },
  stockAlertSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    width: (Dimensions.get('window').width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCardClickable: {
    borderColor: '#C7D2FE',
    backgroundColor: '#F5F3FF',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCardTitle: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  summaryCardBigVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  summaryCardSub: {
    fontSize: 11,
    color: '#64748B',
  },
  pipelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pipelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pipelineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pipelineStageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  pipelineBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pipelineBadgeText: {
    fontSize: 12,
    color: '#0F2744',
    fontWeight: '700',
  },
  inventorySubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invSubHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  filterFunnelBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  filterFunnelBtnActive: {
    backgroundColor: '#E0F2FE',
  },
  inventoryTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  invTrackedText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  invAlertBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  invAlertBadgeText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '700',
  },
  invItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invItemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invItemRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  invItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  invStockText: {
    fontSize: 13,
    fontWeight: '600',
  },
  lowStockTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
    alignSelf: 'flex-end',
  },
  lowStockTagText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stockBtn: {
    backgroundColor: '#0F2744',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stockBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  invoiceItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceNumberBig: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPartial: {
    backgroundColor: '#E0F2FE',
  },
  statusPaid: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  invCompanyName: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  invAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  amtLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  amtVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  invActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  recordPaymentBtn: {
    flex: 1,
    backgroundColor: '#0F2744',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  recordPaymentText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  shareWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareWhatsAppText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  calcScreenMainHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F2744',
    marginBottom: 14,
  },
  customerSelectCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0F2744',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
  },
  customerSelectLabel: {
    fontSize: 11,
    color: '#0F2744',
    fontWeight: '600',
    marginBottom: 2,
  },
  customerSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
  },
  customerSelectValue: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  customerDropdownList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 4,
  },
  customerDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  customerDropdownText: {
    fontSize: 13,
    color: '#334155',
  },
  customerDropdownTextActive: {
    color: '#0F2744',
    fontWeight: 'bold',
  },
  gstToggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  gstToggleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  gstToggleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  lineItemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  lineItemsSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addItemBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F2744',
  },
  lineItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  lineItemDescGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  inputInnerLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  lineItemDescInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  lineItemDeleteBtn: {
    padding: 4,
    marginLeft: 6,
  },
  dimensionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dimCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dimLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  dimInput: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  lineItemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  lineItemSqFtText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  lineItemTotalAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  extraChargesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  extraChargeCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  extraChargeLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  extraChargeInput: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  breakdownLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  breakdownLineLabel: {
    fontSize: 13,
    color: '#475569',
  },
  breakdownLineVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  grandTotalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  grandTotalBarLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  grandTotalBarVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F2744',
  },
  generatePdfQuotationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2744',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#0F2744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  generatePdfQuotationBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  payslipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  payslipCompanyHeader: {
    alignItems: 'center',
  },
  payslipCompanyName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F2744',
    letterSpacing: 0.5,
  },
  payslipCompanyAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  payslipDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  payslipEmployeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  payslipEmpName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  payslipEmpRole: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  payslipMonthBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payslipMonthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F2744',
  },
  attendanceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  attendanceCol: {
    alignItems: 'center',
    flex: 1,
  },
  attendanceLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  attendanceVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  earningsHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F2744',
    marginBottom: 12,
  },
  salaryBreakdownTable: {
    width: '100%',
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  salaryRowLabel: {
    fontSize: 14,
    color: '#334155',
  },
  salaryRowVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  netSalaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  netSalaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2744',
  },
  netSalaryVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F2744',
  },
  downloadPayslipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2744',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#0F2744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  downloadPayslipBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  floatingToast: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 999,
  },
  floatingToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldBoyStatusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  fieldBoyStatusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'flex-start',
  },
  fieldBoyStatusBigVal: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
  },
  fieldBoyStatusSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  fieldBoyTipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  fieldBoyTipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F2744',
    lineHeight: 18,
  },
  fieldTaskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldTaskTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
  },
  fieldTaskStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeAmber: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  fieldTaskStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  fieldTaskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldTaskMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  fieldTaskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  fieldTaskMeasurementStatus: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  openFormText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F2744',
    marginRight: 2,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncedBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: 'bold',
  },
  taskDetailClientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  taskDetailClientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskDetailClientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  taskAssignedPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  taskAssignedPillText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskDetailAddress: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  taskActionBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callClientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 8,
  },
  callClientBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F2744',
  },
  navigateMapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  navigateMapBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  moduleSectionHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 6,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  moduleIconBoxCyan: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleIconBoxPurple: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  moduleCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  submitSiteVisitPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2744',
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitSiteVisitPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  checklistSectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  checklistSectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  checklistInputCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  checklistInputLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  checklistInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
  },
  checklistTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  switchesContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  switchRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  switchDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  obstaclesCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0F2744',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  obstaclesLabel: {
    fontSize: 11,
    color: '#0F2744',
    fontWeight: '600',
    marginBottom: 4,
  },
  obstaclesInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  obstaclesTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    minHeight: 44,
  },
  additionalNotesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  additionalNotesInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  saveChecklistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2744',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  saveChecklistBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  calcFormulaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  calcFormulaText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F2744',
  },
  calcFormulaSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  measureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  measureInputGroup: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  measureInputLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  measureTextInput: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  measureDimensionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  measureDimCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unitSuffix: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  multiplySign: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    marginHorizontal: 8,
  },
  areaResultBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  areaResultLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  areaResultVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F2744',
  },
  measureDropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 28,
  },
  measureDropdownVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  addBoardOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F2744',
    borderRadius: 24,
    paddingVertical: 12,
    marginBottom: 16,
  },
  addBoardOutlineText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F2744',
  },
  measureTotalAreaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  measureTotalAreaLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  measureTotalAreaVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F2744',
  },
  saveMeasurementsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2744',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveMeasurementsBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  annotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
  },
  annotationHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  annotationSaveBtn: {
    backgroundColor: '#0F2744',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  annotationSaveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  annotationToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  annotToolBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  annotToolBtnActive: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#E0F2FE',
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  colorDotSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.2 }],
  },
  photoCanvasContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasFacadeImage: {
    width: '100%',
    height: '100%',
  },
  widthDimensionMarker: {
    position: 'absolute',
    top: 120,
    left: 30,
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimensionDashedLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  dimensionLabelPill: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  dimensionLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  heightDimensionMarker: {
    position: 'absolute',
    top: 150,
    left: 20,
    height: 160,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dimensionDashedLineV: {
    width: 2,
    flex: 1,
  },
  powerPointBadge: {
    position: 'absolute',
    bottom: 80,
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  powerPointText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  calloutBottomBar: {
    backgroundColor: '#0F172A',
    padding: 16,
    alignItems: 'center',
  },
  calloutInstructionText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  photoGridGuide: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGridBox: {
    width: '80%',
    height: '60%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  cameraShutterBar: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  shutterOuterCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  videoTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  videoHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  videoViewport: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  permissionSub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  grantPermBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2744',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  grantPermBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recordingTimerBadge: {
    position: 'absolute',
    top: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  redRecordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  recordingTimerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  videoGuidancePill: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  videoGuidanceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  videoBottomBar: {
    padding: 20,
    alignItems: 'center',
  },
  recordVideoPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  recordVideoInnerCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  recordVideoBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  photoOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  photoOptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  photoOptionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F2744',
  },
  sheetSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sheetInputGroup: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sheetInputLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  sheetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  sheetTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  dropdownList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#334155',
  },
  dispatchPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2744',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 10,
    shadowColor: '#0F2744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  dispatchPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  stockModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  stockModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F2744',
    lineHeight: 22,
  },
  modalInputGroup: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalInputLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  modalSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 34,
  },
  modalSelectText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  modalDropdownOptions: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 4,
  },
  modalDropdownOptionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  modalOptionActive: {
    color: '#0F2744',
    fontWeight: 'bold',
  },
  modalTextInput: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    height: 34,
  },
  stockModalCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockModalCancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  stockModalConfirmBtn: {
    backgroundColor: '#0F2744',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F2744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  stockModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Flow layout bottom navigation (zero absolute positioning cutoff)
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    minWidth: 54,
  },
  navLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#0F2744',
    fontWeight: 'bold',
  },
});
