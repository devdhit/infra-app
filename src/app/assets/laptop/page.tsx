'use client'

import { AssetList } from "@/components/assets/asset-list";
import { useTranslation } from "@/hooks/use-translation";
import { AssetColumn, AssetFormField } from "@/types/assets";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function LaptopAssetsPage() {
  const { t, loading } = useTranslation();

  const columns: AssetColumn[] = [
    {
      key: "dept",
      label: t('assets.laptop.department') || "Department"
    },
    {
      key: "barcode",
      label: t('assets.laptop.assetTag') || "Barcode"
    },
    {
      key: "sapBarcode",
      label: t('assets.laptop.sapBarcode') || "SAP Barcode"
    },
    {
      key: "dateBuy",
      label: t('assets.laptop.purchaseDate') || "Date Buy",
      render: (date: string) => date ? formatDate(date) : "-"
    },
    {
      key: "user",
      label: t('assets.laptop.assignedTo') || "User",
      render: (user: any) => user?.name || "-"
    },
    {
      key: "email",
      label: t('auth.email') || "Email"
    },
    {
      key: "model",
      label: t('assets.laptop.model') || "Model"
    },
    {
      key: "status",
      label: t('assets.laptop.status') || "Status"
    },
    // custom_fields would be added here dynamically if needed
  ];
  
  const formFields: AssetFormField[] = [
    {
      name: "dept",
      label: t('assets.laptop.department') || "Department",
      type: "text",
      required: true,
      placeholder: t('assets.laptop.department') || "IT Department"
    },
    {
      name: "barcode",
      label: t('assets.laptop.assetTag') || "Barcode",
      type: "text",
      required: true,
      placeholder: t('assets.laptop.assetTag') || "LAPTOP123456"
    },
    {
      name: "sapBarcode",
      label: t('assets.laptop.sapBarcode') || "SAP Barcode",
      type: "text",
      placeholder: t('assets.laptop.sapBarcode') || "SAP-LAPTOP123456"
    },
    {
      name: "dateBuy",
      label: t('assets.laptop.purchaseDate') || "Date Buy",
      type: "date"
    },
    {
      name: "email",
      label: t('auth.email') || "Email",
      type: "email",
      placeholder: "user@example.com"
    },
    {
      name: "model",
      label: t('assets.laptop.model') || "Model",
      type: "text",
      placeholder: t('assets.laptop.model') || "ThinkPad X1 Carbon"
    },
    { 
      name: "status", 
      label: t('assets.laptop.status') || "Status", 
      type: "select", 
      required: true,
      options: [
        { label: t('assets.status.active') || "Active", value: "active" },
        { label: t('assets.status.inactive') || "Inactive", value: "inactive" },
        { label: t('assets.status.maintenance') || "Maintenance", value: "maintenance" },
        { label: t('assets.status.retired') || "Retired", value: "retired" },
      ]
    },
    {
      name: "note",
      label: t('assets.laptop.notes') || "Note",
      type: "textarea",
      placeholder: t('assets.laptop.notes') || "Additional information about this asset"
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
      assetType="laptop"
      title={t('assets.laptop.title') || "Laptop"}
      columns={columns}
      formFields={formFields}
    />
  );
}