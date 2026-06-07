import mongoose from 'mongoose';
import EmployeeModel from '../../../models/Employee';
import AttendanceModel from '../../../models/Attendance';
import LeaveModel from '../../../models/Leave';
import SalaryStructureModel from '../../../models/SalaryStructure';
import BonusModel from '../../../models/Bonus';
import DeductionModel from '../../../models/Deduction';
import TaxConfigurationModel from '../../../models/TaxConfiguration';
import PayrollRunModel from '../../../models/PayrollRun';
import PayrollModel from '../../../models/Payroll';
import PayslipModel from '../../../models/Payslip';

export class PayrollService {
  /**
   * Fetch salary structure for an employee
   */
  async getSalaryStructure(employeeId: string) {
    const struct = await SalaryStructureModel.findOne({ employeeId });
    if (!struct) {
      // Return a default blank structure if not configured yet
      return {
        employeeId,
        baseSalary: 0,
        hra: 0,
        medical: 0,
        travel: 0,
        special: 0,
        otherAllowance: 0,
        pf: 0,
        insurance: 0,
      };
    }
    return struct;
  }

  /**
   * Save or update salary structure
   */
  async updateSalaryStructure(employeeId: string, data: any) {
    // Validate if employee has a locked payroll in processing? Generally allowed unless locked in active run
    const structure = await SalaryStructureModel.findOneAndUpdate(
      { employeeId },
      { $set: data },
      { new: true, upsert: true }
    );
    return structure;
  }

  /**
   * Record a one-time bonus
   */
  async addBonus(data: any) {
    const { employeeId, bonusType, amount, reason, date } = data;
    
    // Check if payroll run for that date's month is already locked
    const bonusDate = date ? new Date(date) : new Date();
    const month = bonusDate.getMonth() + 1;
    const year = bonusDate.getFullYear();
    
    const lockedRun = await PayrollRunModel.findOne({ month, year, isLocked: true });
    if (lockedRun) {
      throw new Error(`Cannot add bonus: Payroll run for ${month}/${year} is locked.`);
    }

    return await BonusModel.create({
      employeeId,
      bonusType,
      amount,
      reason,
      date: bonusDate
    });
  }

  /**
   * Record a manual deduction
   */
  async addDeduction(data: any) {
    const { employeeId, deductionType, amount, reason, date } = data;

    const dedDate = date ? new Date(date) : new Date();
    const month = dedDate.getMonth() + 1;
    const year = dedDate.getFullYear();

    const lockedRun = await PayrollRunModel.findOne({ month, year, isLocked: true });
    if (lockedRun) {
      throw new Error(`Cannot add deduction: Payroll run for ${month}/${year} is locked.`);
    }

    return await DeductionModel.create({
      employeeId,
      deductionType,
      amount,
      reason,
      date: dedDate
    });
  }

  /**
   * Generate Payroll Run
   */
  async generatePayrollRun(month: number, year: number, processedBy: string) {
    // 1. Check if run exists and is locked
    let run = await PayrollRunModel.findOne({ month, year });
    if (run && run.isLocked) {
      throw new Error(`Payroll run for ${month}/${year} is locked and cannot be regenerated.`);
    }

    if (!run) {
      run = await PayrollRunModel.create({
        month,
        year,
        status: 'PENDING',
        processedBy,
        totalCost: 0,
        employeesCount: 0
      });
    }

    // Update status to processing/generated
    run.status = 'GENERATED';
    run.processedBy = new mongoose.Types.ObjectId(processedBy) as any;
    await run.save();

    // Clear any existing payroll items for this run
    await PayrollModel.deleteMany({ payrollRunId: run._id });

    // 2. Fetch active employees
    const employees = await EmployeeModel.find({ isDeleted: false, employmentStatus: { $in: ['ACTIVE', 'ON_LEAVE', 'PROBATION'] } } as any);
    
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    // Fetch active tax configuration slabs
    const taxConfig = await TaxConfigurationModel.findOne({ isActive: true });
    const slabs = taxConfig?.slabs || [
      { minIncome: 0, maxIncome: 300000, taxRate: 0 },
      { minIncome: 300001, maxIncome: 600000, taxRate: 5 },
      { minIncome: 600001, maxIncome: 900000, taxRate: 10 },
      { minIncome: 900001, maxIncome: 1200000, taxRate: 15 },
      { minIncome: 1200001, maxIncome: 1500000, taxRate: 20 },
      { minIncome: 1500001, maxIncome: 99999999, taxRate: 30 }
    ];

    let totalRunCost = 0;
    let employeeCount = 0;

    for (const emp of employees) {
      const empId = emp._id;
      
      // A. Fetch salary structure
      const salaryStruct = await this.getSalaryStructure(empId.toString());
      const basePay = salaryStruct.baseSalary;
      const allowances = 
        salaryStruct.hra + 
        salaryStruct.medical + 
        salaryStruct.travel + 
        salaryStruct.special + 
        (salaryStruct.otherAllowance || 0);

      // B. Query attendance & calculate days
      const attendanceLogs = await AttendanceModel.find({
        employeeId: empId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });

      let workedDays = 0;
      let halfDays = 0;
      let absentDays = 0;
      let overtimeHours = 0;

      attendanceLogs.forEach(log => {
        if (log.attendanceStatus === 'PRESENT' || log.attendanceStatus === 'LATE' || log.attendanceStatus === 'WORK_FROM_HOME') {
          workedDays++;
        } else if (log.attendanceStatus === 'HALF_DAY') {
          halfDays++;
        } else if (log.attendanceStatus === 'ABSENT') {
          absentDays++;
        }
        if (log.overtimeHours) {
          overtimeHours += log.overtimeHours;
        }
      });

      // C. Query approved leaves
      const leavesList = await LeaveModel.find({
        employeeId: empId,
        status: 'APPROVED',
        startDate: { $lte: endOfMonth },
        endDate: { $gte: startOfMonth }
      } as any);

      let leaveDays = 0;
      leavesList.forEach(leave => {
        const start = Math.max(leave.startDate.getTime(), startOfMonth.getTime());
        const end = Math.min(leave.endDate.getTime(), endOfMonth.getTime());
        if (start <= end) {
          const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          leaveDays += diffDays;
        }
      });

      const attendancePercentage = totalDaysInMonth > 0 
        ? Math.min(((workedDays + (halfDays * 0.5) + leaveDays) / totalDaysInMonth) * 100, 100) 
        : 0;

      // D. Attendance formulas
      const dailyRate = totalDaysInMonth > 0 ? (basePay + allowances) / totalDaysInMonth : 0;
      
      // Absence deductions: deduct base pay proportionally
      const absentDeduction = absentDays * dailyRate;
      const halfDayDeduction = halfDays * (dailyRate / 2);
      const totalAttendanceDeductions = absentDeduction + halfDayDeduction;

      // Overtime Pay
      const overtimeRate = (basePay / 160) * 1.5;
      const overtimePay = overtimeHours * overtimeRate;

      // E. Query monthly bonuses & deductions
      const bonusLogs = await BonusModel.find({
        employeeId: empId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });
      const totalBonuses = bonusLogs.reduce((sum, b) => sum + b.amount, 0);

      const dedLogs = await DeductionModel.find({
        employeeId: empId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
        deductionType: { $ne: 'TAX' } // Exclude Tax as it is computed dynamically
      });
      const totalDeductions = dedLogs.reduce((sum, d) => sum + d.amount, 0) + (salaryStruct.pf || 0) + (salaryStruct.insurance || 0);

      // F. Tax Calculations (TDS)
      const monthlyGross = basePay + allowances + overtimePay + totalBonuses - totalAttendanceDeductions;
      const annualProjectedIncome = Math.max(monthlyGross * 12, 0);

      // Apply standard deduction (e.g. 50,000)
      const taxableIncome = Math.max(annualProjectedIncome - 50000, 0);
      let annualTax = 0;
      
      for (const slab of slabs) {
        if (taxableIncome > slab.minIncome) {
          const taxableInSlab = Math.min(taxableIncome, slab.maxIncome) - slab.minIncome;
          annualTax += taxableInSlab * (slab.taxRate / 100);
        }
      }
      
      const monthlyTax = annualTax / 12;

      // G. Net Salary Formula
      const netSalary = Math.max(monthlyGross - monthlyTax - totalDeductions, 0);

      // Save Payroll record
      await PayrollModel.create({
        payrollRunId: run._id,
        employeeId: empId,
        baseSalary: basePay,
        allowancesAmount: allowances,
        bonusesAmount: totalBonuses,
        overtimeAmount: overtimePay,
        deductionsAmount: totalDeductions,
        taxableIncome: monthlyGross, // gross
        taxAmount: monthlyTax,
        netSalary,
        isLocked: false,
        attendance: {
          workedDays,
          absentDays,
          leaveDays,
          overtimeHours,
          attendancePercentage
        }
      });

      totalRunCost += netSalary;
      employeeCount++;
    }

    run.totalCost = totalRunCost;
    run.employeesCount = employeeCount;
    await run.save();

    return run;
  }

  /**
   * Submit run for review
   */
  async submitForReview(runId: string, reviewedBy: string) {
    const run = await PayrollRunModel.findById(runId);
    if (!run) throw new Error('Payroll run not found.');
    if (run.isLocked) throw new Error('Run is locked.');

    run.status = 'UNDER_REVIEW';
    run.reviewedBy = new mongoose.Types.ObjectId(reviewedBy) as any;
    run.reviewedAt = new Date();
    await run.save();
    return run;
  }

  /**
   * Approve Payroll Run
   */
  async approvePayrollRun(runId: string, approvedBy: string) {
    const run = await PayrollRunModel.findById(runId);
    if (!run) throw new Error('Payroll run not found.');
    if (run.isLocked) throw new Error('Run is locked.');

    run.status = 'APPROVED';
    run.approvedBy = new mongoose.Types.ObjectId(approvedBy) as any;
    run.approvedAt = new Date();
    await run.save();
    return run;
  }

  /**
   * Mark run as PAID (Locks payroll and takes payslip snapshots)
   */
  async payPayrollRun(runId: string) {
    const run = await PayrollRunModel.findById(runId);
    if (!run) throw new Error('Payroll run not found.');
    if (run.status !== 'APPROVED') {
      throw new Error('Payroll run must be APPROVED before payment processing.');
    }

    run.status = 'PAID';
    run.isLocked = true;
    run.paidAt = new Date();
    await run.save();

    // Set lock on all payroll detail documents
    await PayrollModel.updateMany({ payrollRunId: run._id }, { $set: { isLocked: true } });

    // Fetch payroll items
    const payrollItems = await PayrollModel.find({ payrollRunId: run._id }).populate('employeeId');
    
    // Create immutable Payslip snapshots
    for (const item of payrollItems) {
      const emp = item.employeeId as any;
      if (!emp) continue;
      
      const salaryStruct = await this.getSalaryStructure(emp._id.toString());
      const payslipCode = `PAY-${run.year}-${String(run.month).padStart(2, '0')}-${emp.employeeCode}`;

      // Check if payslip already exists to avoid duplicate snapshot errors
      const exists = await PayslipModel.findOne({ payrollId: item._id });
      if (exists) continue;

      await PayslipModel.create({
        payrollId: item._id,
        employeeId: emp._id,
        month: run.month,
        year: run.year,
        payslipCode,
        salarySnapshot: {
          employeeName: `${emp.firstName} ${emp.lastName}`,
          employeeCode: emp.employeeCode,
          baseSalary: item.baseSalary,
          hra: salaryStruct.hra,
          medical: salaryStruct.medical,
          travel: salaryStruct.travel,
          special: salaryStruct.special,
          otherAllowance: salaryStruct.otherAllowance || 0,
          bonuses: item.bonusesAmount,
          pf: salaryStruct.pf,
          insurance: salaryStruct.insurance,
          deductions: item.deductionsAmount,
          taxableIncome: item.taxableIncome,
          taxAmount: item.taxAmount,
          grossSalary: item.taxableIncome + item.overtimeAmount, // gross calculation
          netSalary: item.netSalary
        }
      });
    }

    return run;
  }

  /**
   * Fetch employee payroll history
   */
  async getEmployeePayrollHistory(employeeId: string) {
    const payrolls = await PayrollModel.find({ employeeId })
      .populate('payrollRunId')
      .sort({ createdAt: -1 });
    
    // Map to user history shape
    return payrolls.map(p => {
      const run = p.payrollRunId as any;
      return {
        _id: p._id,
        month: run?.month,
        year: run?.year,
        baseSalary: p.baseSalary,
        grossSalary: p.taxableIncome,
        tax: p.taxAmount,
        deductions: p.deductionsAmount,
        netSalary: p.netSalary,
        status: run?.status,
        isLocked: p.isLocked
      };
    });
  }

  /**
   * Fetch single payslip with snapshot detail
   */
  async getPayslipByPayrollId(payrollId: string) {
    return await PayslipModel.findOne({ payrollId }).populate('employeeId');
  }

  /**
   * Fetch payslips list (scoped)
   */
  async getPayslips(query: any) {
    return await PayslipModel.find(query).populate('employeeId').sort({ year: -1, month: -1 });
  }

  /**
   * Tax configuration methods
   */
  async getTaxConfigurations() {
    return await TaxConfigurationModel.find().sort({ financialYear: -1 });
  }

  async createTaxConfiguration(data: any) {
    if (data.isActive) {
      // Deactivate other slabs
      await TaxConfigurationModel.updateMany({}, { $set: { isActive: false } });
    }
    return await TaxConfigurationModel.create(data);
  }

  async updateTaxConfiguration(id: string, data: any) {
    if (data.isActive) {
      await TaxConfigurationModel.updateMany({ _id: { $ne: id } }, { $set: { isActive: false } });
    }
    return await TaxConfigurationModel.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async getBonuses(query: any = {}) {
    return await BonusModel.find(query).populate('employeeId').sort({ date: -1 });
  }

  async getDeductions(query: any = {}) {
    return await DeductionModel.find(query).populate('employeeId').sort({ date: -1 });
  }
}

export default new PayrollService();

