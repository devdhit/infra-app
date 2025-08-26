'use client'

import { AssetList } from "@/components/assets/asset-list";

export default function WarehouseAssetsPage() {
  const columns = [
    { key: "cpuBarcode", label: "CPU Barcode" },
    { key: "monitorBarcode", label: "Monitor Barcode" },
    { key: "upsBarcode", label: "UPS Barcode" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created", render: (date: string) => new Date(date).toLocaleDateString() },
  ];
  
  const formFields = [
    { name: "cpuBarcode", label: "CPU Barcode", type: "text" },
    { name: "cpuSapBarcode", label: "CPU SAP Barcode", type: "text" },
    { name: "monitorBarcode", label: "Monitor Barcode", type: "text" },
    { name: "monitorSapBarcode", label: "Monitor SAP Barcode", type: "text" },
    { name: "upsBarcode", label: "UPS Barcode", type: "text" },
    { name: "upsSapBarcode", label: "UPS SAP Barcode", type: "text" },
    { 
      name: "status", 
      label: "Status", 
      type: "select", 
      options: [
        { label: "Available", value: "available" },
        { label: "Reserved", value: "reserved" },
        { label: "Used", value: "used" },
        { label: "Maintenance", value: "maintenance" },
      ]
    },
    { name: "note", label: "Note", type: "textarea" },
  ];

  return (
    <AssetList
      assetType="warehouse"
      title="Warehouse Assets"
      columns={columns}
      formFields={formFields}
    />
  );
}