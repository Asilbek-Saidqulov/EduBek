/** Enterprise Operations service — composes all 14 systems. */
import { generateTenantReport } from "./tenant-manager";
import { generateSubscriptionReport } from "./subscription-engine";
import { generateBillingSummary } from "./billing-engine";
import { generateInvoiceReport } from "./invoice-engine";
import { generateContractReport } from "./contract-manager";
import { generateProcurementReport } from "./procurement";
import { generateCustomerSuccessReport, generateRenewalReport } from "./customer-success";
import { generateOrganizationHealth } from "./organization-health";
import { generateRevenueReport } from "./revenue-analytics";
import { generateDeploymentReport } from "./deployment-manager";
import { generateEnterpriseDashboard } from "./enterprise-dashboard";
import { generateBusinessForecast } from "./forecasting";
import { generateBusinessReport } from "./reporting";

export {
  generateTenantReport,
  generateSubscriptionReport,
  generateBillingSummary,
  generateInvoiceReport,
  generateContractReport,
  generateProcurementReport,
  generateCustomerSuccessReport, generateRenewalReport,
  generateOrganizationHealth,
  generateRevenueReport,
  generateDeploymentReport,
  generateEnterpriseDashboard,
  generateBusinessForecast,
  generateBusinessReport,
};
