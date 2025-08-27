'use client'

import { AssetList } from "@/components/assets/asset-list";
import { useTranslation } from "@/hooks/use-translation";
import { AssetColumn, AssetFormField } from "@/types/assets";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function PrinterAssetsPage() {
  const { t, loading } = useTranslation();

  const columns: AssetColumn[] = [
    {
      key: "dept",
      label: t('assets.printer.department') || "Department"
    },
    {
      key: "location",
      label: t('assets.printer.location') || "Location"
    },
    {
      key: "ip",
      label: t('assets.printer.ip') || "IP Address"
    },
    {
      key: "model",
      label: t('assets.printer.model') || "Model"
    },
    { 
      key: "color", 
      label: t('assets.printer.color') || "Color",
      render: (value: string) => value === "true" ? t('assets.printer.colorValue') || "Color" : t('assets.printer.bw') || "Black & White"
    },
    {
      key: "barcode",
      label: t('assets.printer.barcode') || "Barcode"
    },
    {
      key: "sapCode",
      label: t('assets.printer.sapCode') || "SAP Code"
    },
    {
      key: "date",
      label: t('assets.printer.date') || "Date",
      render: (date: string) => date ? formatDate(date) : "-"
    },
    {
      key: "note",
      label: t('assets.printer.note') || "Note"
    },
    // custom_fields would be added here dynamically if needed
  ];
  
  const formFields: AssetFormField[] = [
    {
      name: "dept",
      label: t('assets.printer.department') || "Department",
      type: "text",
      required: true,
      placeholder: t('assets.printer.department') || "IT Department"
    },
    {
      name: "location",
      label: t('assets.printer.location') || "Location",
      type: "text",
      placeholder: t('assets.printer.location') || "Building A, Floor 2"
    },
    {
      name: "ip",
      label: t('assets.printer.ip') || "IP Address",
      type: "text",
      placeholder: "192.168.1.100"
    },
    {
      name: "model",
      label: t('assets.printer.model') || "Model",
      type: "text",
      placeholder: t('assets.printer.model') || "HP LaserJet Pro"
    },
    { 
      name: "color", 
      label: t('assets.printer.color') || "Color", 
      type: "select", 
      options: [
        { label: t('assets.printer.bw') || "Black & White", value: "false" },
        { label: t('assets.printer.colorValue') || "Color", value: "true" },
      ]
    },
    {
      name: "barcode",
      label: t('assets.printer.barcode') || "Barcode",
      type: "text",
      required: true,
      placeholder: t('assets.printer.barcode') || "PRINTER123456"
    },
    {
      name: "sapCode",
      label: t('assets.printer.sapCode') || "SAP Code",
      type: "text",
      placeholder: t('assets.printer.sapCode') || "SAP-PRINTER123456"
    },
    {
      name: "date",
      label: t('assets.printer.date') || "Date",
      type: "date"
    },
    {
      name: "note",
      label: t('assets.printer.note') || "Note",
      type: "textarea",
      placeholder: t('assets.printer.note') || "Additional information about this asset"
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
      assetType="printer"
      title={t('assets.printer.title') || "Printer"}
      columns={columns}
      formFields={formFields}
    />
  );
}