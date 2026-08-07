import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const AUDIT_ACTIONS = ["FINALIZED", "REOPENED"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

const AuditLogSchema = new Schema(
  {
    allocationGroup: { type: Schema.Types.ObjectId, ref: "AllocationGroup", required: true },
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

AuditLogSchema.index({ allocationGroup: 1, createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema> & { _id: Types.ObjectId };
export const AuditLog: Model<AuditLogDoc> = models.AuditLog || model<AuditLogDoc>("AuditLog", AuditLogSchema);
