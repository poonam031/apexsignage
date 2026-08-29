import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';

const BACKEND_URL = 'http://172.20.10.2:5000/api/v1';

// Predefined Demo Accounts (Matching Flutter AuthProvider exactly)
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

  // Active Tab State
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'inventory', 'invoices', 'rate_calc', 'salary'

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
        setCurrentTab('dashboard');
      } else {
        const customUser = {
          email: email,
          password: password,
          name: email.split('@')[0].toUpperCase(),
          role: 'Custom User',
          badgeColor: '#0284C7',
          dotColor: '#0284C7',
          avatar: '👤',
        };
        setCurrentUser(customUser);
        setIsAuthenticated(true);
        setCurrentTab('dashboard');
      }
    }, 300);
  };

  // Handle Real Logout
  const handleLogout = () => {
    Alert.alert('Logout Confirmation', 'Are you sure you want to log out of Apex Signage?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          setIsAuthenticated(false);
          setInputPassword('');
        },
      },
    ]);
  };

  // Quick Role Chip Selector
  const onQuickRoleSelect = (user) => {
    setInputEmail(user.email);
    setInputPassword(user.password);
  };

  // Inventory State (Matching Flutter Inventory Module)
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

  // Stock In / Out Modal State
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [stockQty, setStockQty] = useState('5');
  const [stockModalVisible, setStockModalVisible] = useState(false);

  const handleStockUpdate = (type) => {
    if (!selectedMaterial) return;
    const change = parseFloat(stockQty) || 0;
    setInventoryList((prev) =>
      prev.map((item) => {
        if (item.id === selectedMaterial.id) {
          const newStock = type === 'IN' ? item.stock + change : Math.max(0, item.stock - change);
          return {
            ...item,
            stock: newStock,
            isLow: newStock < item.min,
          };
        }
        return item;
      })
    );
    setStockModalVisible(false);
    Alert.alert(
      '✅ Inventory Updated',
      `${type === 'IN' ? 'Added' : 'Deducted'} ${stockQty} ${selectedMaterial.unit} for ${selectedMaterial.name}`
    );
  };

  // Invoices State (Matching Flutter Invoices Module)
  const [invoices, setInvoices] = useState([
    {
      id: 'inv-101',
      invoiceNumber: 'INV-2026-0001',
      customerName: 'Sunil Mehta',
      companyName: 'Apex Retail Fashion Store',
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

  // Rate Calculator State (Matching Flutter Rate Calculator Module)
  const [calcWidth, setCalcWidth] = useState('12');
  const [calcHeight, setCalcHeight] = useState('4');
  const [calcBoardType, setCalcBoardType] = useState('Acrylic LED 3D Letter ACP Board');
  const [calcRatePerSqFt, setCalcRatePerSqFt] = useState('650');
  const [calcIncludeGst, setCalcIncludeGst] = useState(true);

  const calculateQuotation = () => {
    const w = parseFloat(calcWidth) || 0;
    const h = parseFloat(calcHeight) || 0;
    const rate = parseFloat(calcRatePerSqFt) || 0;
    const sqft = w * h;
    const baseTotal = sqft * rate;
    const gst = calcIncludeGst ? baseTotal * 0.18 : 0;
    const grandTotal = baseTotal + gst;
    return { sqft, baseTotal, gst, grandTotal };
  };

  // WhatsApp Dispatch Engine (Matching Flutter WhatsApp Launcher)
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

  // =========================================================================
  // SCREEN 1: LOGIN / AUTHENTICATION (Exact 1:1 Pixel Match to Android Screenshot)
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
            {/* Dark Blue Header Card with Printer Icon */}
            <View style={styles.loginHeaderBox}>
              <Ionicons name="print-outline" size={42} color="#FFFFFF" />
            </View>

            {/* App Title & Subtitle */}
            <Text style={styles.loginMainTitle}>Apex Signage & Print</Text>
            <Text style={styles.loginSubtitle}>Production & Field Operations System</Text>

            {/* Email or Phone Input */}
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

            {/* Password Input */}
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

            {/* Big Sign In Button */}
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

            {/* Divider */}
            <View style={styles.loginDivider} />

            {/* Quick Switch Role Label */}
            <Text style={styles.quickSwitchHeading}>Quick Switch Role (Demo Credentials):</Text>

            {/* 4 Role Chips */}
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
  // SCREEN 2: ADMIN DASHBOARD (Clean 1:1 Pixel Match to Screenshot 1 & 2)
  // =========================================================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2744" />

      {/* Top Header Bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <Ionicons name="print" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.appBarTitle}>Apex Signage Admin</Text>
        </View>

        <View style={styles.appBarRight}>
          <TouchableOpacity style={styles.appBarIconBtn} onPress={() => setCurrentTab('dashboard')}>
            <Ionicons name="bar-chart" size={20} color="#FFFFFF" />
          </TouchableOpacity>
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
          {/* REAL LOGOUT BUTTON */}
          <TouchableOpacity style={styles.appBarIconBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.mainScroll} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* ================================================================= */}
        {/* TAB 1: PURE ADMIN DASHBOARD (Exact 1:1 match to Screenshot 1 & 2) */}
        {/* ================================================================= */}
        {currentTab === 'dashboard' && (
          <View style={styles.tabContent}>
            
            {/* 1. Total Billed Revenue Hero Banner */}
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

            {/* 2. Low Stock Warning Alert Banner */}
            <TouchableOpacity style={styles.stockAlertBanner} onPress={() => setCurrentTab('inventory')}>
              <Ionicons name="warning-outline" size={24} color="#D97706" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stockAlertTitle}>2 Materials Below Minimum Stock!</Text>
                <Text style={styles.stockAlertSub}>
                  Avery Gloss Vinyl Roll (3/6 ROLL), Samsung 3-LED Module (120/300 PIECE)
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3. Today's Production & Field Summary 2x2 Grid */}
            <Text style={styles.sectionTitle}>Today's Production & Field Summary</Text>
            <View style={styles.summaryGrid}>
              
              {/* Card 1: Active Jobs */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle}>Active Jobs</Text>
                  <Ionicons name="clipboard-outline" size={18} color="#0284C7" />
                </View>
                <Text style={styles.summaryCardBigVal}>12</Text>
                <Text style={styles.summaryCardSub}>1480.0 Total Sq.Ft</Text>
              </View>

              {/* Card 2: Printing Output */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle}>Printing Output</Text>
                  <Ionicons name="print-outline" size={18} color="#0284C7" />
                </View>
                <Text style={[styles.summaryCardBigVal, { color: '#0284C7' }]}>665.0 Sq.Ft</Text>
                <Text style={styles.summaryCardSub}>Waste: 19.0 Sq.Ft</Text>
              </View>

              {/* Card 3: Site Visits */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle}>Site Visits Today</Text>
                  <Ionicons name="location-outline" size={18} color="#0284C7" />
                </View>
                <Text style={[styles.summaryCardBigVal, { color: '#4338CA' }]}>4</Text>
                <Text style={styles.summaryCardSub}>Tap to Schedule & Assign</Text>
              </View>

              {/* Card 4: Attendance & Team */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle}>Attendance & Team</Text>
                  <Ionicons name="checkmark-done-circle-outline" size={18} color="#10B981" />
                </View>
                <Text style={[styles.summaryCardBigVal, { color: '#10B981' }]}>8 / 9</Text>
                <Text style={styles.summaryCardSub}>★ 4.9 Rating</Text>
              </View>

            </View>

            {/* 4. Job Production Pipeline (Live Stages with Delivered Stage) */}
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

        {/* ================================================================= */}
        {/* TAB 2: INVENTORY (Exact 1:1 match to Screenshot 2) */}
        {/* ================================================================= */}
        {currentTab === 'inventory' && (
          <View style={styles.tabContent}>
            
            {/* Header with Title and Low Stock Counter */}
            <View style={styles.inventoryTopBar}>
              <Text style={styles.invTrackedText}>6 Materials Tracked</Text>
              <View style={styles.invAlertBadge}>
                <Text style={styles.invAlertBadgeText}>⚠️ 2 Low Stock Alerts</Text>
              </View>
            </View>

            {/* Material Items List */}
            {inventoryList.map((item) => (
              <View key={item.id} style={styles.invItemCard}>
                <View style={styles.invItemMain}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invItemName}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <Text
                        style={[
                          styles.invStockText,
                          { color: item.isLow ? '#EF4444' : '#10B981' },
                        ]}
                      >
                        Stock: {item.stock.toFixed(1)} {item.unit} (Min: {item.min.toFixed(1)})
                      </Text>
                      {item.isLow && (
                        <View style={styles.lowStockTag}>
                          <Text style={styles.lowStockTagText}>LOW STOCK</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.stockBtn}
                    onPress={() => {
                      setSelectedMaterial(item);
                      setStockModalVisible(true);
                    }}
                  >
                    <Text style={styles.stockBtnText}>Stock In / Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 3: INVOICES & PAYMENT LEDGER */}
        {/* ================================================================= */}
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
                        inv.status === 'PAID FULL' ? { color: '#10B981' } : { color: '#0284C7' },
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
                    onPress={() => Alert.alert('💳 Payment', `Record payment for ${inv.invoiceNumber}`)}
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

        {/* ================================================================= */}
        {/* TAB 4: RATE CALCULATOR */}
        {/* ================================================================= */}
        {currentTab === 'rate_calc' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Signage Rate & Estimation Calculator</Text>

            <View style={styles.calcCard}>
              <Text style={styles.calcFieldLabel}>Board Type</Text>
              <TextInput
                style={styles.calcInput}
                value={calcBoardType}
                onChangeText={setCalcBoardType}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.calcFieldLabel}>Width (Ft)</Text>
                  <TextInput
                    style={styles.calcInput}
                    keyboardType="numeric"
                    value={calcWidth}
                    onChangeText={setCalcWidth}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.calcFieldLabel}>Height (Ft)</Text>
                  <TextInput
                    style={styles.calcInput}
                    keyboardType="numeric"
                    value={calcHeight}
                    onChangeText={setCalcHeight}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.calcFieldLabel}>Rate / Sq.Ft (₹)</Text>
                  <TextInput
                    style={styles.calcInput}
                    keyboardType="numeric"
                    value={calcRatePerSqFt}
                    onChangeText={setCalcRatePerSqFt}
                  />
                </View>
              </View>

              {/* Calculation Summary Box */}
              <View style={styles.calcResultBox}>
                <View style={styles.calcResRow}>
                  <Text style={styles.calcResLabel}>Total Sq.Ft Area:</Text>
                  <Text style={styles.calcResVal}>{calculateQuotation().sqft} Sq.Ft</Text>
                </View>
                <View style={styles.calcResRow}>
                  <Text style={styles.calcResLabel}>Base Cost:</Text>
                  <Text style={styles.calcResVal}>₹{calculateQuotation().baseTotal.toLocaleString()}</Text>
                </View>
                <View style={styles.calcResRow}>
                  <Text style={styles.calcResLabel}>GST (18%):</Text>
                  <Text style={styles.calcResVal}>₹{calculateQuotation().gst.toLocaleString()}</Text>
                </View>
                <View style={[styles.calcResRow, { borderTopWidth: 1, borderTopColor: '#CBD5E1', paddingTop: 8, marginTop: 6 }]}>
                  <Text style={[styles.calcResLabel, { fontWeight: 'bold', color: '#0F172A' }]}>Grand Total:</Text>
                  <Text style={[styles.calcResVal, { color: '#0284C7', fontSize: 18 }]}>
                    ₹{calculateQuotation().grandTotal.toLocaleString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.generateQuotationBtn}
                onPress={() => {
                  const qMsg = `📋 *APEX SIGNAGE - INSTANT ESTIMATION*\n━━━━━━━━━━━━━━━━━━━━\n*Board Type:* ${calcBoardType}\n*Size:* ${calcWidth}ft × ${calcHeight}ft (${calculateQuotation().sqft} Sq.Ft)\n*Base Amount:* ₹${calculateQuotation().baseTotal}\n*GST (18%):* ₹${calculateQuotation().gst}\n*Grand Total:* ₹${calculateQuotation().grandTotal}\n━━━━━━━━━━━━━━━━━━━━\nCall +91 9423800532 for instant booking!`;
                  Linking.openURL(`whatsapp://send?phone=919423800532&text=${encodeURIComponent(qMsg)}`);
                }}
              >
                <FontAwesome5 name="whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.generateQuotationText}>Share Quotation on WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 5: SALARY SLIPS & ATTENDANCE */}
        {/* ================================================================= */}
        {currentTab === 'salary' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Staff Attendance & Salary Slips</Text>

            <View style={styles.salaryCard}>
              <View style={styles.salaryCardTop}>
                <View>
                  <Text style={styles.staffName}>Amit Verma (Field Boy)</Text>
                  <Text style={styles.staffDesignation}>26 Days Present • 4 Days OT</Text>
                </View>
                <View style={styles.statusPaidPill}>
                  <Text style={styles.statusPaidPillText}>READY</Text>
                </View>
              </View>

              <View style={styles.salaryGrid}>
                <View style={styles.salaryCol}>
                  <Text style={styles.salaryColLabel}>Basic Pay</Text>
                  <Text style={styles.salaryColVal}>₹18,000</Text>
                </View>
                <View style={styles.salaryCol}>
                  <Text style={styles.salaryColLabel}>Overtime</Text>
                  <Text style={[styles.salaryColVal, { color: '#10B981' }]}>+₹2,400</Text>
                </View>
                <View style={styles.salaryCol}>
                  <Text style={styles.salaryColLabel}>Net Payout</Text>
                  <Text style={[styles.salaryColVal, { color: '#0284C7' }]}>₹20,400</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.downloadSalaryBtn}
                onPress={() => Alert.alert('📄 Salary Slip', 'Salary slip PDF generated for Amit Verma.')}
              >
                <Ionicons name="download-outline" size={18} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.downloadSalaryText}>Download Monthly Pay Slip PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Stock In / Out Adjustment Modal */}
      <Modal visible={stockModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adjust Stock Quantity</Text>
            <Text style={styles.modalSub}>{selectedMaterial?.name}</Text>
            <Text style={styles.modalCurrentStock}>Current Stock: {selectedMaterial?.stock} {selectedMaterial?.unit}</Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={stockQty}
              onChangeText={setStockQty}
              placeholder="Enter quantity"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#10B981' }]}
                onPress={() => handleStockUpdate('IN')}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.modalActionBtnText}>Stock In (+)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => handleStockUpdate('OUT')}
              >
                <Ionicons name="remove-circle" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.modalActionBtnText}>Stock Out (-)</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setStockModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Bar (Exact 1:1 Match to Android Screenshots) */}
      <View style={styles.bottomNav}>
        
        <TouchableOpacity
          style={[styles.navItem, currentTab === 'dashboard' && styles.navItemActive]}
          onPress={() => setCurrentTab('dashboard')}
        >
          <Ionicons
            name="bar-chart"
            size={22}
            color={currentTab === 'dashboard' ? '#0284C7' : '#64748B'}
          />
          <Text style={[styles.navLabel, currentTab === 'dashboard' && styles.navLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'inventory' && styles.navItemActive]}
          onPress={() => setCurrentTab('inventory')}
        >
          <Ionicons
            name="cube-outline"
            size={22}
            color={currentTab === 'inventory' ? '#0284C7' : '#64748B'}
          />
          <Text style={[styles.navLabel, currentTab === 'inventory' && styles.navLabelActive]}>
            Inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'invoices' && styles.navItemActive]}
          onPress={() => setCurrentTab('invoices')}
        >
          <Ionicons
            name="receipt-outline"
            size={22}
            color={currentTab === 'invoices' ? '#0284C7' : '#64748B'}
          />
          <Text style={[styles.navLabel, currentTab === 'invoices' && styles.navLabelActive]}>
            Invoices
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'rate_calc' && styles.navItemActive]}
          onPress={() => setCurrentTab('rate_calc')}
        >
          <Ionicons
            name="calculator-outline"
            size={22}
            color={currentTab === 'rate_calc' ? '#0284C7' : '#64748B'}
          />
          <Text style={[styles.navLabel, currentTab === 'rate_calc' && styles.navLabelActive]}>
            Rate Calc
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'salary' && styles.navItemActive]}
          onPress={() => setCurrentTab('salary')}
        >
          <Ionicons
            name="document-text-outline"
            size={22}
            color={currentTab === 'salary' ? '#0284C7' : '#64748B'}
          />
          <Text style={[styles.navLabel, currentTab === 'salary' && styles.navLabelActive]}>
            Salary Slips
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Login Screen Styles (Exact match to Android Screenshot)
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
    borderColor: '#0284C7',
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F2744',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  tabContent: {
    padding: 16,
  },
  // Revenue Hero Banner
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
  // Stock Warning Banner
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
  // Section Headers
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 4,
  },
  // 2x2 Grid
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
  // Pipeline
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
    color: '#0284C7',
    fontWeight: '700',
  },
  // Inventory Tab
  inventoryTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  invTrackedText: {
    fontSize: 16,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  lowStockTagText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockBtn: {
    backgroundColor: '#0F2744',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  stockBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  // Invoices Tab
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
  // Rate Calc Tab
  calcCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calcFieldLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 4,
  },
  calcInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  calcResultBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 14,
    marginVertical: 16,
  },
  calcResRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calcResLabel: {
    fontSize: 13,
    color: '#475569',
  },
  calcResVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  generateQuotationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 10,
  },
  generateQuotationText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Salary Tab
  salaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  salaryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  staffName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  staffDesignation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusPaidPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPaidPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: 'bold',
  },
  salaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  salaryCol: {
    alignItems: 'flex-start',
  },
  salaryColLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  salaryColVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  downloadSalaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
  },
  downloadSalaryText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 13,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  modalCurrentStock: {
    fontSize: 14,
    color: '#0284C7',
    fontWeight: '600',
    marginVertical: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: '600',
  },
  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  navItemActive: {},
  navLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#0284C7',
    fontWeight: 'bold',
  },
});
