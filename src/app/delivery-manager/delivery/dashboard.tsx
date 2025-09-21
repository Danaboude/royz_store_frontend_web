"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from '@/contexts/I18nContext';
// Import the personnel management component (reuse existing logic)
import PersonnelTab from "./PersonnelTab";
import AssignmentsTab from './AssignmentsTab';
import TrackingTab from './TrackingTab';
import ZonesTab from './ZonesTab';

type Tab = {
  key: string;
  label: (t: (key: string) => string) => string;
};
const TABS: Tab[] = [
  { key: "personnel", label: (t) => t("delivery.personnel") },
  { key: "assignments", label: (t) => t("delivery.assignments") },
  { key: "tracking", label: (t) => t("delivery.tracking") },
  { key: "zones", label: (t) => t("delivery.zones") },
];

export default function DeliveryDashboard() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("personnel");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("delivery.dashboard")}</h1>
        <p className="text-gray-600">{t("delivery.dashboardDesc")}</p>
      </div>
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold transition rounded-t-md focus:outline-none ${
              activeTab === tab.key
                ? "bg-white border-x border-t border-gray-200 border-b-0 text-blue-600 shadow-sm"
                : "bg-gray-100 text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label(t)}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div className="bg-white rounded-b-lg shadow p-6 min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === "personnel" && (
            <motion.div
              key="personnel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <PersonnelTab />
            </motion.div>
          )}
          {activeTab === "assignments" && (
            <motion.div
              key="assignments"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <AssignmentsTab />
            </motion.div>
          )}
          {activeTab === "tracking" && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <TrackingTab />
            </motion.div>
          )}
          {activeTab === "zones" && (
            <motion.div
              key="zones"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <ZonesTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 