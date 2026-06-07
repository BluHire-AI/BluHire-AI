import { Response } from 'express';
import payrollService from '../services/payroll.service';
import { createSuccessResponse, createErrorResponse } from '../../employee/dtos/common.dto';
import PayrollRunModel from '../../../models/PayrollRun';
import PayrollModel from '../../../models/Payroll';
import EmployeeModel from '../../../models/Employee';
import PayslipModel from '../../../models/Payslip';


export class PayrollController {
  async getSalaryStructure(req: any, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const structure = await payrollService.getSalaryStructure(employeeId);
      res.json(createSuccessResponse(structure, 'Salary structure retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve salary structure'));
    }
  }

  async updateSalaryStructure(req: any, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const structure = await payrollService.updateSalaryStructure(employeeId, req.body);
      res.json(createSuccessResponse(structure, 'Salary structure updated successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to update salary structure'));
    }
  }

  async addBonus(req: any, res: Response): Promise<void> {
    try {
      const bonus = await payrollService.addBonus(req.body);
      res.json(createSuccessResponse(bonus, 'Bonus recorded successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to record bonus'));
    }
  }

  async addDeduction(req: any, res: Response): Promise<void> {
    try {
      const deduction = await payrollService.addDeduction(req.body);
      res.json(createSuccessResponse(deduction, 'Deduction recorded successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to record deduction'));
    }
  }

  async generatePayroll(req: any, res: Response): Promise<void> {
    try {
      const { month, year } = req.body;
      if (!month || !year) {
        res.status(400).json(createErrorResponse('Month and year are required'));
        return;
      }
      const run = await payrollService.generatePayrollRun(Number(month), Number(year), req.user.id || req.user._id);
      res.json(createSuccessResponse(run, 'Payroll run generated successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to generate payroll run'));
    }
  }

  async submitForReview(req: any, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      const run = await payrollService.submitForReview(runId, req.user.id || req.user._id);
      res.json(createSuccessResponse(run, 'Payroll submitted for review successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to submit payroll for review'));
    }
  }

  async approvePayrollRun(req: any, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      const run = await payrollService.approvePayrollRun(runId, req.user.id || req.user._id);
      res.json(createSuccessResponse(run, 'Payroll approved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to approve payroll'));
    }
  }

  async payPayrollRun(req: any, res: Response): Promise<void> {
    try {
      const { runId } = req.params;
      const run = await payrollService.payPayrollRun(runId);
      res.json(createSuccessResponse(run, 'Payroll paid and locked successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to process payments'));
    }
  }

  async getPayrollRuns(req: any, res: Response): Promise<void> {
    try {
      const runs = await PayrollRunModel.find().sort({ year: -1, month: -1 });
      res.json(createSuccessResponse(runs, 'Payroll runs retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve payroll runs'));
    }
  }

  async getPayrollItems(req: any, res: Response): Promise<void> {
    try {
      const { runId } = req.query;
      if (!runId) {
        res.status(400).json(createErrorResponse('runId parameter is required'));
        return;
      }
      const items = await PayrollModel.find({ payrollRunId: runId }).populate('employeeId');
      res.json(createSuccessResponse(items, 'Payroll items retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve payroll details'));
    }
  }

  async getEmployeeHistory(req: any, res: Response): Promise<void> {
    try {
      // Find employee associated with current user if not HR
      let employeeId = req.query.employeeId;
      if (!employeeId) {
        const emp = await EmployeeModel.findOne({ userId: req.user.id || req.user._id });
        if (!emp) {
          res.status(404).json(createErrorResponse('Employee record not found for logged in user'));
          return;
        }
        employeeId = emp._id.toString();
      } else {
        // Scoped check: if user is not HR and tries to fetch another employee's history
        const isHR = req.user.role === 'HR_RECRUITER' || req.user.role === 'MANAGEMENT_ADMIN';
        if (!isHR) {
          const emp = await EmployeeModel.findOne({ userId: req.user.id || req.user._id });
          if (!emp || emp._id.toString() !== employeeId) {
            res.status(403).json(createErrorResponse('Forbidden: You can only view your own payroll history'));
            return;
          }
        }
      }

      const history = await payrollService.getEmployeePayrollHistory(employeeId);
      res.json(createSuccessResponse(history, 'Payroll history retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve payroll history'));
    }
  }

  async getPayslips(req: any, res: Response): Promise<void> {
    try {
      const isHR = req.user.role === 'HR_RECRUITER' || req.user.role === 'MANAGEMENT_ADMIN';
      let query: any = {};
      if (!isHR) {
        const emp = await EmployeeModel.findOne({ userId: req.user.id || req.user._id });
        if (!emp) {
          res.status(404).json(createErrorResponse('Employee profile not found'));
          return;
        }
        query.employeeId = emp._id;
      } else if (req.query.employeeId) {
        query.employeeId = req.query.employeeId;
      }
      
      const payslips = await payrollService.getPayslips(query);
      res.json(createSuccessResponse(payslips, 'Payslips list retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve payslips'));
    }
  }

  async getPayslip(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params; // payrollId or payslipId
      let payslip = await PayslipModel.findById(id).populate('employeeId');
      if (!payslip) {
        // Fallback: try querying by payrollId
        payslip = await PayslipModel.findOne({ payrollId: id }).populate('employeeId');
      }

      if (!payslip) {
        res.status(404).json(createErrorResponse('Payslip not found'));
        return;
      }

      // Access validation
      const isHR = req.user.role === 'HR_RECRUITER' || req.user.role === 'MANAGEMENT_ADMIN';
      if (!isHR) {
        const emp = await EmployeeModel.findOne({ userId: req.user.id || req.user._id });
        if (!emp || emp._id.toString() !== payslip.employeeId._id.toString()) {
          res.status(403).json(createErrorResponse('Forbidden: You can only view your own payslips'));
          return;
        }
      }

      res.json(createSuccessResponse(payslip, 'Payslip details retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve payslip details'));
    }
  }

  async getTaxConfigurations(req: any, res: Response): Promise<void> {
    try {
      const configs = await payrollService.getTaxConfigurations();
      res.json(createSuccessResponse(configs, 'Tax configurations retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve tax configurations'));
    }
  }

  async createTaxConfiguration(req: any, res: Response): Promise<void> {
    try {
      const config = await payrollService.createTaxConfiguration(req.body);
      res.json(createSuccessResponse(config, 'Tax configuration created successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to create tax configuration'));
    }
  }

  async updateTaxConfiguration(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const config = await payrollService.updateTaxConfiguration(id, req.body);
      res.json(createSuccessResponse(config, 'Tax configuration updated successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to update tax configuration'));
    }
  }

  async getPayrollAnalytics(req: any, res: Response): Promise<void> {
    try {
      // Return dynamic stats: sum totalCost across monthly runs of the current year, average salary, overtime cost, bonuses, deductions
      const runs = await PayrollRunModel.find({ status: 'PAID' }).sort({ year: 1, month: 1 });
      
      const totalCost = runs.reduce((sum, r) => sum + r.totalCost, 0);
      const avgSalaryRes = await PayrollModel.aggregate([
        { $group: { _id: null, avgNet: { $avg: '$netSalary' }, totalOvertime: { $sum: '$overtimeAmount' }, totalBonuses: { $sum: '$bonusesAmount' }, totalDeductions: { $sum: '$deductionsAmount' } } }
      ]);
      const metrics = avgSalaryRes[0] || { avgNet: 0, totalOvertime: 0, totalBonuses: 0, totalDeductions: 0 };

      // Department payroll distribution
      const deptBreakdown = await PayrollModel.aggregate([
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' },
        {
          $lookup: {
            from: 'departments',
            localField: 'employee.departmentId',
            foreignField: '_id',
            as: 'dept'
          }
        },
        { $unwind: '$dept' },
        {
          $group: {
            _id: '$dept.name',
            cost: { $sum: '$netSalary' }
          }
        }
      ]);

      res.json(createSuccessResponse({
        costHistory: runs.map(r => ({ label: `${r.month}/${r.year}`, cost: r.totalCost })),
        avgSalary: metrics.avgNet,
        totalOvertimeCost: metrics.totalOvertime,
        totalBonusCost: metrics.totalBonuses,
        totalDeductionCost: metrics.totalDeductions,
        departmentDistribution: deptBreakdown.map(d => ({ name: d._id, value: d.cost }))
      }, 'Payroll analytics compiled successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to compile analytics'));
    }
  }

  async getBonuses(req: any, res: Response): Promise<void> {
    try {
      const isHR = req.user.role === 'HR_RECRUITER' || req.user.role === 'MANAGEMENT_ADMIN';
      let query: any = {};
      if (!isHR) {
        const emp = await EmployeeModel.findOne({ userId: req.user.id || req.user._id });
        if (!emp) {
          res.status(404).json(createErrorResponse('Employee profile not found'));
          return;
        }
        query.employeeId = emp._id;
      } else if (req.query.employeeId) {
        query.employeeId = req.query.employeeId;
      }
      const list = await payrollService.getBonuses(query);
      res.json(createSuccessResponse(list, 'Bonuses retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve bonuses'));
    }
  }

  async getDeductions(req: any, res: Response): Promise<void> {
    try {
      const isHR = req.user.role === 'HR_RECRUITER' || req.user.role === 'MANAGEMENT_ADMIN';
      let query: any = {};
      if (!isHR) {
        const emp = await EmployeeModel.findOne({ userId: req.user.id || req.user._id });
        if (!emp) {
          res.status(404).json(createErrorResponse('Employee profile not found'));
          return;
        }
        query.employeeId = emp._id;
      } else if (req.query.employeeId) {
        query.employeeId = req.query.employeeId;
      }
      const list = await payrollService.getDeductions(query);
      res.json(createSuccessResponse(list, 'Deductions retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve deductions'));
    }
  }

  async getPayrollRunById(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const run = await PayrollRunModel.findById(id).populate('processedBy reviewedBy approvedBy');
      if (!run) {
        res.status(404).json(createErrorResponse('Payroll run not found'));
        return;
      }
      res.json(createSuccessResponse(run, 'Payroll run retrieved successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to retrieve payroll run'));
    }
  }

  async updateSalaryStructureAlias(req: any, res: Response): Promise<void> {
    try {
      const { employeeId } = req.body;
      if (!employeeId) {
        res.status(400).json(createErrorResponse('employeeId parameter is required'));
        return;
      }
      const structure = await payrollService.updateSalaryStructure(employeeId, req.body);
      res.json(createSuccessResponse(structure, 'Salary structure updated successfully'));
    } catch (error: any) {
      res.status(400).json(createErrorResponse(error.message || 'Failed to update salary structure'));
    }
  }
}

export default new PayrollController();


