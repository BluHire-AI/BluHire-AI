"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceSuccessionService = exports.PerformanceSuccessionService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const SuccessionPlan_1 = require("../../../models/SuccessionPlan");
const Employee_1 = __importDefault(require("../../../models/Employee"));
const performance_service_1 = require("./performance.service");
class PerformanceSuccessionService {
    async generateSuccessionPlan(position, currentEmployeeId) {
        const employees = await Employee_1.default.find({ isDeleted: false }).limit(20);
        const successorCandidates = [];
        for (const emp of employees) {
            if (currentEmployeeId && emp._id.toString() === currentEmployeeId) {
                continue;
            }
            try {
                const promo = await performance_service_1.performanceService.evaluatePromotion(emp._id.toString());
                let recommendedTimeline = '12-24 Months';
                if (promo.readinessScore >= 85) {
                    recommendedTimeline = 'Immediate';
                }
                else if (promo.readinessScore >= 70) {
                    recommendedTimeline = '6-12 Months';
                }
                const suitabilityReasons = [];
                if (promo.strengths && promo.strengths.length > 0) {
                    suitabilityReasons.push(...promo.strengths.slice(0, 3));
                }
                else {
                    suitabilityReasons.push('Demonstrated technical growth and goals completion.');
                }
                successorCandidates.push({
                    employeeId: emp._id,
                    readinessScore: promo.readinessScore,
                    recommendedTimeline,
                    suitabilityReasons
                });
            }
            catch (err) {
                console.error(`Error calculating succession readiness for employee ${emp._id}:`, err);
            }
        }
        successorCandidates.sort((a, b) => b.readinessScore - a.readinessScore);
        const topCandidates = successorCandidates.slice(0, 5);
        const plan = await SuccessionPlan_1.SuccessionPlan.findOneAndUpdate({ position }, {
            $set: {
                currentEmployee: currentEmployeeId ? new mongoose_1.default.Types.ObjectId(currentEmployeeId) : undefined,
                successorCandidates: topCandidates,
                generatedAt: new Date()
            }
        }, { upsert: true, returnDocument: 'after' });
        return await SuccessionPlan_1.SuccessionPlan.findById(plan._id)
            .populate('currentEmployee', 'firstName lastName employeeCode departmentId designationId')
            .populate('successorCandidates.employeeId', 'firstName lastName employeeCode departmentId designationId');
    }
    async getSuccessionPlan(position) {
        const plan = await SuccessionPlan_1.SuccessionPlan.findOne({ position })
            .populate('currentEmployee', 'firstName lastName employeeCode departmentId designationId')
            .populate('successorCandidates.employeeId', 'firstName lastName employeeCode departmentId designationId');
        if (!plan) {
            return await this.generateSuccessionPlan(position);
        }
        return plan;
    }
    async getAllPlans() {
        return await SuccessionPlan_1.SuccessionPlan.find({})
            .populate('currentEmployee', 'firstName lastName employeeCode departmentId designationId')
            .populate('successorCandidates.employeeId', 'firstName lastName employeeCode departmentId designationId')
            .limit(100);
    }
}
exports.PerformanceSuccessionService = PerformanceSuccessionService;
exports.performanceSuccessionService = new PerformanceSuccessionService();
