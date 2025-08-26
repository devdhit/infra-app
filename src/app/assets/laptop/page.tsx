'use client'

import { AssetList } from "@/components/assets/asset-list";

export default function LaptopAssetsPage() {
  const columns = [
    { key: "barcode", label: "Barcode" },
    { key: "model", label: "Model" },
    { key: "dept", label: "Department" },
    { key: "user", label: "User", render: (user: any) => user?.name || "-" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created", render: (date: string) => new Date(date).toLocaleDateString() },
  ];
  
  const formFields = [
    { name: "barcode", label: "Barcode", type: "text", required: true },
    { name: "sapBarcode", label: "SAP Barcode", type: "text" },
    { name: "model", label: "Model", type: "text" },
    { name: "dept", label: "Department", type: "text", required: true },
    { name: "email", label: "Email", type: "email" },
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
      assetType="laptop"
      title="Laptop Assets"
      columns={columns}
      formFields={formFields}
    />
  );
}