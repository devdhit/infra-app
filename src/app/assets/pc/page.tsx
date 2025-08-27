'use client'

import { AssetList } from "@/components/assets/asset-list";
import { useTranslation } from "@/hooks/use-translation";
import { AssetColumn, AssetFormField } from "@/types/assets";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function PCAssetsPage() {
  const { t, loading } = useTranslation();

  // Define columns for the PC assets table based on the Prisma schema in the specified order
  const columns: AssetColumn[] = [
    {
      key: "dept",
      label: t('assets.pc.dept') || "Department"
    },
    {
      key: "cpuBarcode",
      label: t('assets.pc.cpuBarcode') || "CPU Barcode"
    },
    {
      key: "cpuSapBarcode",
      label: t('assets.pc.cpuSapBarcode') || "CPU SAP Barcode"
    },
    {
      key: "monitorBarcode",
      label: t('assets.pc.monitorBarcode') || "Monitor Barcode"
    },
    {
      key: "monitorSapBarcode",
      label: t('assets.pc.monitorSapBarcode') || "Monitor SAP Barcode"
    },
    {
      key: "upsBarcode",
      label: t('assets.pc.upsBarcode') || "UPS Barcode"
    },
    {
      key: "upsSapBarcode",
      label: t('assets.pc.upsSapBarcode') || "UPS SAP Barcode"
    },
    {
      key: "pcName",
      label: t('assets.pc.pcName') || "PC Name"
    },
    {
      key: "user",
      label: t('assets.pc.user') || "User",
      render: (user: any) => user?.name || "-"
    },
    {
      key: "status",
      label: t('assets.pc.status') || "Status",
      render: (value: string) => {
        const statusClass: Record<string, string> = {
          active: "bg-green-100 text-green-800",
          inactive: "bg-gray-100 text-gray-800",
          maintenance: "bg-yellow-100 text-yellow-800",
          retired: "bg-red-100 text-red-800"
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[value] || ""}`}>
            {t(`assets.status.${value}`) || value}
          </span>
        );
      }
    },
    {
      key: "note",
      label: t('assets.pc.note') || "Note"
    }
    // custom_fields would be added here dynamically if needed
  ];

  // Define form fields for creating/editing PC assets based on the Prisma schema
  const formFields: AssetFormField[] = [
    {
      name: "dept",
      label: t('assets.pc.dept') || "Department",
      type: "text",
      required: true,
      placeholder: "IT Department"
    },
    {
      name: "cpuBarcode",
      label: t('assets.pc.cpuBarcode') || "CPU Barcode",
      type: "text",
      required: true,
      placeholder: "CPU123456"
    },
    {
      name: "cpuSapBarcode",
      label: t('assets.pc.cpuSapBarcode') || "CPU SAP Barcode",
      type: "text",
      placeholder: "SAP-CPU123456"
    },
    {
      name: "monitorBarcode",
      label: t('assets.pc.monitorBarcode') || "Monitor Barcode",
      type: "text",
      placeholder: "MON123456"
    },
    {
      name: "monitorSapBarcode",
      label: t('assets.pc.monitorSapBarcode') || "Monitor SAP Barcode",
      type: "text",
      placeholder: "SAP-MON123456"
    },
    {
      name: "upsBarcode",
      label: t('assets.pc.upsBarcode') || "UPS Barcode",
      type: "text",
      placeholder: "UPS123456"
    },
    {
      name: "upsSapBarcode",
      label: t('assets.pc.upsSapBarcode') || "UPS SAP Barcode",
      type: "text",
      placeholder: "SAP-UPS123456"
    },
    {
      name: "pcName",
      label: t('assets.pc.pcName') || "PC Name",
      type: "text",
      required: true,
      placeholder: "Workstation-001"
    },
    {
      name: "status",
      label: t('assets.pc.status') || "Status",
      type: "select",
      required: true,
      options: [
        { label: t('assets.status.active') || "Active", value: "active" },
        { label: t('assets.status.inactive') || "Inactive", value: "inactive" },
        { label: t('assets.status.maintenance') || "Maintenance", value: "maintenance" },
        { label: t('assets.status.retired') || "Retired", value: "retired" }
      ]
    },
    {
      name: "note",
      label: t('assets.pc.note') || "Note",
      type: "textarea",
      placeholder: "Additional information about this asset"
    }
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
      assetType="pc"
      title={t('assets.pc.title') || "PC"}
      columns={columns}
      formFields={formFields}
    />
  );
}