import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { Dashboard } from './pages/Dashboard';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { CategoriesPage } from './pages/inventory/CategoriesPage';
import { ProductsPage } from './pages/inventory/ProductsPage';
import { StockInPage } from './pages/inventory/StockInPage';
import { StockAdjustmentPage } from './pages/inventory/StockAdjustmentPage';
import { StockMovementsPage } from './pages/inventory/StockMovementsPage';
import { LowStockAlertsPage } from './pages/inventory/LowStockAlertsPage';
import { MyWorkersPage } from './pages/supervisor/MyWorkersPage';
import { DailyAttendancePage } from './pages/supervisor/DailyAttendancePage';
import { AttendanceHistoryPage } from './pages/supervisor/AttendanceHistoryPage';
import { SectorAttendanceSummaryPage } from './pages/team-leader/SectorAttendanceSummaryPage';
import { AttendanceReportsPage } from './pages/admin/AttendanceReportsPage';
import { CreateCreditRequest } from './pages/credit/CreateCreditRequest';
import { MyTeamRequests } from './pages/credit/MyTeamRequests';
import { AdminApproval } from './pages/credit/AdminApproval';
import { WorkerDebtHistory } from './pages/credit/WorkerDebtHistory';
import { DebtReports } from './pages/reports/DebtReports';
import { SectorDebtSummary } from './pages/reports/SectorDebtSummary';
import { SupervisorDebtSummary } from './pages/reports/SupervisorDebtSummary';
import { PayrollPeriods } from './pages/payroll/PayrollPeriods';
import { GeneratePayroll } from './pages/payroll/GeneratePayroll';
import { PayrollList } from './pages/payroll/PayrollList';
import { BankTransferSummary } from './pages/payroll/BankTransferSummary';
import { TeamLeaderPayrollPreview } from './pages/payroll/TeamLeaderPayrollPreview';
import { AccountantNetSalaryReports } from './pages/payroll/AccountantNetSalaryReports';

import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

          {/* Inventory Module Routes */}
          <Route
            path="/inventory/products"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <DashboardLayout>
                  <ProductsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/categories"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <DashboardLayout>
                  <CategoriesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/stock-in"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <StockInPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/adjustments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <StockAdjustmentPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/movements"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <DashboardLayout>
                  <StockMovementsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/low-stock"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <DashboardLayout>
                  <LowStockAlertsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* Redirect /inventory to /inventory/products */}
          <Route path="/inventory" element={<Navigate to="/inventory/products" replace />} />

          {/* Attendance Module Routes */}
          <Route
            path="/attendance/workers"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <DashboardLayout>
                  <MyWorkersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/daily"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <DashboardLayout>
                  <DailyAttendancePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/history"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <DashboardLayout>
                  <AttendanceHistoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/summary"
            element={
              <ProtectedRoute allowedRoles={['team_leader']}>
                <DashboardLayout>
                  <SectorAttendanceSummaryPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <DashboardLayout>
                  <AttendanceReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* Redirect /attendance to appropriate page based on role would be ideal, but for now just a simple redirect or placeholder */}
          <Route path="/attendance" element={<Navigate to="/" replace />} />

          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={['admin', 'team_leader', 'supervisor']}>
                <DashboardLayout>
                  <EmployeeListPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Credit Request Module Routes */}
          <Route
            path="/credit/create"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <DashboardLayout>
                  <CreateCreditRequest />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit/my-team"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <DashboardLayout>
                  <MyTeamRequests />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit/approval"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminApproval />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit/history"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <DashboardLayout>
                  <WorkerDebtHistory />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Debt Reports Module Routes */}
          <Route
            path="/reports/debt"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <DashboardLayout>
                  <DebtReports />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/sector-debt"
            element={
              <ProtectedRoute allowedRoles={['team_leader']}>
                <DashboardLayout>
                  <SectorDebtSummary />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/supervisor-debt"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <DashboardLayout>
                  <SupervisorDebtSummary />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Payroll Engine Routes */}
          <Route
            path="/payroll/periods"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <DashboardLayout>
                  <PayrollPeriods />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll/generate/:periodId"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <DashboardLayout>
                  <GeneratePayroll />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll/list/:periodId"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <DashboardLayout>
                  <PayrollList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll/bank-transfer/:periodId"
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <DashboardLayout>
                  <BankTransferSummary />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll/sector-preview"
            element={
              <ProtectedRoute allowedRoles={['team_leader']}>
                <DashboardLayout>
                  <TeamLeaderPayrollPreview />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll/net-salary-reports"
            element={
              <ProtectedRoute allowedRoles={['accountant']}>
                <DashboardLayout>
                  <AccountantNetSalaryReports />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">System Settings</h1>
                    <p className="text-stone-500">Settings features coming soon in Phase 2.</p>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
