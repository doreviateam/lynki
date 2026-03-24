"use client";

import type { ReportHeaderContentProps } from "./ReportHeaderContent.types";
import { ReportHeaderContentBody } from "./ReportHeaderContentBody";

export type { ViewMode } from "./ReportHeaderContent.types";

export function ReportHeaderContent(props: ReportHeaderContentProps) {
  return <ReportHeaderContentBody {...props} />;
}
