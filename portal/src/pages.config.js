/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AcceptInvitation from './pages/AcceptInvitation';
import AdministrationHub from './pages/AdministrationHub';
import AdvancedCommissions from './pages/AdvancedCommissions';
import AdvancedOrchestrator from './pages/AdvancedOrchestrator';
import AlertsCenter from './pages/AlertsCenter';
import AuditLogs from './pages/AuditLogs';
import AutoDecisionQueue from './pages/AutoDecisionQueue';
import AverbationControl from './pages/AverbationControl';
import BusinessIntelligence from './pages/BusinessIntelligence';
import CNPJManagement from './pages/CNPJManagement';
import CRM from './pages/CRM';
import CashflowDashboard from './pages/CashflowDashboard';
import ClientDetail from './pages/ClientDetail';
import ClientPortal from './pages/ClientPortal';
import Clients from './pages/Clients';
import CollectionDashboard from './pages/CollectionDashboard';
import CollectionDetail from './pages/CollectionDetail';
import Collections from './pages/Collections';
import CollectionsBI from './pages/CollectionsBI';
import CommercialDashboard2 from './pages/CommercialDashboard2';
import CommissionManagement from './pages/CommissionManagement';
import CommissionRules from './pages/CommissionRules';
import ConsolidatedDRE from './pages/ConsolidatedDRE';
import ContasAPagar from './pages/ContasAPagar';
import ContasAReceber from './pages/ContasAReceber';
import ConvenioApprovals from './pages/ConvenioApprovals';
import ConvenioBI from './pages/ConvenioBI';
import ConvenioDiligence from './pages/ConvenioDiligence';
import ConvenioDocuments from './pages/ConvenioDocuments';
import ConvenioHub from './pages/ConvenioHub';
import ConvenioNotifications from './pages/ConvenioNotifications';
import ConvenioProspection from './pages/ConvenioProspection';
import ConvenioRelationship from './pages/ConvenioRelationship';
import ConvenioSettings from './pages/ConvenioSettings';
import ConvenioSignatures from './pages/ConvenioSignatures';
import CreditSimulator from './pages/CreditSimulator';
import CustomerServiceHub from './pages/CustomerServiceHub';
import CustomizableHome from './pages/CustomizableHome';
import Dashboard from './pages/Dashboard';
import DecisionEngine from './pages/DecisionEngine';
import DeviceSecurityManagement from './pages/DeviceSecurityManagement';
import DocumentManager from './pages/DocumentManager';
import DualApprovalQueue from './pages/DualApprovalQueue';
import ESignatureManagement from './pages/ESignatureManagement';
import ExceptionMonitoring from './pages/ExceptionMonitoring';
import FIDCManagement from './pages/FIDCManagement';
import FastProposal from './pages/FastProposal';
import FileVersionControl from './pages/FileVersionControl';
import Financial from './pages/Financial';
import FinancialBI from './pages/FinancialBI';
import FinancialHub from './pages/FinancialHub';
import HRDevelopment from './pages/HRDevelopment';
import HREmployees from './pages/HREmployees';
import Integrations from './pages/Integrations';
import InviteUser from './pages/InviteUser';
import LegalBI from './pages/LegalBI';
import LegalHub from './pages/LegalHub';
import LegalNotifications from './pages/LegalNotifications';
import LegalProcesses from './pages/LegalProcesses';
import MachineLearningDashboard from './pages/MachineLearningDashboard';
import MarketingHub from './pages/MarketingHub';
import NewProposal from './pages/NewProposal';
import Omnichannel from './pages/Omnichannel';
import OperationalHome from './pages/OperationalHome';
import PasswordRecovery from './pages/PasswordRecovery';
import PayrollManager from './pages/PayrollManager';
import PeopleHub from './pages/PeopleHub';
import PermissionsManager from './pages/PermissionsManager';
import PortalFirstAccess from './pages/PortalFirstAccess';
import PortalLogin from './pages/PortalLogin';
import PortfolioManagement from './pages/PortfolioManagement';
import PortfolioOperations from './pages/PortfolioOperations';
import ProposalDetail from './pages/ProposalDetail';
import Proposals from './pages/Proposals';
import ProposalsHub from './pages/ProposalsHub';
import ProposalsOptimized from './pages/ProposalsOptimized';
import RefinancingCampaigns from './pages/RefinancingCampaigns';
import Reports from './pages/Reports';
import ReportsManager from './pages/ReportsManager';
import ServerClientPortal from './pages/ServerClientPortal';
import ServiceOrchestrator from './pages/ServiceOrchestrator';
import SystemParameters from './pages/SystemParameters';
import SystemTraining from './pages/SystemTraining';
import TaskManager from './pages/TaskManager';
import TechnologyHub from './pages/TechnologyHub';
import UserManagement from './pages/UserManagement';
import VerificationSettings from './pages/VerificationSettings';
import WhatsAppAgent from './pages/WhatsAppAgent';
import WhatsAppSimulation from './pages/WhatsAppSimulation';
import WhatsAppSimulator from './pages/WhatsAppSimulator';
import WhatsAppStrategy from './pages/WhatsAppStrategy';
import WorkflowManager from './pages/WorkflowManager';
import DocumentationPDF from './pages/DocumentationPDF';
import TrainingPDF from './pages/TrainingPDF';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcceptInvitation": AcceptInvitation,
    "AdministrationHub": AdministrationHub,
    "AdvancedCommissions": AdvancedCommissions,
    "AdvancedOrchestrator": AdvancedOrchestrator,
    "AlertsCenter": AlertsCenter,
    "AuditLogs": AuditLogs,
    "AutoDecisionQueue": AutoDecisionQueue,
    "AverbationControl": AverbationControl,
    "BusinessIntelligence": BusinessIntelligence,
    "CNPJManagement": CNPJManagement,
    "CRM": CRM,
    "CashflowDashboard": CashflowDashboard,
    "ClientDetail": ClientDetail,
    "ClientPortal": ClientPortal,
    "Clients": Clients,
    "CollectionDashboard": CollectionDashboard,
    "CollectionDetail": CollectionDetail,
    "Collections": Collections,
    "CollectionsBI": CollectionsBI,
    "CommercialDashboard2": CommercialDashboard2,
    "CommissionManagement": CommissionManagement,
    "CommissionRules": CommissionRules,
    "ConsolidatedDRE": ConsolidatedDRE,
    "ContasAPagar": ContasAPagar,
    "ContasAReceber": ContasAReceber,
    "ConvenioApprovals": ConvenioApprovals,
    "ConvenioBI": ConvenioBI,
    "ConvenioDiligence": ConvenioDiligence,
    "ConvenioDocuments": ConvenioDocuments,
    "ConvenioHub": ConvenioHub,
    "ConvenioNotifications": ConvenioNotifications,
    "ConvenioProspection": ConvenioProspection,
    "ConvenioRelationship": ConvenioRelationship,
    "ConvenioSettings": ConvenioSettings,
    "ConvenioSignatures": ConvenioSignatures,
    "CreditSimulator": CreditSimulator,
    "CustomerServiceHub": CustomerServiceHub,
    "CustomizableHome": CustomizableHome,
    "Dashboard": Dashboard,
    "DecisionEngine": DecisionEngine,
    "DeviceSecurityManagement": DeviceSecurityManagement,
    "DocumentManager": DocumentManager,
    "DualApprovalQueue": DualApprovalQueue,
    "ESignatureManagement": ESignatureManagement,
    "ExceptionMonitoring": ExceptionMonitoring,
    "FIDCManagement": FIDCManagement,
    "FastProposal": FastProposal,
    "FileVersionControl": FileVersionControl,
    "Financial": Financial,
    "FinancialBI": FinancialBI,
    "FinancialHub": FinancialHub,
    "HRDevelopment": HRDevelopment,
    "HREmployees": HREmployees,
    "Integrations": Integrations,
    "InviteUser": InviteUser,
    "LegalBI": LegalBI,
    "LegalHub": LegalHub,
    "LegalNotifications": LegalNotifications,
    "LegalProcesses": LegalProcesses,
    "MachineLearningDashboard": MachineLearningDashboard,
    "MarketingHub": MarketingHub,
    "NewProposal": NewProposal,
    "Omnichannel": Omnichannel,
    "OperationalHome": OperationalHome,
    "PasswordRecovery": PasswordRecovery,
    "PayrollManager": PayrollManager,
    "PeopleHub": PeopleHub,
    "PermissionsManager": PermissionsManager,
    "PortalFirstAccess": PortalFirstAccess,
    "PortalLogin": PortalLogin,
    "PortfolioManagement": PortfolioManagement,
    "PortfolioOperations": PortfolioOperations,
    "ProposalDetail": ProposalDetail,
    "Proposals": Proposals,
    "ProposalsHub": ProposalsHub,
    "ProposalsOptimized": ProposalsOptimized,
    "RefinancingCampaigns": RefinancingCampaigns,
    "Reports": Reports,
    "ReportsManager": ReportsManager,
    "ServerClientPortal": ServerClientPortal,
    "ServiceOrchestrator": ServiceOrchestrator,
    "SystemParameters": SystemParameters,
    "SystemTraining": SystemTraining,
    "TaskManager": TaskManager,
    "TechnologyHub": TechnologyHub,
    "UserManagement": UserManagement,
    "VerificationSettings": VerificationSettings,
    "WhatsAppAgent": WhatsAppAgent,
    "WhatsAppSimulation": WhatsAppSimulation,
    "WhatsAppSimulator": WhatsAppSimulator,
    "WhatsAppStrategy": WhatsAppStrategy,
    "WorkflowManager": WorkflowManager,
    "DocumentationPDF": DocumentationPDF,
    "TrainingPDF": TrainingPDF,
}

export const pagesConfig = {
    mainPage: "OperationalHome",
    Pages: PAGES,
    Layout: __Layout,
};