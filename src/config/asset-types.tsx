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
            working: "bg-green-100 text-green-800",
            leave: "bg-blue-100 text-blue-800",
            repair: "bg-yellow-100 text-yellow-800"
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
        required: false,
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
          { label: t('assets.status.working') || "Working", value: "working" },
          { label: t('assets.status.leave') || "Leave", value: "leave" },
          { label: t('assets.status.repair') || "Repair", value: "repair" }
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
        render: (date: string) => date ? formatDate(date, { year: "numeric", month: "short", day: "numeric" }) : "-"
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
        key: "userName",
        label: t('assets.laptop.userName') || "User Name"
      },
      {
        key: "status",
        label: t('assets.laptop.status') || "Status",
        render: (value: string) => {
          const statusClass: Record<string, string> = {
            working: "bg-green-100 text-green-800",
            leave: "bg-blue-100 text-blue-800",
            repair: "bg-yellow-100 text-yellow-800"
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
        required: false,
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
          { label: t('assets.status.working') || "Working", value: "working" },
          { label: t('assets.status.leave') || "Leave", value: "leave" },
          { label: t('assets.status.repair') || "Repair", value: "repair" }
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
        render: (value: string) => {
          return value || t('assets.printer.bw') || "Black & White";
        }
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
        render: (date: string) => date ? formatDate(date, { year: "numeric", month: "short", day: "numeric" }) : "-"
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
          { label: t('assets.printer.bw') || "Black & White", value: "Black & White" },
          { label: t('assets.printer.colorValue') || "Color", value: "Color" },
        ]
      },
      {
        name: "barcode",
        label: t('assets.printer.barcode') || "Barcode",
        type: "text",
        required: false,
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
        label: t('assets.license.softwareName') || "Software Name",
        hide: true
      },
      {
        key: "productType",
        label: t('assets.license.productType') || "Product Type",
        hide: true
      },
      {
        key: "productKey",
        label: t('assets.license.licenseKey') || "License Key",
        hide: true
      },
      {
        key: "userName",
        label: t('assets.license.userName') || "User Name"
      },
      {
        key: "dept",
        label: t('assets.license.department') || "Department"
      },
      {
        key: "model",
        label: t('assets.license.model') || "Model"
      },
      {
        key: "pc",
        label: t('assets.license.pc') || "PC"
      },
      {
        key: "mac",
        label: t('assets.license.mac') || "MAC Address"
      },
      {
        key: "ip",
        label: t('assets.license.ip') || "IP Address"
      },
      {
        key: "date",
        label: t('assets.license.purchaseDate') || "Purchase Date",
        render: (date: string) => date ? formatDate(date, { year: "numeric", month: "short", day: "numeric" }) : "-"
      },
      {
        key: "status",
        label: t('assets.license.status') || "Status",
        render: (value: string) => {
          const statusClass: Record<string, string> = {
            working: "bg-green-100 text-green-800",
            leave: "bg-blue-100 text-blue-800",
            repair: "bg-yellow-100 text-yellow-800"
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
        name: "productType",
        label: t('assets.license.productType') || "Product Type",
        type: "text",
        placeholder: "Software"
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
        label: t('assets.license.userName') || "User Name",
        type: "text",
        placeholder: "John Doe"
      },
      {
        name: "dept",
        label: t('assets.license.department') || "Department",
        type: "text",
        placeholder: "IT Department"
      },
      {
        name: "model",
        label: t('assets.license.model') || "Model",
        type: "text",
        placeholder: "Professional"
      },
      {
        name: "pc",
        label: t('assets.license.pc') || "PC",
        type: "text",
        placeholder: "PC-001"
      },
      {
        name: "mac",
        label: t('assets.license.mac') || "MAC Address",
        type: "text",
        placeholder: "00:00:00:00:00:00"
      },
      {
        name: "ip",
        label: t('assets.license.ip') || "IP Address",
        type: "text",
        placeholder: "192.168.1.100"
      },
      {
        name: "date",
        label: t('assets.license.purchaseDate') || "Purchase Date",
        type: "date"
      },
      { 
        name: "status", 
        label: t('assets.license.status') || "Status", 
        type: "select", 
        required: true,
        options: [
          { label: t('assets.status.working') || "Working", value: "working" },
          { label: t('assets.status.leave') || "Leave", value: "leave" },
          { label: t('assets.status.repair') || "Repair", value: "repair" }
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
        key: "barcode",
        label: t('assets.warehouse.barcode') || "Barcode"
      },
      {
        key: "sapCode",
        label: t('assets.warehouse.sapCode') || "SAP Code"
      },
      {
        key: "status",
        label: t('assets.warehouse.status') || "Status",
        render: (value: string) => {
          const statusClass: Record<string, string> = {
            working: "bg-green-100 text-green-800",
            leave: "bg-blue-100 text-blue-800",
            repair: "bg-yellow-100 text-yellow-800"
          };
          
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[value] || ""}`}>
              {t(`assets.status.${value}`) || value}
            </span>
          );
        }
      },
      {
        key: "createdAt",
        label: t('assets.warehouse.createdAt') || "Created At",
        render: (date: string) => date ? formatDate(date, { year: "numeric", month: "short", day: "numeric" }) : "-"
      },
      {
        key: "updatedAt",
        label: t('assets.warehouse.updatedAt') || "Updated At",
        render: (date: string) => date ? formatDate(date, { year: "numeric", month: "short", day: "numeric" }) : "-"
      }
    ],
    formFields: [
      {
        name: "barcode",
        label: t('assets.warehouse.barcode') || "Barcode",
        type: "text",
        placeholder: t('assets.warehouse.barcode') || "WH123456"
      },
      {
        name: "sapCode",
        label: t('assets.warehouse.sapCode') || "SAP Code",
        type: "text",
        placeholder: t('assets.warehouse.sapCode') || "SAP-WH123456"
      },
      { 
        name: "status", 
        label: t('assets.warehouse.status') || "Status", 
        type: "select", 
        options: [
          { label: t('assets.status.working') || "Working", value: "working" },
          { label: t('assets.status.leave') || "Leave", value: "leave" },
          { label: t('assets.status.repair') || "Repair", value: "repair" }
        ]
      },
      {
        name: "note",
        label: t('assets.warehouse.note') || "Note",
        type: "textarea",
        placeholder: t('assets.warehouse.note') || "Additional information about this asset"
      }
    ]
  },
  {
    name: "Internet",
    key: "internet",
    columns: [
      {
        key: "dept",
        label: t('assets.internet.department') || "Department"
      },
      {
        key: "manager",
        label: t('assets.internet.manager') || "Manager"
      },
      {
        key: "userName",
        label: t('assets.internet.userName') || "User Name"
      },
      {
        key: "email",
        label: t('auth.email') || "Email"
      },
      {
        key: "ipAddress",
        label: t('assets.internet.ipAddress') || "IP Address"
      },
      {
        key: "internetAccess",
        label: t('assets.internet.internetAccess') || "Internet Access"
      },
      {
        key: "status",
        label: t('assets.internet.status') || "Status",
        render: (value: string) => {
          const statusClass: Record<string, string> = {
            working: "bg-green-100 text-green-800",
            leave: "bg-blue-100 text-blue-800",
            repair: "bg-yellow-100 text-yellow-800",
            有異動: "bg-purple-100 text-purple-800"
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
        label: t('assets.internet.note') || "Note"
      }
    ],
    formFields: [
      {
        name: "dept",
        label: t('assets.internet.department') || "Department",
        type: "text",
        required: true,
        placeholder: t('assets.internet.department') || "IT Department"
      },
      {
        name: "manager",
        label: t('assets.internet.manager') || "Manager",
        type: "text",
        placeholder: t('assets.internet.manager') || "Manager Name"
      },
      {
        name: "userName",
        label: t('assets.internet.userName') || "User Name",
        type: "text",
        placeholder: t('assets.internet.userName') || "John Doe"
      },
      {
        name: "email",
        label: t('auth.email') || "Email",
        type: "email",
        placeholder: "user@example.com"
      },
      {
        name: "ipAddress",
        label: t('assets.internet.ipAddress') || "IP Address",
        type: "text",
        placeholder: "192.168.1.100"
      },
      {
        name: "internetAccess",
        label: t('assets.internet.internetAccess') || "Internet Access",
        type: "text",
        placeholder: t('assets.internet.internetAccess') || "Full Access"
      },
      { 
        name: "status", 
        label: t('assets.internet.status') || "Status", 
        type: "select", 
        required: true,
        options: [
          { label: t('assets.status.working') || "Working", value: "working" },
          { label: t('assets.status.leave') || "Leave", value: "leave" },
          { label: t('assets.status.repair') || "Repair", value: "repair" },
          { label: t('assets.status.有異動') || "Changed", value: "有異動" }
        ]
      },
      {
        name: "note",
        label: t('assets.internet.note') || "Note",
        type: "textarea",
        placeholder: t('assets.internet.note') || "Additional information about this asset"
      }
    ]
  }
];
