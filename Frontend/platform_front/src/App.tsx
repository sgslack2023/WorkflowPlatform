import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout.tsx'
import MainLayout from './layouts/MainLayout.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import LoginPage from './apps/core/pages/LoginPage.tsx'
import RegisterPage from './apps/core/pages/RegisterPage.tsx'

// Membership Sub-Module
import MembershipLayout from './apps/core/layouts/MembershipLayout.tsx'
import OrganizationsPage from './apps/core/pages/OrganizationsPage.tsx'
import UsersPage from './apps/core/pages/UsersPage.tsx'

// Agents Sub-Module
import AgentsLayout from './apps/agents/layouts/AgentsLayout.tsx'
import LLMProviderPage from './apps/agents/pages/LLMProviderPage.tsx'
import AgentConfigPage from './apps/agents/pages/AgentConfigPage.tsx'
import AgentUtilitiesPage from './apps/agents/pages/AgentUtilitiesPage.tsx'
import AgentDefinitionPage from './apps/agents/pages/AgentDefinitionPage.tsx'

// Data Sources Sub-Module
import DataSourcesLayout from './apps/datasources/layouts/DataSourcesLayout.tsx'
import DataSourcesPage from './apps/datasources/pages/DataSourcesPage.tsx'
import DynamicTablesPage from './apps/datasources/pages/DynamicTablesPage.tsx'

// Workflows Sub-Module
import WorkflowsLayout from './apps/workflows/layouts/WorkflowsLayout.tsx'
import WorkflowList from './apps/workflows/pages/WorkflowList.tsx'
import CreateFlowPage from './apps/workflows/pages/CreateFlowPage.tsx'

// Tools Sub-Module
import ToolsLayout from './apps/tools/layouts/ToolsLayout.tsx'
import ToolConfigurationPage from './apps/tools/pages/ToolConfigurationPage.tsx'
import ToolLibrary from './apps/tools/pages/ToolLibrary.tsx'
import MyToolsPage from './apps/tools/pages/MyToolsPage.tsx'

// Apps Sub-Module
import AppsRuntimeLayout from './apps/apps_runtime/layouts/AppsRuntimeLayout.tsx'
import AppGallery from './apps/apps_runtime/pages/AppGallery.tsx'
import WorkflowComponentsPage from './apps/apps_runtime/pages/WorkflowComponentsPage.tsx'
const AppDesigner = React.lazy(() => import('./apps/apps_runtime/pages/AppDesigner.tsx'));
const AppViewer = React.lazy(() => import('./apps/apps_runtime/pages/AppViewer.tsx'));

const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ padding: '0.5rem 1.5rem' }}>
    <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>{title}</h1>
    <p style={{ margin: 0, color: '#666' }}>This module is currently under development.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Flow */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Route>

        {/* Protected App Flow */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Workflows Module with its own rail */}
            <Route path="/workflows" element={<WorkflowsLayout />}>
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<WorkflowList />} />
              <Route path="create" element={<CreateFlowPage />} />
            </Route>

            {/* Agents Module with its own rail */}
            <Route path="/agents" element={<AgentsLayout />}>
              <Route index element={<Navigate to="llm-provider" replace />} />
              <Route path="llm-provider" element={<LLMProviderPage />} />
              <Route path="config" element={<AgentConfigPage />} />
              <Route path="utilities" element={<AgentUtilitiesPage />} />
              <Route path="definition" element={<AgentDefinitionPage />} />
            </Route>

            <Route path="/datasources" element={<DataSourcesLayout />}>
              <Route index element={<Navigate to="source" replace />} />
              <Route path="source" element={<DataSourcesPage />} />
              <Route path="dynamic-table" element={<DynamicTablesPage />} />
            </Route>

            {/* Membership Module with its own rail */}
            <Route path="/membership" element={<MembershipLayout />}>
              <Route index element={<Navigate to="organizations" replace />} />
              <Route path="organizations" element={<OrganizationsPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>

            {/* Tools Module with its own rail */}
            <Route path="/tools" element={<ToolsLayout />}>
              <Route index element={<Navigate to="library" replace />} />
              <Route path="library" element={<ToolLibrary />} />
              <Route path="my-tools" element={<MyToolsPage />} />
              <Route path="configure/:id" element={<ToolConfigurationPage />} />
            </Route>

            {/* Apps Module */}
            <Route path="/apps" element={<AppsRuntimeLayout />}>
              <Route index element={<Navigate to="gallery" replace />} />
              <Route path="gallery" element={<AppGallery />} />
              <Route path="components" element={<WorkflowComponentsPage />} />
              <Route path="designer/:slug" element={
                <React.Suspense fallback={<div>Loading Designer...</div>}>
                  <AppDesigner />
                </React.Suspense>
              } />
              <Route path="viewer/:slug" element={
                <React.Suspense fallback={<div>Loading App...</div>}>
                  <AppViewer />
                </React.Suspense>
              } />
            </Route>

            <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
