import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 16,
    paddingRight: 16,
    fontFamily: 'Helvetica',
    color: '#14171A',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 840,
    borderWidth: 1,
    borderColor: '#14171A',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 24,
    paddingRight: 24,
    borderBottomWidth: 3,
    borderBottomColor: '#14171A',
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  brandSub: {
    fontSize: 9,
    color: '#666B6F',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  docTitle: {
    alignItems: 'flex-end',
  },
  docTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  periodText: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#666B6F',
    marginTop: 6,
  },
  regStrip: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#14171A',
  },
  cell: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 14,
    paddingRight: 14,
    borderRightWidth: 1,
    borderRightColor: '#D6D6D2',
  },
  cellLast: {
    borderRightWidth: 0,
  },
  label: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#666B6F',
    fontWeight: 'bold',
  },
  val: {
    fontFamily: 'Courier',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  statTagPaid: {
    color: '#2C4A66',
  },
  sectionTitle: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingLeft: 24,
    paddingRight: 24,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#14171A',
    borderBottomWidth: 1,
    borderBottomColor: '#D6D6D2',
  },
  moneyCols: {
    flexDirection: 'row',
  },
  moneyCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#14171A',
  },
  moneyColLast: {
    borderRightWidth: 0,
  },
  colHead: {
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 24,
    paddingRight: 24,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#14171A',
  },
  colHeadE: {
    color: '#2C4A66',
    backgroundColor: '#EAF0F5',
  },
  colHeadD: {
    color: '#7A1F2B',
    backgroundColor: '#F6EAEB',
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 24,
    paddingRight: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#D6D6D2',
  },
  lineItemText: {
    fontFamily: 'Courier',
    fontSize: 11,
  },
  lineItemVal: {
    fontWeight: 'bold',
  },
  colTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 24,
    paddingRight: 24,
    borderTopWidth: 2,
    borderTopColor: '#14171A',
  },
  colTotalText: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: 'bold',
  },
  totals: {
    borderTopWidth: 3,
    borderTopColor: '#14171A',
  },
  totalsInner: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 24,
    paddingRight: 24,
    alignItems: 'flex-end',
  },
  totalsTable: {
    width: 300,
  },
  rRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 4,
  },
  rText: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#666B6F',
  },
  rPosVal: {
    color: '#2C4A66',
  },
  rNegVal: {
    color: '#7A1F2B',
  },
  net: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 2,
    borderTopColor: '#14171A',
  },
  netLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  netVal: {
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: 'bold',
  },
  foot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 14,
    paddingLeft: 24,
    paddingRight: 24,
  },
  footText: {
    fontSize: 8,
    color: '#666B6F',
    fontFamily: 'Courier',
  },
});

const fmtMoney = (val: number | string | undefined) =>
  Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface PayslipPDFProps {
  payroll: any;
  tenantName?: string;
  pageSize?: string;
}

export const PayslipPDF: React.FC<PayslipPDFProps> = ({ payroll = {}, tenantName, pageSize = 'A4' }) => {
  const basicSalary = Number(payroll.basicSalary || 0);
  const bonuses = Number(payroll.bonuses || 0);
  const deductions = Number(payroll.deductions || 0);
  const netPay = Number(payroll.netPay || 0);
  const grossPay = basicSalary + bonuses;
  const isPaid = (payroll.status || '').toLowerCase() === 'paid';
  const monthName = monthNames[(Number(payroll.month) || 1) - 1] || '';
  const year = payroll.year || new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const employeeName = payroll.user?.fullName || 'Employee';
  const employeeEmail = payroll.user?.email || '';
  const slipId = String(payroll.id || '').slice(0, 8).toUpperCase();

  return (
    <Document>
      <Page size={pageSize as any} style={styles.page}>
        <View style={styles.sheet}>

          {/* Header */}
          <View style={styles.head}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <View style={{ width: 50, height: 50, marginRight: 16 }} />
              <View>
                <Text style={styles.brandName}>{(tenantName || 'HOTEL MANAGEMENT SYSTEM').toUpperCase()}</Text>
                <Text style={styles.brandSub}>Payroll Register — Human Resources Division</Text>
              </View>
            </View>
            <View style={styles.docTitle}>
              <Text style={styles.docTitleText}>PAYSLIP</Text>
              <Text style={styles.periodText}>{monthName.toUpperCase()} {year}</Text>
            </View>
          </View>

          {/* Employee Info Strip */}
          <View style={styles.regStrip}>
            <View style={styles.cell}>
              <Text style={styles.label}>Employee</Text>
              <Text style={styles.val}>{employeeName}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.val}>{employeeEmail || '—'}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Slip ID</Text>
              <Text style={styles.val}>{slipId || '—'}</Text>
            </View>
            <View style={[styles.cell, styles.cellLast]}>
              <Text style={styles.label}>Status</Text>
              <Text style={[styles.val, isPaid && styles.statTagPaid]}>
                {isPaid ? '[PAID]' : `[${(payroll.status || 'UNPAID').toUpperCase()}]`}
              </Text>
            </View>
          </View>

          {/* Earnings & Deductions */}
          <Text style={styles.sectionTitle}>Earnings & Deductions</Text>
          <View style={styles.moneyCols}>
            {/* Earnings Column */}
            <View style={styles.moneyCol}>
              <View style={[styles.colHead, styles.colHeadE]}>
                <Text>Earnings</Text>
              </View>
              <View style={styles.lineItem}>
                <Text style={styles.lineItemText}>Basic Salary</Text>
                <Text style={[styles.lineItemText, styles.lineItemVal]}>{fmtMoney(basicSalary)}</Text>
              </View>
              <View style={styles.lineItem}>
                <Text style={styles.lineItemText}>Bonuses</Text>
                <Text style={[styles.lineItemText, styles.lineItemVal]}>{fmtMoney(bonuses)}</Text>
              </View>
              <View style={styles.colTotalRow}>
                <Text style={styles.colTotalText}>Total Earnings</Text>
                <Text style={styles.colTotalText}>{fmtMoney(grossPay)}</Text>
              </View>
            </View>

            {/* Deductions Column */}
            <View style={[styles.moneyCol, styles.moneyColLast]}>
              <View style={[styles.colHead, styles.colHeadD]}>
                <Text>Deductions</Text>
              </View>
              <View style={styles.lineItem}>
                <Text style={styles.lineItemText}>Absence Deductions</Text>
                <Text style={[styles.lineItemText, styles.lineItemVal]}>{fmtMoney(deductions)}</Text>
              </View>
              <View style={styles.colTotalRow}>
                <Text style={styles.colTotalText}>Total Deductions</Text>
                <Text style={styles.colTotalText}>{fmtMoney(deductions)}</Text>
              </View>
            </View>
          </View>

          {/* Totals */}
          <View style={styles.totals}>
            <View style={styles.totalsInner}>
              <View style={styles.totalsTable}>
                <View style={styles.rRow}>
                  <Text style={styles.rText}>Total Earnings</Text>
                  <Text style={[styles.rText, styles.rPosVal]}>{fmtMoney(grossPay)}</Text>
                </View>
                <View style={styles.rRow}>
                  <Text style={styles.rText}>Total Deductions</Text>
                  <Text style={[styles.rText, styles.rNegVal]}>-{fmtMoney(deductions)}</Text>
                </View>
                <View style={styles.net}>
                  <Text style={styles.netLabel}>Net Payable</Text>
                  <Text style={styles.netVal}>Rs. {fmtMoney(netPay)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.foot}>
            <Text style={styles.footText}>HMS/PAYROLL/{currentYear}</Text>
            <Text style={styles.footText}>Not valid without payroll office stamp</Text>
          </View>

        </View>
      </Page>
    </Document>
  );
};
