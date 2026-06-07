import { Router } from 'express';
import payrollController from '../controllers/payroll.controller';
import { requireRole, EmployeeModuleRoles } from '../../employee/middlewares/rbac.middleware';

const router = Router();

// 1. Payroll runs list & generation
router.get(
  '/payroll/runs',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getPayrollRuns.bind(payrollController)
);

router.post(
  '/payroll/generate',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.generatePayroll.bind(payrollController)
);

router.post(
  '/payroll/runs/:runId/review',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.submitForReview.bind(payrollController)
);

router.post(
  '/payroll/runs/:runId/approve',
  requireRole(EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.approvePayrollRun.bind(payrollController)
);

router.post(
  '/payroll/runs/:runId/pay',
  requireRole(EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.payPayrollRun.bind(payrollController)
);

// 2. Payroll items & details within run
router.get(
  '/payroll/items',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getPayrollItems.bind(payrollController)
);

// 3. Employee salary structures setup
router.get(
  '/payroll/salary-structure/:employeeId',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getSalaryStructure.bind(payrollController)
);

router.post(
  '/payroll/salary-structure/:employeeId',
  requireRole(EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.updateSalaryStructure.bind(payrollController)
);

// 4. One-time adjustment tools
router.post(
  '/payroll/bonus',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.addBonus.bind(payrollController)
);

router.post(
  '/payroll/deduction',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.addDeduction.bind(payrollController)
);

// 5. Employee self-service & history logs
router.get(
  '/payroll/history',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getEmployeeHistory.bind(payrollController)
);

router.get(
  '/payslips',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getPayslips.bind(payrollController)
);

router.get(
  '/payslips/:id',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getPayslip.bind(payrollController)
);

// 6. Configurable Tax slabs management
router.get(
  '/payroll/tax-config',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getTaxConfigurations.bind(payrollController)
);

router.post(
  '/payroll/tax-config',
  requireRole(EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.createTaxConfiguration.bind(payrollController)
);

router.put(
  '/payroll/tax-config/:id',
  requireRole(EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.updateTaxConfiguration.bind(payrollController)
);

// 7. Executive analytics compiled report
router.get(
  '/payroll/analytics',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getPayrollAnalytics.bind(payrollController)
);

// 8. Adjustment catalogs
router.get(
  '/payroll/bonus',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getBonuses.bind(payrollController)
);

router.get(
  '/payroll/deduction',
  requireRole(EmployeeModuleRoles.EMPLOYEE, EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getDeductions.bind(payrollController)
);

// --- QA/Standard Route Aliases ---
router.get(
  '/payroll',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getPayrollRuns.bind(payrollController)
);

router.get(
  '/payroll/:id',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.getPayrollRunById.bind(payrollController)
);

router.post(
  '/salary-structure',
  requireRole(EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.updateSalaryStructureAlias.bind(payrollController)
);

router.post(
  '/bonus',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.addBonus.bind(payrollController)
);

router.post(
  '/deduction',
  requireRole(EmployeeModuleRoles.HR_RECRUITER, EmployeeModuleRoles.MANAGEMENT_ADMIN),
  payrollController.addDeduction.bind(payrollController)
);

export default router;


