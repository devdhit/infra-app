'use client'

import { AssetList } from "@/components/assets/asset-list";
import { useTranslation } from "@/hooks/use-translation";
import { AssetColumn, AssetFormField } from "@/types/assets";
import { Card } from "@/components/ui/card";

export default function WarehouseAssetsPage() {
  const { t, loading } = useTranslation();

  const columns: AssetColumn[] = [
    {
      key: "dept",
      label: t('assets.warehouse.dept') || "Department"
    },
    {
      key: "cpuBarcode",
      label: t('assets.warehouse.cpuBarcode') || "CPU Barcode"
    },
    {
      key: "cpuSapBarcode",
      label: t('assets.warehouse.cpuSapBarcode') || "CPU SAP Barcode"
    },
    {
      key: "monitorBarcode",
      label: t('assets.warehouse.monitorBarcode') || "Monitor Barcode"
    },
    {
      key: "monitorSapBarcode",
      label: t('assets.warehouse.monitorSapBarcode') || "Monitor SAP Barcode"
    },
    {
      key: "upsBarcode",
      label: t('assets.warehouse.upsBarcode') || "UPS Barcode"
    },
    {
      key: "upsSapBarcode",
      label: t('assets.warehouse.upsSapBarcode') || "UPS SAP Barcode"
    },
    {
      key: "status",
      label: t('assets.warehouse.status') || "Status"
    },
    // custom_fields would be added here dynamically if needed
  ];
  
  const formFields: AssetFormField[] = [
    {
      name: "dept",
      label: t('assets.warehouse.dept') || "Department",
      type: "text",
      placeholder: t('assets.warehouse.dept') || "IT Department"
    },
    {
      name: "cpuBarcode",
      label: t('assets.warehouse.cpuBarcode') || "CPU Barcode",
      type: "text",
      placeholder: t('assets.warehouse.cpuBarcode') || "CPU123456"
    },
    {
      name: "cpuSapBarcode",
      label: t('assets.warehouse.cpuSapBarcode') || "CPU SAP Barcode",
      type: "text",
      placeholder: t('assets.warehouse.cpuSapBarcode') || "SAP-CPU123456"
    },
    {
      name: "monitorBarcode",
      label: t('assets.warehouse.monitorBarcode') || "Monitor Barcode",
      type: "text",
      placeholder: t('assets.warehouse.monitorBarcode') || "MON123456"
    },
    {
      name: "monitorSapBarcode",
      label: t('assets.warehouse.monitorSapBarcode') || "Monitor SAP Barcode",
      type: "text",
      placeholder: t('assets.warehouse.monitorSapBarcode') || "SAP-MON123456"
    },
    {
      name: "upsBarcode",
      label: t('assets.warehouse.upsBarcode') || "UPS Barcode",
      type: "text",
      placeholder: t('assets.warehouse.upsBarcode') || "UPS123456"
    },
    {
      name: "upsSapBarcode",
      label: t('assets.warehouse.upsSapBarcode') || "UPS SAP Barcode",
      type: "text",
      placeholder: t('assets.warehouse.upsSapBarcode') || "SAP-UPS123456"
    },
    { 
      name: "status", 
      label: t('assets.warehouse.status') || "Status", 
      type: "select", 
      options: [
        { label: t('assets.status.available') || "Available", value: "available" },
        { label: t('assets.status.reserved') || "Reserved", value: "reserved" },
        { label: t('assets.status.used') || "Used", value: "used" },
        { label: t('assets.status.maintenance') || "Maintenance", value: "maintenance" },
      ]
    },
    {
      name: "note",
      label: t('assets.warehouse.note') || "Note",
      type: "textarea",
      placeholder: t('assets.warehouse.note') || "Additional information about this asset"
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
      assetType="warehouse"
      title={t('assets.warehouse.title') || "Warehouse"}
      columns={columns}
      formFields={formFields}
    />
  );
}