import { Repository } from "abstract/repository";
import {
  BatchStatusFromRow,
  type BatchStatus,
  type BatchStatusInsert,
  type BatchStatusLookup,
  type BatchStatusRow,
} from "./batchStatus.schema";

export class BatchStatusRepository extends Repository<
  BatchStatus,
  BatchStatusRow,
  BatchStatusLookup,
  BatchStatusInsert
> {
  constructor() {
    super("batch_statuses", BatchStatusFromRow, {
      label: "label",
      sortOrder: "sort_order",
      isTerminal: "is_terminal",
      allowsDefectReporting: "allows_defect_reporting",
      isActive: "is_active",
      isInProgress: "is_in_progress",
      isFinished: "is_finished",
      requiresSizeInput: "requires_size_input",
      isPackaging: "is_packaging",
      subtractDefects: "subtract_defects",
      isMilestone: "is_milestone",
      isInventoryMilestone: "is_inventory_milestone",
      department: { column: "department_id", extract: (d) => d.department?.id || undefined }
    });
  }
}
