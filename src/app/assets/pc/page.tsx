'use client'

import { AssetList } from "@/components/assets/asset-list";

export default function PCAssetsPage() {
  const columns = [
    { key: "cpuBarcode", label: "CPU Barcode" },
    { key: "pcName", label: "PC Name" },
    { key: "dept", label: "Department" },
    { key: "user", label: "User", render: (user: any) => user?.name || "-" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created", render: (date: string) => new Date(date).toLocaleDateString() },
  ];
  
  const formFields = [
    { name: "cpuBarcode", label: "CPU Barcode", type: "text", required: true },
    { name: "cpuSapBarcode", label: "CPU SAP Barcode", type: "text" },
    { name: "monitorBarcode", label: "Monitor Barcode", type: "text" },
    { name: "monitorSapBarcode", label: "Monitor SAP Barcode", type: "text" },
    { name: "upsBarcode", label: "UPS Barcode", type: "text" },
    { name: "upsSapBarcode", label: "UPS SAP Barcode", type: "text" },
    { name: "pcName", label: "PC Name", type: "text", required: true },
    { name: "dept", label: "Department", type: "text", required: true },
    { 
      name: "status", 
      label: "Status", 
      type: "select", 
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Maintenance", value: "maintenance" },
        { label: "Retired", value: "retired" },
      ]
    },
    { name: "note", label: "Note", type: "textarea" },
  ];

  return (
    <AssetList
      assetType="pc"
      title="PC Assets"
      columns={columns}
      formFields={formFields}
    />
  );
}