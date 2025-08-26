'use client'

import { AssetList } from "@/components/assets/asset-list";

export default function PrinterAssetsPage() {
  const columns = [
    { key: "barcode", label: "Barcode" },
    { key: "model", label: "Model" },
    { key: "dept", label: "Department" },
    { key: "ip", label: "IP Address" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created", render: (date: string) => new Date(date).toLocaleDateString() },
  ];
  
  const formFields = [
    { name: "barcode", label: "Barcode", type: "text", required: true },
    { name: "sapCode", label: "SAP Code", type: "text" },
    { name: "model", label: "Model", type: "text" },
    { name: "dept", label: "Department", type: "text", required: true },
    { name: "location", label: "Location", type: "text" },
    { name: "ip", label: "IP Address", type: "text" },
    { 
      name: "color", 
      label: "Color", 
      type: "select", 
      options: [
        { label: "Black & White", value: "false" },
        { label: "Color", value: "true" },
      ]
    },
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
      assetType="printer"
      title="Printer Assets"
      columns={columns}
      formFields={formFields}
    />
  );
}