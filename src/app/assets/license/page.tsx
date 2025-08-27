'use client'

import { AssetList } from "@/components/assets/asset-list";
import { useTranslation } from "@/hooks/use-translation";
import { AssetColumn, AssetFormField } from "@/types/assets";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function LicenseAssetsPage() {
  const { t, loading } = useTranslation();

  const columns: AssetColumn[] = [
    {
      key: "dept",
      label: t('assets.license.dept') || "Department"
    },
    {
      key: "deviceName",
      label: t('assets.license.deviceName') || "Device Name"
    },
    {
      key: "userName",
      label: t('assets.license.userName') || "User Name"
    },
    {
      key: "productType",
      label: t('assets.license.productType') || "Product Type"
    },
    {
      key: "productKey",
      label: t('assets.license.productKey') || "Product Key"
    },
    {
      key: "model",
      label: t('assets.license.model') || "Model"
    },
    {
      key: "pc",
      label: t('assets.license.pc') || "PC"
    },
    {
      key: "mac",
      label: t('assets.license.mac') || "MAC Address"
    },
    {
      key: "ip",
      label: t('assets.license.ip') || "IP Address"
    },
    {
      key: "date",
      label: t('assets.license.date') || "Date",
      render: (date: string) => date ? formatDate(date) : "-"
    },
    {
      key: "updateStatus",
      label: t('assets.license.updateStatus') || "Update Status"
    },
  ];
  
  const formFields: AssetFormField[] = [
    {
      name: "dept",
      label: t('assets.license.dept') || "Department",
      type: "text"
    },
    {
      name: "deviceName",
      label: t('assets.license.deviceName') || "Device Name",
      type: "text"
    },
    {
      name: "userName",
      label: t('assets.license.userName') || "User Name",
      type: "text"
    },
    {
      name: "productType",
      label: t('assets.license.productType') || "Product Type",
      type: "text",
      required: true
    },
    {
      name: "productKey",
      label: t('assets.license.productKey') || "Product Key",
      type: "text",
      required: true
    },
    {
      name: "model",
      label: t('assets.license.model') || "Model",
      type: "text"
    },
    {
      name: "pc",
      label: t('assets.license.pc') || "PC",
      type: "text"
    },
    {
      name: "mac",
      label: t('assets.license.mac') || "MAC Address",
      type: "text"
    },
    {
      name: "ip",
      label: t('assets.license.ip') || "IP Address",
      type: "text"
    },
    {
      name: "date",
      label: t('assets.license.date') || "Date",
      type: "date"
    },
    { 
      name: "updateStatus", 
      label: t('assets.license.updateStatus') || "Status", 
      type: "select", 
      options: [
        { label: t('assets.status.active') || "Active", value: "active" },
        { label: t('assets.status.expired') || "Expired", value: "expired" },
        { label: t('assets.status.pending') || "Pending", value: "pending" },
      ]
    },
    {
      name: "note",
      label: t('assets.license.note') || "Note",
      type: "textarea"
    },
  ];

  // Show loading state while translations are loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <AssetList
      assetType="license"
      title={t('assets.license.title') || "License"}
      columns={columns}
      formFields={formFields}
    />
  );
}