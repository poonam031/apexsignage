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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const BACKEND_URL = 'http://10.186.127.107:5000/api/v1';

// Predefined Staff Accounts
const DEMO_USERS = [
  {
    email: 'admin@signage.com',
    password: 'admin123',
    name: 'Rajesh Singhania',
    role: 'Admin',
    badgeColor: '#38BDF8',
    avatar: '👑',
  },
  {
    email: 'fieldboy@signage.com',
    password: 'field123',
    name: 'Amit Verma',
    role: 'Field Boy',
    badgeColor: '#10B981',
    avatar: '📸',
  },
  {
    email: 'installer@signage.com',
    password: 'install123',
    name: 'Vikram Shinde',
    role: 'Installation Lead',
    badgeColor: '#F59E0B',
    avatar: '🛠️',
  },
  {
    email: 'designer@signage.com',
    password: 'design123',
    name: 'Priya Sharma',
    role: 'Designer',
    badgeColor: '#EC4899',
    avatar: '🎨',
  },
];

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState(DEMO_USERS[0]); // Default to Super Admin for immediate access
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'inventory', 'invoices', 'rate_calc', 'salary'

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

  // Invoices State
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

  // Rate Calculator State
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

  // WhatsApp Dispatch
  const sendInvoiceWhatsApp = async (inv) => {
    const formattedPhone = '919423800532';
    const message = `🧾 *APEX SIGNAGE & PRINTING - INVOICE*\n━━━━━━━━━━━━━━━━━━━━\nDear *${inv.companyName}*,\n\nPlease find your official tax invoice details below:\n\n📄 *Invoice #:* ${inv.invoiceNumber}\n📅 *Date:* ${inv.date}\n💰 *Total Billed:* ₹${inv.totalAmount.toLocaleString()}\n✅ *Paid Amount:* ₹${inv.paidAmount.toLocaleString()}\n⚠️ *Balance Due:* ₹${inv.balanceDue.toLocaleString()}\n\n📥 *Download PDF Invoice:* http://10.186.127.107:5000/uploads/${inv.invoiceNumber}.pdf\n💳 *UPI Payment:* paytmqr.apexsignage@icici\n\nThank you for choosing Apex Signage!\n━━━━━━━━━━━━━━━━━━━━\n*Apex Signage & Printing Solutions*\nPhone: +91 9423800532`;

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

  // Handle Logout
  const handleLogout = () => {
    Alert.alert('Logout', 'Log out of Apex Signage Admin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Logged Out', 'Switched to guest mode.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1C33" />

      {/* Top Header Bar (Exact match to Android Navbar) */}
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
              Alert.alert('Role Switched', `Active User: ${DEMO_USERS[nextIndex].name} (${DEMO_USERS[nextIndex].role})`);
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
      <ScrollView style={styles.mainScroll} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* ================================================================= */}
        {/* TAB 1: DASHBOARD (Exact 1:1 match to Screenshot 1) */}
        {/* ================================================================= */}
        {currentTab === 'dashboard' && (
          <View style={styles.tabContent}>
            
            {/* Total Billed Revenue Hero Banner */}
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

            {/* Low Stock Warning Alert Banner */}
            <TouchableOpacity style={styles.stockAlertBanner} onPress={() => setCurrentTab('inventory')}>
              <Ionicons name="warning-outline" size={24} color="#D97706" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stockAlertTitle}>2 Materials Below Minimum Stock!</Text>
                <Text style={styles.stockAlertSub}>
                  Avery Gloss Vinyl Roll (3/6 ROLL), Samsung 3-LED Module (120/300 PIECE)
                </Text>
              </View>
            </TouchableOpacity>

            {/* Today's Production & Field Summary 2x2 Grid */}
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

            {/* Job Production Pipeline (Live Stages) */}
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
