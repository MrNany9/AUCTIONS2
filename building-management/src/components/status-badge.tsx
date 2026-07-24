import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  CHARGE_STATUS_LABELS,
  MAINT_STATUS_LABELS,
  MAINT_PRIORITY_LABELS,
  type ChargeStatus,
  type MaintStatus,
  type MaintPriority,
} from "@/lib/enums";

type Variant = NonNullable<BadgeProps["variant"]>;

const chargeVariant: Record<ChargeStatus, Variant> = {
  OPEN: "neutral",
  PARTIAL: "warning",
  PAID: "success",
  OVERDUE: "destructive",
};

export function ChargeStatusBadge({ status }: { status: string }) {
  const s = status as ChargeStatus;
  return (
    <Badge variant={chargeVariant[s] ?? "neutral"}>
      {CHARGE_STATUS_LABELS[s] ?? status}
    </Badge>
  );
}

const maintVariant: Record<MaintStatus, Variant> = {
  OPEN: "warning",
  IN_PROGRESS: "default",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export function MaintStatusBadge({ status }: { status: string }) {
  const s = status as MaintStatus;
  return (
    <Badge variant={maintVariant[s] ?? "neutral"}>
      {MAINT_STATUS_LABELS[s] ?? status}
    </Badge>
  );
}

const priorityVariant: Record<MaintPriority, Variant> = {
  LOW: "neutral",
  MED: "default",
  HIGH: "warning",
  URGENT: "destructive",
};

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priority as MaintPriority;
  return (
    <Badge variant={priorityVariant[p] ?? "neutral"}>
      {MAINT_PRIORITY_LABELS[p] ?? priority}
    </Badge>
  );
}
