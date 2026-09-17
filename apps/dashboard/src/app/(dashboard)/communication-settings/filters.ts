import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
} from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import {
  COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS,
  COMMUNICATION_SETTING_SHAPE_LABELS,
  COMMUNICATION_SETTING_TYPE_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const communicationSettingFilters = (
  companies: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "company",
    kind: "select",
    label: "Company",
    placeholder: "All companies",
    options: companies.map((company) => ({
      value: company.uuid,
      label: companyOptionLabel(company),
    })),
  },
  {
    key: "documentType",
    kind: "select",
    label: "Document type",
    placeholder: "All documents",
    options: communicationSettingDocumentTypes.map((documentType) => ({
      value: documentType,
      label: COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[documentType],
    })),
  },
  {
    key: "communicationType",
    kind: "select",
    label: "Communication type",
    placeholder: "All types",
    options: communicationSettingTypes.map((communicationType) => ({
      value: communicationType,
      label: COMMUNICATION_SETTING_TYPE_LABELS[communicationType],
    })),
  },
  {
    key: "shape",
    kind: "select",
    label: "Shape",
    placeholder: "All shapes",
    options: communicationSettingShapes.map((shape) => ({
      value: shape,
      label: COMMUNICATION_SETTING_SHAPE_LABELS[shape],
    })),
  },
];
