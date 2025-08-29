import { AssetType } from "@/types/assets";
import { useTranslation } from "@/hooks/use-translation";
import { formatDate } from "@/lib/utils";

// This configuration ensures consistent styling and component usage across all asset types
export const getAssetTypes = (t: ReturnType<typeof useTranslation>['t']): AssetType[] => [
  {
    name: "PC",
    key: "pc",
    columns: [
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
        key: "userName",
        label: t('assets.pc.user') || "User",
        render: (userName: string) => userName || "-"
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
    ],
    formFields: [
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
        name: "userName",
        label: t('assets.pc.user') || "User",
        type: "text",
        placeholder: "John Doe or john.doe@example.com"
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
    ]
  },
  {
    name: "Laptop",
    key: "laptop",
    columns: [
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
        label: t('assets.laptop.status') || "Status",
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
      }
    ],
    formFields: [
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
      }
    ]
  },
  {
    name: "Printer",
    key: "printer",
    columns: [
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
      }
    ],
    formFields: [
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
      }
    ]
  },
  {
    name: "License",
    key: "license",
    columns: [
      {
        key: "deviceName",
        label: t('assets.license.softwareName') || "Software Name"
      },
      {
        key: "productKey",
        label: t('assets.license.licenseKey') || "License Key"
      },
      {
        key: "userName",
        label: t('assets.license.assignedTo') || "Assigned To"
      },
      {
        key: "date",
        label: t('assets.license.purchaseDate') || "Purchase Date",
        render: (date: string) => date ? formatDate(date) : "-"
      },
      {
        key: "updateStatus",
        label: t('assets.license.status') || "Status",
        render: (value: string) => {
          const statusClass: Record<string, string> = {
            active: "bg-green-100 text-green-800",
            expired: "bg-red-100 text-red-800",
            inactive: "bg-gray-100 text-gray-800"
          };
          
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[value] || ""}`}>
              {t(`assets.status.${value}`) || value}
            </span>
          );
        }
      }
    ],
    formFields: [
      {
        name: "deviceName",
        label: t('assets.license.softwareName') || "Software Name",
        type: "text",
        required: true,
        placeholder: "Microsoft Office 365"
      },
      {
        name: "productKey",
        label: t('assets.license.licenseKey') || "License Key",
        type: "text",
        required: true,
        placeholder: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
      },
      {
        name: "userName",
        label: t('assets.license.assignedTo') || "Assigned To",
        type: "text",
        placeholder: "John Doe"
      },
      {
        name: "date",
        label: t('assets.license.purchaseDate') || "Purchase Date",
        type: "date"
      },
      { 
        name: "updateStatus", 
        label: t('assets.license.status') || "Status", 
        type: "select", 
        required: true,
        options: [
          { label: t('assets.status.active') || "Active", value: "active" },
          { label: t('assets.status.expired') || "Expired", value: "expired" },
          { label: t('assets.status.inactive') || "Inactive", value: "inactive" },
        ]
      },
      {
        name: "note",
        label: t('assets.license.note') || "Note",
        type: "textarea",
        placeholder: "Additional information about this license"
      }
    ]
  },
  {
    name: "WarehouseIT",
    key: "warehouse",
    columns: [
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
        label: t('assets.warehouse.status') || "Status",
        render: (value: string) => {
          const statusClass: Record<string, string> = {
            available: "bg-green-100 text-green-800",
            reserved: "bg-blue-100 text-blue-800",
            used: "bg-yellow-100 text-yellow-800",
            maintenance: "bg-red-100 text-red-800"
          };
          
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[value] || ""}`}>
              {t(`assets.status.${value}`) || value}
            </span>
          );
        }
      }
    ],
    formFields: [
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
      }
    ]
  }
];
