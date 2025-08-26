'use client'

import { AssetList } from "@/components/assets/asset-list";

export default function LicenseAssetsPage() {
  const columns = [
    { key: "productType", label: "Product Type" },
    { key: "productKey", label: "Product Key" },
    { key: "userName", label: "User" },
    { key: "dept", label: "Department" },
    { key: "updateStatus", label: "Status" },
    { key: "createdAt", label: "Created", render: (date: string) => new Date(date).toLocaleDateString() },
  ];
  
  const formFields = [
    { name: "productType", label: "Product Type", type: "text", required: true },
    { name: "productKey", label: "Product Key", type: "text", required: true },
    { name: "deviceName", label: "Device Name", type: "text" },
    { name: "userName", label: "User Name", type: "text" },
    { name: "dept", label: "Department", type: "text" },
    { name: "model", label: "Model", type: "text" },
    { name: "pc", label: "PC", type: "text" },
    { name: "mac", label: "MAC Address", type: "text" },
    { name: "ip", label: "IP Address", type: "text" },
    { 
      name: "updateStatus", 
      label: "Status", 
      type: "select", 
      options: [
        { label: "Active", value: "active" },
        { label: "Expired", value: "expired" },
        { label: "Pending", value: "pending" },
      ]
    },
    { name: "note", label: "Note", type: "textarea" },
  ];

  return (
    <AssetList
      assetType="license"
      title="License Assets"
      columns={columns}
      formFields={formFields}
    />
  );
}